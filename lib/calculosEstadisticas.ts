export const reconstruirMix = (data: any[]) => {

  const clean = [...data];

  const base = [
    "Fecha","Día semana","Par","Direc",
    "Link antes","Tamaño SL","Comentarios","Link después",
    "Fecha cierre","Duración","SL/TP",
    "Filtro 1","Filtro 2","Contabilizar","MIX","id"
  ];

  const estrategias = Object.keys(clean[0] || {})
    .filter(c => !base.includes(c));

  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

  const mejores: any = {};

  dias.forEach(dia => {

    const filas = clean.filter(r =>
      r["Día semana"] === dia &&
      String(r["Contabilizar"]).toUpperCase() === "SI"
    );

    let mejor = null;
    let mejorVal = -Infinity;

    estrategias.forEach(est => {

      const suma = filas.reduce((acc, row) => {

        let raw = String(row[est] ?? "");

        raw = raw
          .replace("R", "")
          .replace("BE", "0")
          .replace(",", ".");

        const val = Number(raw);

        return acc + (isNaN(val) ? 0 : val);

      }, 0);

      if (suma > mejorVal) {
        mejorVal = suma;
        mejor = est;
      }

    });

    mejores[dia] = mejorVal > 0 ? mejor : null;

  });

  return clean.map(row => {

    const mejor = mejores[row["Día semana"]];

    let mix: number | null = null;

    if (mejor) {

      let raw = String(row[mejor] ?? "");

      raw = raw
        .replace("R", "")
        .replace("BE", "0")
        .replace(",", ".");

      const val = Number(raw);

      if (!isNaN(val)) {
        mix = val;
      }
    }

    return {
      ...row,
      MIX: mix
    };

  });

};

export const calcularEstadisticas = (data: any[]) => {

  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

  // 🔥 limpiar
  const clean = data.filter(r =>
    r["Fecha"] &&
    String(r["Contabilizar"]).toUpperCase() === "SI"
  );

  if (clean.length === 0) return null;

  // 🔥 detectar estrategias
  const columnas = Object.keys(clean[0]);

  const base = [
    "Fecha","Día semana","Par","Direc",
    "Link antes","Tamaño SL","Comentarios","Link después",
    "Fecha cierre","Duración","SL/TP",
    "Filtro 1","Filtro 2","Contabilizar","MIX","id"
  ];

  const estrategias = columnas
    .filter(c => !base.includes(c))
    .filter(c => {
      const val = clean[0][c];
      return !isNaN(parseFloat(val));
    });

  const estrategiasAll = ["MIX", ...estrategias];

  // 🔥 convertir a número
  clean.forEach(row => {
    estrategiasAll.forEach(e => {

      let raw = String(row[e] ?? "");

      raw = raw
        .replace("R", "")
        .replace("BE", "0")
        .replace(",", ".");

      row[e] = Number(raw);
    });
  });

  // 🔥 tabla
  const tabla: any = {};

  estrategiasAll.forEach(est => {

    tabla[est] = [];

    dias.forEach(dia => {

      const filas = clean.filter(r => r["Día semana"] === dia);

      const suma = filas.reduce((acc, row) => {
        const v = Number(row[est]);
        return acc + (isNaN(v) ? 0 : v);
      }, 0);

      tabla[est].push(Number(suma.toFixed(2)));
    });

    const total = tabla[est].reduce((a: number, b: number) => a + b, 0);
    tabla[est].push(Number(total.toFixed(2)));
  });

  // 🔥 mejores por día (SIN MIX)
  const mejores: any = {};

  dias.forEach((dia, i) => {

    let max = -Infinity;
    let best = null;

    estrategias.forEach(est => {

      const val = tabla[est][i];

      if (val > max) {
        max = val;
        best = est;
      }

    });

    // Si todas las estrategias son negativas o 0, no se opera
    mejores[dia] = max > 0 ? best : null;

  });

  // 🔥 reconstruir MIX para que use la mejor estrategia de cada día
  tabla["MIX"] = [];

  dias.forEach((dia, i) => {

    const mejor = mejores[dia];

    if (!mejor) {
      tabla["MIX"].push(0);
    } else {
      tabla["MIX"].push(tabla[mejor][i]);
    }

  });

  const totalMix = tabla["MIX"].reduce(
    (a: number, b: number) => a + b,
    0
  );

  tabla["MIX"].push(Number(totalMix.toFixed(2)));

  // 🔥 Nº FILAS y % ACIERTO
  const filaConteo: number[] = [];
  const filaAcierto: number[] = [];

  dias.forEach((dia) => {

    const estrategia = mejores[dia];

    const filas = clean.filter(r => r["Día semana"] === dia);

    if (!estrategia || filas.length === 0) {
      filaConteo.push(0);
      filaAcierto.push(0);
      return;
    }

    const valores = filas
      .map(r => Number(r[estrategia]))
      .filter(v => !isNaN(v));

    const total = valores.length;
    filaConteo.push(total);

    if (total === 0) {
      filaAcierto.push(0);
    } else {
      const positivos = valores.filter(v => v > 0).length;
      filaAcierto.push(Number(((positivos / total) * 100).toFixed(2)));
   }
  });

  // TOTAL conteo
  filaConteo.push(filaConteo.reduce((a, b) => a + b, 0));

  // MEDIA acierto (solo días con datos)
  const validos = filaAcierto.filter((_, i) => filaConteo[i] > 0);

  const media =
    validos.length > 0
      ? validos.reduce((a, b) => a + b, 0) / validos.length
      : 0;

  filaAcierto.push(Number(media.toFixed(2)));

  return {
    tabla,
    estrategias: estrategiasAll,
    mejores,
    dias,
    filaConteo,
    filaAcierto
  };
};

