export function calcularMontecarlo(
  returns: number[],
  sims: number,
  proy: number,
  seed: number
) {

  // 🔥 seed manual
  let random = mulberry32(seed);

  const n = returns.length;

  const paths: number[][] = [];

  for (let i = 0; i < sims; i++) {

    const path: number[] = [];

    for (let j = 0; j < proy; j++) {
      const idx = Math.floor(random() * n);
      path.push(returns[idx]);
    }

    paths.push(path);
  }

  // 🔥 equity (igual que streamlit)
  const equityPaths = paths.map(p => {
    let acc = 1;
    return p.map(r => {
      acc += r;
      return acc;
    });
  });

  // helpers
  const media = Array.from({ length: proy }, (_, i) =>
    avg(equityPaths.map(p => p[i]))
  );

  const p5 = Array.from({ length: proy }, (_, i) =>
    percentile(equityPaths.map(p => p[i]), 5)
  );

  const p95 = Array.from({ length: proy }, (_, i) =>
    percentile(equityPaths.map(p => p[i]), 95)
  );

  return { media, p5, p95, paths, equityPaths };
}

// ================= helpers =================

function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function percentile(arr: number[], p: number) {
  const sorted = [...arr].sort((a, b) => a - b);
  const i = Math.floor((p / 100) * sorted.length);
  return sorted[i];
}

// 🔥 random con seed (clave)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}