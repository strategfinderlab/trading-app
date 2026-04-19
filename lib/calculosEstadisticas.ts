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

  const estrategias = columnas.filter(c => !base.includes(c));

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

  // 🔥 mejores por día
  const mejores: any = {};

  dias.forEach((dia, i) => {

    let max = -Infinity;
    let best = null;

    estrategiasAll.forEach(est => {
      const val = tabla[est][i];

      if (val > max) {
        max = val;
        best = est;
      }
    });

    mejores[dia] = max > 0 ? best : null;
  });

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

  const resultados: any[] = [];

  [...estrategias, "MIX"].forEach(est => {

    const serieRaw = data
      .map(r => Number(r[est]))
      .filter(v => !isNaN(v));

    if (serieRaw.length === 0) return;

    const serie = serieRaw.map(v => v / 100);

    const total = serie.length;
    const wins = serie.filter(v => v > 0);
    const losses = serie.filter(v => v < 0);

    const winrate = wins.length / total;

    const avgWin = wins.length ? wins.reduce((a,b)=>a+b,0)/wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a,b)=>a+b,0)/losses.length) : 0;

    const profitFactor = losses.length
      ? wins.reduce((a,b)=>a+b,0) / Math.abs(losses.reduce((a,b)=>a+b,0))
      : 0;

    const expectancy = (winrate * avgWin) - ((1 - winrate) * avgLoss);

    const mean = serie.reduce((a,b)=>a+b,0) / total;
    const std = Math.sqrt(serie.reduce((a,v)=>a + Math.pow(v - mean,2),0)/total);

    const sharpe = std !== 0 ? (mean / std) * Math.sqrt(252) : 0;
    const sqn = std !== 0 ? (mean / std) * Math.sqrt(total) : 0;

    const payoff = avgLoss !== 0 ? avgWin / avgLoss : 0;
    const kelly = payoff !== 0 ? (winrate - (1 - winrate)/payoff) : 0;

    let maxLosses = 0;
    let current = 0;

    serie.forEach(v => {
      if (v < 0) {
        current++;
        maxLosses = Math.max(maxLosses, current);
      } else {
        current = 0;
      }
    });

    const consistency = winrate * profitFactor;

    let equity = [1];
    serie.forEach(r => {
      equity.push(equity[equity.length - 1] * (1 + r));
    });

    let peak = equity[0];
    let maxDD = 0;

    equity.forEach(v => {
      if (v > peak) peak = v;
      const dd = (v - peak) / peak;
      if (dd < maxDD) maxDD = dd;
    });

    const retornoTotal = equity[equity.length - 1] - 1;
    const calmar = maxDD !== 0 ? retornoTotal / Math.abs(maxDD) : 0;

    let riskOfRuin = 1;
    if (avgLoss > 0 && avgWin > 0) {
      const p = winrate;
      const q = 1 - p;
      if (p > q) riskOfRuin = Math.pow(q/p, 100);
    }

    const score =
      expectancy * 500 +
      profitFactor * 2 +
      calmar * 2 +
      consistency * 3 +
      kelly * 5 +
      (1 - Math.abs(maxDD)) * 3;

    resultados.push({
      estrategia: est,
      winrate,
      expectancy,
      profitFactor,
      sharpe,
      sqn,
      maxDD,
      riskOfRuin,
      retornoTotal,
      calmar,
      payoff,
      kelly,
      maxLosses,
      consistency,
      score
    });

  });

  return resultados.sort((a, b) => b.score - a.score);
};

export function calcularDireccion(data: any[], estrategias: string[]) {

  const resultados: any[] = [];

  const df = data.map(row => ({
    ...row,
    "Direc": (row["Direc"] || "").toString().trim().toLowerCase()
  }));

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

    // 🔥 TOP 3 SIN MIX
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
      const pct = total > 0 ? (positivos / total) * 100 : 0;

      resultados.push({
        tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        estrategia: est,
        suma,
        filas: total,
        acierto: pct
      });

    });

  });

  return resultados;
}

export const calcularFiltros = (data: any[]) => {

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