export const calcularTop3PorDia = (tabla: any, dias: string[]) => {

  const topNombres: any = {};
  const topValores: any = {};

  dias.forEach(dia => {

    const entries = Object.entries(tabla)
      .filter(([est]) => est !== "MIX") //
      .map(([est, valores]: any) => ({
        est,
        val: valores[dias.indexOf(dia)]
      }))
      .filter(e => e.val > 0) // 🔥 quitar ceros

      .sort((a, b) => b.val - a.val)
      .slice(0, 3);

    topNombres[dia] = entries.map(e => e.est);
    topValores[dia] = entries.map(e => e.val);
  });

  return { topNombres, topValores };
};

export const calcularMetricas = (data: any[], estrategias: string[]) => {

  data = reconstruirMix(data);

  // Solo operaciones contabilizadas
  data = data.filter(
    r => String(r["Contabilizar"]).toUpperCase() === "SI"
  );

  const resultados: any[] = [];

  [...estrategias, "MIX"].forEach(est => {

    // Serie en R
    const serieR = data
      .filter(r => est !== "MIX" || r["MIX"] !== null)
      .map(r => Number(r[est]))
      .filter(v => !isNaN(v));

    if (serieR.length === 0) return;

    // Serie porcentual únicamente para Sharpe y SQN
    const seriePct = serieR.map(v => v / 100);

    // Clasificación
    const wins = serieR.filter(v => v > 0);
    const losses = serieR.filter(v => v < 0);
    const be = serieR.filter(v => v === 0);

    const total = serieR.length;

    const tpRate =
      total > 0
        ? wins.length / total
        : 0;

    const beRate =
      total > 0
        ? be.length / total
        : 0;

    const slRate =
      total > 0
        ? losses.length / total
        : 0;

    // Ganancias y pérdidas medias (R)
    const avgWin =
      wins.length
        ? wins.reduce((a, b) => a + b, 0) / wins.length
        : 0;

    const avgLoss =
      losses.length
        ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length)
        : 0;

    // Expectancy en R
    const expectancy =
      (tpRate * avgWin) -
      (slRate * avgLoss);
    // Profit Factor
    const grossProfit =
      wins.reduce((a, b) => a + b, 0);

    const grossLoss =
      Math.abs(
        losses.reduce((a, b) => a + b, 0)
      );

    const profitFactor =
      grossLoss > 0
        ? grossProfit / grossLoss
        : grossProfit > 0
          ? 999
          : 0;

    // Payoff
    const payoff =
      avgLoss > 0
        ? avgWin / avgLoss
        : 0;

    // Kelly
    const kelly =
      payoff > 0
        ? tpRate - (slRate / payoff)
        : 0;

    // Sharpe (sobre R)
    const mediaR =
      serieR.reduce((a, b) => a + b, 0) /
      serieR.length;

    const desviacionR = Math.sqrt(
      serieR.reduce(
        (a, v) => a + Math.pow(v - mediaR, 2),
        0
      ) / serieR.length
    );

    const sharpe =
      desviacionR > 0
        ? mediaR / desviacionR
        : 0;
    // SQN
    const sqn =
      desviacionR > 0
        ? (mediaR / desviacionR) *
          Math.sqrt(serieR.length)
        : 0;
    // Máxima racha de pérdidas
    let maxLosses = 0;
    let actualLosses = 0;

    serieR.forEach(v => {

      if (v < 0) {
        actualLosses++;
        maxLosses = Math.max(
          maxLosses,
          actualLosses
        );
      } else {
        actualLosses = 0;
      }

    });

    // Curva de capital en R
    const equity = [0];

    serieR.forEach(r => {
      equity.push(
        equity[equity.length - 1] + r
      );
    });

        // Max Drawdown en R
    let peak = equity[0];
    let maxDD = 0;

    equity.forEach(v => {

      if (v > peak) {
        peak = v;
      }

      const dd = peak - v;

      if (dd > maxDD) {
        maxDD = dd;
      }

    });

    // Retorno total en R
    const retornoTotal =
      equity[equity.length - 1];

    // Calmar
    const calmar =
      maxDD > 0
        ? retornoTotal / maxDD
        : retornoTotal > 0
          ? 999
          : 0;

    // Score normalizado
    const score =

      expectancy * 60 +

      Math.min(profitFactor, 5) * 8 +

      Math.min(calmar, 10) * 3 +

      Math.min(sharpe, 5) * 3 +

      Math.min(sqn, 6) * 4 +

      20 / (1 + maxDD) +

      payoff * 2 +

      Math.max(0, kelly) * 8 +

      tpRate * 8 +
      beRate * 2 -
      slRate * 10;

    resultados.push({

    estrategia: est,

    tpRate,

    beRate,

    slRate,

    expectancy,

    profitFactor,

    sharpe,

    sqn,

    maxDD,

    retornoTotal,

    calmar,

    payoff,

    kelly,

    maxLosses,

    score

  });

  });

  return resultados.sort(
    (a, b) => b.score - a.score
  );

};

