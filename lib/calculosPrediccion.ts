import { reconstruirMix } from "./calculosEstadisticas";

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

export function calcularPrediccion(

  data: any[],
  estrategia: string,
  direccion: string | null,
  dia: string | null,
  recientes = 20

): Prediccion {

  data = reconstruirMix(data);

  const df = data.filter(
    r => String(r["Contabilizar"]).toUpperCase() === "SI"
  );

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

  let tp =
    global.tp * wGlobal +
    reciente.tp * wReciente +
    tpBayes * wContexto;

  let be =
    global.be * wGlobal +
    reciente.be * wReciente +
    beBayes * wContexto;

  let sl =
    global.sl * wGlobal +
    reciente.sl * wReciente +
    slBayes * wContexto;

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
      sinHistorico

  };

}