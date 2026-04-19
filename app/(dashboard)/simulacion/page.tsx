"use client";

import { useEffect, useState } from "react";
import { calcularMontecarlo } from "@/lib/montecarlo";
import MontecarloChart from "@/components/charts/MontecarloChart";

function avg(arr:number[]){
  return arr.reduce((a,b)=>a+b,0)/arr.length;
}

function std(arr:number[]){
  const m = avg(arr);
  return Math.sqrt(arr.reduce((a,b)=>a+(b-m)*(b-m),0)/arr.length);
}

export default function SimulacionPage() {

  const [returns, setReturns] = useState<number[]>([]);
  const [sims, setSims] = useState(500);
  const [proy, setProy] = useState(200);
  const [seed, setSeed] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {

    const data = JSON.parse(localStorage.getItem("entradas") || "[]");

    const clean = data
      .filter((r:any)=>r.Contabilizar==="SI")
      .map((r:any)=>{
        let v = String(r.MIX || "")
          .replace("R","")
          .replace("BE","0")
          .replace(",",".");
        return Number(v)/100;
      })
      .filter((v:number)=>!isNaN(v));

    setReturns(clean);

  }, []);

  const run = () => {
    const res = calcularMontecarlo(returns, sims, proy, seed);
    setResult(res);
  };

  const paths = result?.paths || [];
  const equityPaths = result?.equityPaths || [];

  if (returns.length === 0) return <div>No hay datos</div>;

  const percentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;

    const sorted = [...arr].sort((a, b) => a - b);

    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) return sorted[lower];

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  };

  const slMaxSim = paths.map((path:any)=>{
    let streak = 0;
    let max = 0;

    path.forEach((r:number)=>{
      if(r < 0){
        streak++;
        if(streak > max) max = streak;
      } else {
        streak = 0;
      }
    });

    return max;
  }).sort((a:number,b:number)=>a-b);

  const slPeor = percentile(slMaxSim,95);
  const slMedio = percentile(slMaxSim,50);
  const slMejor = percentile(slMaxSim,5);

  let ddAll:number[] = [];

  equityPaths.forEach((eq:any)=>{
    let peak = eq[0];

    eq.forEach((v:number)=>{
      if(v > peak) peak = v;
      const dd = (v/peak) - 1;
      if(!isNaN(dd)) ddAll.push(dd);
    });
  });

  const finalReturns = equityPaths.map((p:any)=>p[p.length-1] - 1);

  const equityReal = returns.reduce((acc:number[], r:number)=>{
    const last = acc.length ? acc[acc.length-1] : 1;
    acc.push(last + r);
    return acc;
  },[]);

  return (
    <div className="text-white">

      {/* INPUTS */}
      <div className="flex gap-6 justify-center mb-6 text-center">

        <div>
          <p className="text-sm text-gray-400 mb-1">Simulaciones</p>
          <input
            type="number"
            value={sims}
            onChange={e=>setSims(Number(e.target.value))}
            className="bg-black border border-[#444] px-3 py-1 w-24"
          />
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Horizonte (trades)</p>
          <input
            type="number"
            value={proy}
            onChange={e=>setProy(Number(e.target.value))}
            className="bg-black border border-[#444] px-3 py-1 w-24"
          />
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Seed</p>
          <input
            type="number"
            value={seed}
            onChange={e=>setSeed(Number(e.target.value))}
            className="bg-black border border-[#444] px-3 py-1 w-24"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={run}
            className="bg-[#d4af37] text-black px-4 py-1"
          >
            Simular
          </button>
        </div>

      </div>

      {!result && (
        <div className="text-center text-gray-400 mb-6">
          Pulsa Simular
        </div>
      )}

      {result && (
        <>
          <div className="mt-6 text-center">

            <h3 className="text-[#d4af37] mb-4">📊 DD Máximo (SL consecutivos)</h3>

            <div className="flex justify-center gap-10 mb-6">

              <div>
                <p className="text-sm text-gray-400">Peor 5%</p>
                <p className="text-xl">{Math.round(slPeor)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Media</p>
                <p className="text-xl">{Math.round(slMedio)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Mejor 5%</p>
                <p className="text-xl">{Math.round(slMejor)}</p>
              </div>

            </div>

            <h3 className="text-[#d4af37] mb-4">🎯 Resultado final esperado</h3>

            <div className="flex justify-center gap-10">

              <div>
                <p className="text-sm text-gray-400">P5</p>
                <p className="text-xl">
                  {(percentile(finalReturns,5)*100).toFixed(2)}%
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Media</p>
                <p className="text-xl">
                  {(avg(finalReturns)*100).toFixed(2)}%
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">P95</p>
                <p className="text-xl">
                  {(percentile(finalReturns,95)*100).toFixed(2)}%
                </p>
              </div>

            </div>

          </div>

          <div className="mt-8">
            <MontecarloChart {...result} equityReal={equityReal} />
          </div>

          <div className="mt-10 text-[#d4af37] text-center">

            <h3 className="mb-4">📈 Insights</h3>

            <p>Trades analizados: <b>{returns.length}</b></p>
            <p>Esperanza (media trade): <b>{avg(returns).toFixed(4)}</b></p>
            <p>Desviación: <b>{std(returns).toFixed(4)}</b></p>
            <p>Winrate: <b>{((returns.filter(r=>r>0).length/returns.length)*100).toFixed(2)}%</b></p>
            <p>Trades perdedores: <b>{((returns.filter(r=>r<0).length/returns.length)*100).toFixed(2)}%</b></p>

          </div>
        </>
      )}

    </div>
  );
}