export function calcularDireccion(data: any[], estrategias: string[]) {
  data = reconstruirMix(data);

  // 🔥 Solo operaciones contabilizadas
  const df = data
    .filter(
      row => String(row["Contabilizar"]).toUpperCase() === "SI"
    )
    .map(row => ({
      ...row,
      Direc: (row["Direc"] || "").toString().trim().toLowerCase()
    }));

  const resultados: any[] = [];

  ["alcista", "bajista"].forEach(tipo => {

    const dfTipo = df.filter(r => r["Direc"] === tipo);

    if (dfTipo.length === 0) return;

    const resumen: any = {};

    estrategias.forEach(est => {
      const valores = dfTipo
        .map(r => parseFloat(r[est]))
        .filter(v => !isNaN(v));

      resumen[est] = valores.reduce((a, b) => a + b, 0);
    });

    // TOP 3 (sin MIX)
    const top3 = Object.keys(resumen)
      .sort((a, b) => resumen[b] - resumen[a])
      .slice(0, 3);

    const final = ["MIX", ...top3];

    final.forEach(est => {

      const valores = dfTipo
        .map(r => parseFloat(r[est]))
        .filter(v => !isNaN(v));

      const total = valores.length;
      const suma = valores.reduce((a, b) => a + b, 0);

      const positivos = valores.filter(v => v > 0).length;
      const negativos = valores.filter(v => v < 0).length;
      const be = total - positivos - negativos;

      const pctTP =
        total > 0 ? (positivos / total) * 100 : 0;

      const pctBE =
        total > 0 ? (be / total) * 100 : 0;

      const pctSL =
        total > 0 ? (negativos / total) * 100 : 0;

      resultados.push({
        tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        estrategia: est,
        suma,
        filas: total,
        pctTP,
        pctBE,
        pctSL
      });

    });

  });

  return resultados;
}

