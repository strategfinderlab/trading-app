const MIN_MUESTRAS_PATRON = 5;
const MAX_LONGITUD_PATRON = 6;
export interface Prediccion {
  tp: number;
  be: number;
  sl: number;

  confianza: number;
  momentum: number;

  muestraTotal: number;
  muestraReciente: number;
  muestraContexto: number;

  score: number;
  estrellas: number;
  recomendacion: string;
  sinHistorico: boolean;
  tpGlobal: number;
  beGlobal: number;
  slGlobal: number;
  patronDetectado: string[];
  longitudPatron: number;
  muestraPatron: number;

  tpPatronPct: number;
  bePatronPct: number;
  slPatronPct: number;

  pesoPatron: number;
}

function pesoReciente(indice: number) {
  return Math.exp(-indice * 0.04);
}

function contarProbabilidades(serie: number[]) {

  const total = serie.length;

  if (total === 0) {
    return {
      tp: 0,
      be: 0,
      sl: 0
    };
  }

  const tp = serie.filter(v => v > 0).length;
  const be = serie.filter(v => v === 0).length;
  const sl = serie.filter(v => v < 0).length;

  return {
    tp: tp / total,
    be: be / total,
    sl: sl / total
  };
}

function contarProbabilidadesPonderadas(serie: number[]) {

  let tp = 0;
  let be = 0;
  let sl = 0;

  let totalPeso = 0;

  [...serie].reverse().forEach((v, i) => {

    const peso = pesoReciente(i);

    totalPeso += peso;

    if (v > 0) tp += peso;
    else if (v < 0) sl += peso;
    else be += peso;

  });

  return {

    tp: tp / totalPeso,
    be: be / totalPeso,
    sl: sl / totalPeso

  };

}

function aplicarBayes(

  prior: number,
  muestra: number,
  global: number,
  fuerza: number

) {

  return (

    prior * muestra +
    global * fuerza

  ) / (muestra + fuerza);

}

function pesoContexto(n: number) {

  if (n <= 5) return 0.10;

  if (n <= 10) return 0.20;

  if (n <= 20) return 0.35;

  if (n <= 40) return 0.50;

  return 0.60;

}