export const calcularFiltros = (data: any[]) => {
  data = reconstruirMix(data);
  const res: any[] = [];

  const filtered = data.filter(
    r => String(r["Contabilizar"]).toUpperCase() === "SI"
  );

  const grouped: any = {};

  filtered.forEach(row => {

    console.log({
      f1: row["Filtro 1"],
      f2: row["Filtro 2"],
      mix: row["MIX"],
      contabilizar: row["Contabilizar"]
    });

    const f1 = (row["Filtro 1"] ?? "").toString().trim().toUpperCase();
    const f2 = (row["Filtro 2"] ?? "").toString().trim().toUpperCase();

    if (!f1 && !f2) return;

    const key = `${f1}||${f2}`;

    if (!grouped[key]) {
      grouped[key] = {
        f1,
        f2,
        suma: 0,
        filas: 0,
        tp: 0,
        sl: 0
      };
    }

    let raw = String(row["MIX"] ?? "");

    raw = raw
      .replace("R", "")
      .replace("BE", "0")
      .replace(",", ".");

    const val = parseFloat(raw);

    if (isNaN(val)) return;

    grouped[key].filas++;

    if (val >= 0) grouped[key].tp++;
    else grouped[key].sl++;

    grouped[key].suma += val;

  });

  const result = Object.values(grouped);

  result.sort((a: any, b: any) => b.suma - a.suma);

  console.log("FILTROS FINAL:", result);

  return result;
};

export const calcularTopPorPar = (data: any[]) => {
  data = reconstruirMix(data);
  const filtrado = data.filter(
    r => String(r["Contabilizar"]).toUpperCase() === "SI"
  );

  if (filtrado.length === 0) return null;

  // 🔥 columnas base
  const base = [
    "Fecha","Día semana","Par","Direc",
    "Link antes","Tamaño SL","Comentarios","Link después",
    "Fecha cierre","Duración","SL/TP",
    "Filtro 1","Filtro 2","Contabilizar","MIX","id"
  ];

  const columnas = Object.keys(filtrado[0]);

  // 🔥 estrategias reales
  const estrategias = columnas.filter(c => !base.includes(c));

  // 🔥 suma global (para TOP)
  const sumaGlobal: any = {};

  ["MIX", ...estrategias].forEach(e => sumaGlobal[e] = 0);

  // 🔥 agrupado por par
  const grouped: any = {};

  filtrado.forEach(row => {

    const par = row["Par"];
    if (!par) return;

    if (!grouped[par]) {
      grouped[par] = {};
      ["MIX", ...estrategias].forEach(e => grouped[par][e] = 0);
    }

    ["MIX", ...estrategias].forEach(e => {

      let raw = String(row[e] ?? "");

      raw = raw
        .replace("R", "")
        .replace("BE", "0")
        .replace(",", ".");

      let val = Number(raw);

      // 👇 tu lógica especial Excel
      if (e === "bex2") val = val / 1.5;

      if (!isNaN(val)) {
        grouped[par][e] += val;
        sumaGlobal[e] += val;
      }
    });

  });

  // 🔥 TOP 2 estrategias globales (sin MIX)
  const top = Object.entries(sumaGlobal)
    .filter(([k]) => k !== "MIX")
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k);

  // 🔥 estructura final para gráfico
  const pares = Object.keys(grouped);

  const dataChart = [
    {
      name: "MIX",
      y: pares.map(p => grouped[p]["MIX"] || 0)
    },
    {
      name: top[0],
      y: pares.map(p => grouped[p][top[0]] || 0)
    },
    {
      name: top[1],
      y: pares.map(p => grouped[p][top[1]] || 0)
    }
  ];

  return {
    pares,
    dataChart
  };
};