function parseFecha(fecha: string) {
  if (!fecha) return new Date(0);

  const [datePart, timePart] = fecha.split(" ");

  if (!datePart) return new Date(0);

  const [day, month, year] = datePart.split("/").map(Number);

  let hours = 0;
  let minutes = 0;

  if (timePart) {
    const parts = timePart.split(":");
    hours = Number(parts[0]) || 0;
    minutes = Number(parts[1]) || 0;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

export function calcularPrediccion(

  data: any[],
  estrategia: string,
  direccion: string | null,
  dia: string | null,
  recientes = 20

): Prediccion {

  const ultimasMix = data
    .filter(r =>
      String(r["Contabilizar"]).toUpperCase() === "SI" &&
      String(r["Link después"] ?? "").trim() !== ""
    )
    .slice(-10);

  const df = data.filter(r => {

    const contabilizar =
      String(r["Contabilizar"]).toUpperCase() === "SI";

    const finalizada =
     String(r["SL/TP"] ?? "").trim() !== "";

    return contabilizar && finalizada;

  });

  // ==================== PATRÓN DE RESULTADOS ====================

 const dataPatron = df
    .filter(r => {

      const valor = r[estrategia];

      return (
        valor !== "" &&
        valor !== null &&
        valor !== undefined &&
        !isNaN(Number(valor))
      );

    })
    .sort(
        (a,b)=>
        parseFecha(a["Fecha"]).getTime() -
        parseFecha(b["Fecha"]).getTime()
    );

  let resultados: string[];

  if (estrategia === "MIX") {

      resultados = data
          .filter(r =>
              String(r["Contabilizar"]).toUpperCase() === "SI" &&
              String(r["SL/TP"] ?? "").trim() !== ""
          )
          .sort(
              (a, b) =>
                  parseFecha(a["Fecha"]).getTime() -
                  parseFecha(b["Fecha"]).getTime()
          )
          .map(r => String(r["SL/TP"]).trim());

  } else {

      resultados = dataPatron.map(r => {

          const v = Number(r[estrategia]);

          if (v > 0) return "TP";
          if (v < 0) return "SL";
          return "BE";

      });

  }

  const patronActual = resultados.slice(-MAX_LONGITUD_PATRON);
  let patronDetectado: string[] = [];
  let longitudPatron = 0;

  let tpPatron = 0;
  let bePatron = 0;
  let slPatron = 0;

  let muestraPatron = 0;
  let mejorScore = -1;

  for (
      let n = 1;
      n <= Math.min(MAX_LONGITUD_PATRON, patronActual.length);
      n++
  ) {

      const patron = patronActual.slice(-n);

      let tp = 0;
      let be = 0;
      let sl = 0;

      for (let i = 0; i <= resultados.length - n - 1; i++) {

          const secuencia = resultados.slice(i, i + n);

          if (JSON.stringify(secuencia) !== JSON.stringify(patron))
              continue;
          
          const siguiente = resultados[i + n];

          if (siguiente === "TP") tp++;
          else if (siguiente === "BE") be++;
          else sl++;

      }

      const total = tp + be + sl;

      if (total === 0) continue;

      const probabilidad = Math.max(tp, be, sl) / total;

      // puntuación del patrón
      const score =
        probabilidad *
        Math.sqrt(total) *
        Math.pow(n, 1.5);

      if (
          (total >= MIN_MUESTRAS_PATRON || n === 1) &&
          score > mejorScore
      ) {

          mejorScore = score;

          patronDetectado = [...patron];

          longitudPatron = n;

          tpPatron = tp;
          bePatron = be;
          slPatron = sl;

          muestraPatron = total;

      }

  }
  const totalPatron = tpPatron + bePatron + slPatron;

  const tpPatronPct =
    totalPatron > 0 ? tpPatron / totalPatron : 0;

  const bePatronPct =
    totalPatron > 0 ? bePatron / totalPatron : 0;

  const slPatronPct =
    totalPatron > 0 ? slPatron / totalPatron : 0;

  let pesoPatron = 0;

  if (muestraPatron >= 30)
    pesoPatron = 1;

  else if (muestraPatron >= 15)
    pesoPatron = 0.75;

  else if (muestraPatron >= 8)
    pesoPatron = 0.40;

  else
    pesoPatron = 0;

  const serieTotal = df
    .map(r => Number(r[estrategia]))
    .filter(v => !isNaN(v));

  const global = contarProbabilidades(serieTotal);

  const serieReciente = serieTotal.slice(-recientes);

  const reciente =
    contarProbabilidadesPonderadas(serieReciente);

  let contexto = df;

  if (direccion) {

    contexto = contexto.filter(
      r =>
        String(r["Direc"])
          .toLowerCase() === direccion.toLowerCase()
    );

  }

  if (dia) {

    contexto = contexto.filter(
      r => r["Día semana"] === dia
    );

  }

  // Si hay pocas muestras combinadas,
  // intenta usar solo dirección

  let sinHistorico = false;

  // Si el usuario ha elegido un día y no existe ninguna operación,
  // significa que el sistema decidió NO operar ese día.
  if (dia && contexto.length === 0) {

     sinHistorico = true;

  }
  else{

      if (contexto.length < 15 && direccion){

          contexto = df.filter(r =>
              String(r["Direc"]).toLowerCase() === direccion!.toLowerCase()
          );

      }

      if (contexto.length < 15 && dia){

          contexto = df.filter(r =>
              r["Día semana"] === dia
          );

      }

  }

  const serieContexto = contexto
    .map(r => Number(r[estrategia]))
    .filter(v => !isNaN(v));

  const contextoProb =
    contarProbabilidades(serieContexto);

  const fuerza = Math.max(
    5,
    Math.round(serieTotal.length * 0.15)
  );

  const tpBayes = aplicarBayes(
    contextoProb.tp,
    serieContexto.length,
    global.tp,
    fuerza
  );

  const beBayes = aplicarBayes(
    contextoProb.be,
    serieContexto.length,
    global.be,
    fuerza
  );

  const slBayes = aplicarBayes(
    contextoProb.sl,
    serieContexto.length,
    global.sl,
    fuerza
  );

  const wContexto = pesoContexto(serieContexto.length);

  const wReciente = 0.30;

  const wGlobal = 1 - wContexto - wReciente;

  const wRestante = 1 - pesoPatron;

  let tp =
    (global.tp * wGlobal +
    reciente.tp * wReciente +
    tpBayes * wContexto) * wRestante +
    tpPatronPct * pesoPatron;

  let be =
    (global.be * wGlobal +
    reciente.be * wReciente +
    beBayes * wContexto) * wRestante +
    bePatronPct * pesoPatron;

  let sl =
    (global.sl * wGlobal +
    reciente.sl * wReciente +
    slBayes * wContexto) * wRestante +
    slPatronPct * pesoPatron;
  const suma = tp + be + sl;

  tp /= suma;
  be /= suma;
  sl /= suma;

  const confianza = Math.min(
    100,
    40 +
    serieContexto.length * 2 +
    serieTotal.length * 0.4
  );

  const expectancyTotal =
    serieTotal.reduce((a, b) => a + b, 0) /
    serieTotal.length;

  const expectancyReciente =
    serieReciente.reduce((a, b) => a + b, 0) /
    serieReciente.length;

  const momentum =
    expectancyTotal === 0
      ? 0
      : (
          (expectancyReciente - expectancyTotal) /
          Math.abs(expectancyTotal)
        ) * 100;

  const expectancyContexto =
    serieContexto.length > 0
      ? serieContexto.reduce((a, b) => a + b, 0) / serieContexto.length
      : 0;

  let score = 50;

  // Más TP = mejor
  score += tp * 35;

  // Más SL = peor
  score -= sl * 45;

  // Mucho BE tampoco interesa
  score -= be * 10;

  // Si la estrategia mejora recientemente
  score += momentum * 0.15;

  // Expectancy del contexto
  score += expectancyContexto * 4;

  // Más confianza
  score += (confianza - 50) * 0.20;

  // Limitar entre 0 y 100
  score = Math.max(0, Math.min(100, score));

  let estrellas = 1;

  if (score >= 90) estrellas = 5;
  else if (score >= 75) estrellas = 4;
  else if (score >= 60) estrellas = 3;
  else if (score >= 45) estrellas = 2;

  let recomendacion = "";

  if (sinHistorico) {

    recomendacion = "NO OPERAR";

  }
  else if (estrellas === 5) {

    recomendacion = "Oportunidad excelente";

  }
  else if (estrellas === 4) {

    recomendacion = "Buena oportunidad";

  }
  else if (estrellas === 3) {

    recomendacion = "Oportunidad aceptable";

  }
  else if (estrellas === 2) {

    recomendacion = "Conviene esperar";

  }
  else {

    recomendacion = "Evitar operar";

  }

  return {

      tp,
      be,
      sl,

      tpGlobal: global.tp,
      beGlobal: global.be,
      slGlobal: global.sl,

      confianza,
      momentum,

      muestraTotal: serieTotal.length,
      muestraReciente: serieReciente.length,
      muestraContexto: serieContexto.length,

      score,
      estrellas,
      recomendacion,
      sinHistorico,

      patronDetectado,
      longitudPatron,
      muestraPatron,

      tpPatronPct,
      bePatronPct,
      slPatronPct,

      pesoPatron

  };

}