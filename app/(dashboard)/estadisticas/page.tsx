"use client";

import { useEffect, useState } from "react";
import { calcularEstadisticas } from "@/lib/calculosEstadisticas";
import Top3PorDiaChart from "@/components/charts/Top3PorDiaChart";
import { calcularTop3PorDia } from "@/lib/calculosEstadisticas";
import { calcularDireccion } from "@/lib/calculosEstadisticas";
import { calcularMetricas } from "@/lib/calculosEstadisticas";
import { calcularFiltros } from "@/lib/calculosEstadisticas";
import { calcularTopPorPar } from "@/lib/calculosEstadisticas";
import TopPorParChart from "@/components/charts/TopPorParChart";

export default function EstadisticasPage() {

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {

    fetch("/api/entradas")
      .then(res => res.json())
      .then(d => {
        localStorage.setItem("entradas", JSON.stringify(d));
        procesar(d);
      });

  }, []);
  type Filtro = {
    f1: string;
    f2: string;
    suma: number;
    filas: number;
    tp: number;
    sl: number;
  };

  const procesar = (data: any[]) => {
    const res = calcularEstadisticas(data);

    if (!res) return;

    setStats({
      ...res,
      rawData: data
    });
  };

  if (!stats) return null;

  const { tabla, estrategias, dias, filaConteo } = stats;

  const data = stats?.rawData || [];

  const direccion = calcularDireccion(
    data,
    estrategias.filter((e: string) => e !== "MIX")
  );

  const metricas = calcularMetricas(
    data,
    estrategias.filter((e: string) => e !== "MIX")
  );
  const filtros = calcularFiltros(data) as Filtro[];

  const filtrosOrdenados = [...filtros].sort((a, b) => {

    // 🔹 ordenar por filtro1
    const f1Compare = String(a.f1).localeCompare(String(b.f1), undefined, {
      numeric: true,
      sensitivity: "base"
    });

    if (f1Compare !== 0) return f1Compare;

    // 🔹 si filtro1 es igual → ordenar por filtro2
    return String(a.f2).localeCompare(String(b.f2), undefined, {
      numeric: true,
      sensitivity: "base"
    });

  });

  const { topNombres, topValores } = calcularTop3PorDia(tabla, dias);
  const topPar = calcularTopPorPar(data);

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        📊 Cálculos por día de la semana
      </h2>

      {/* ================= TABLA PRINCIPAL ================= */}
      <div className="flex justify-center">
        <table className="border border-[#444] text-sm text-center">

          <thead>
            <tr className="bg-[#2c3e50] text-white">
              <th className="px-4 py-2 border border-[#444]">Estrategia</th>
              {dias.map((d: string) => (
                <th key={d} className="px-4 py-2 border border-[#444]">{d}</th>
              ))}
              <th className="px-4 py-2 border border-[#444]">TOTAL</th>
            </tr>
          </thead>

          <tbody>

            {/* Nº FILAS */}
            <tr className="bg-[#111] text-[#d4af37] font-bold">
              <td className="px-4 py-2 border border-[#444]">Nº Filas</td>
              {filaConteo.map((v: number, i: number) => (
                <td key={i} className="border px-4 py-2">{v}</td>
              ))}
            </tr>

            {/* ESTRATEGIAS */}
            {estrategias.map((est: string) => (
              <tr key={est}>

                <td className="px-4 py-2 border border-[#444] text-[#d4af37] font-bold">
                  {est}
                </td>

                {tabla[est].map((v: number, i: number) => {

                  const valoresColumna = estrategias
                    .filter((e: string) => e !== "MIX")
                    .map((e: string) => tabla[e][i]);

                  const max = Math.max(...valoresColumna);
                  const isBest = est !== "MIX" && v === max && max > 0;

                  return (
                    <td
                      key={i}
                      className={`border px-4 py-2 ${
                        isBest ? "bg-[#d4af37] text-black font-bold" : ""
                      }`}
                    >
                      {v.toFixed(2)}
                    </td>
                  );
                })}

              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* ================= GRÁFICO ================= */}
      <div className="mt-10">
        <Top3PorDiaChart
          dias={dias}
          topNombres={topNombres}
          topValores={topValores}
        />
      </div>

      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        📊 Cálculos dirección
      </h2>

      {/* ================= DIRECCIÓN ================= */}
      <div className="mt-10 flex justify-center">
        <table className="border border-[#444] text-sm text-center">

          <thead>
            <tr className="bg-[#2c3e50] text-white">
              <th className="border px-3 py-2">Tipo</th>
              <th className="border px-3 py-2">Estrategia</th>
              <th className="border px-3 py-2">Suma</th>
              <th className="border px-3 py-2">Filas</th>
              <th className="border px-3 py-2">% TP</th>
              <th className="border px-3 py-2">% BE</th>
              <th className="border px-3 py-2">% SL</th>
            </tr>
          </thead>

          <tbody>
            {direccion.map((row: any, i: number) => (
              <tr
                key={i}
                className={row.tipo === "Alcista" ? "bg-[#111]" : "bg-black"}
              >
                <td className="border px-3 py-2 text-[#d4af37]">
                  {row.tipo}
                </td>

                <td className="border px-3 py-2 text-[#d4af37] font-bold">
                  {row.estrategia}
                </td>

                <td className="border px-3 py-2">
                  {row.suma.toFixed(2)}
                </td>

                <td className="border px-3 py-2">
                  {row.filas}
                </td>

                <td className="border px-3 py-2">
                  {row.pctTP.toFixed(2)}%
                </td>

                <td className="border px-3 py-2">
                  {row.pctBE.toFixed(2)}%
                </td>

                <td className="border px-3 py-2">
                  {row.pctSL.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      
      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        📊 Top estrategias por par
      </h2>
      {topPar && (
        <div className="mt-10">
          <TopPorParChart
            pares={topPar.pares}
            dataChart={topPar.dataChart}
          />
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        📊 Según filtros aplicados
      </h2>

      {/* ================= Filtros ================= */}
      <div className="mt-10 flex justify-center">
      <table className="border border-[#444] border-collapse text-sm text-center">

      <thead>
      <tr className="bg-[#2c3e50] text-white">
      <th className="border border-[#444] px-3 py-2">Filtro1</th>
      <th className="border border-[#444] px-3 py-2">Filtro2</th>
      <th className="border border-[#444] px-3 py-2">Suma</th>
      <th className="border border-[#444] px-3 py-2">Filas</th>
      <th className="border border-[#444] px-3 py-2">TP</th>
      <th className="border border-[#444] px-3 py-2">SL</th>
      </tr>
      </thead>

      <tbody>
      {filtrosOrdenados.map((f:any,i:number)=>(
      <tr key={i} className="bg-black">
      <td className="border border-[#444] px-3 py-2">{f.f1}</td>
      <td className="border border-[#444] px-3 py-2">{f.f2}</td>
      <td className="border border-[#444] px-3 py-2">{f.suma.toFixed(2)}</td>
      <td className="border border-[#444] px-3 py-2">{f.filas}</td>
      <td className="border border-[#444] px-3 py-2">{f.tp}</td>
      <td className="border border-[#444] px-3 py-2">{f.sl}</td>
      </tr>
      ))}
      </tbody>

      </table>
      </div>
      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        📊 Cálculos estadísticos
      </h2>

      {/* ================= MÉTRICAS ================= */}
      <div className="mt-10 flex justify-center">
        <table className="border border-[#444] border-collapse text-sm text-center">

        <thead>
        <tr className="bg-[#2c3e50] text-white">
          <th className="border border-[#444] px-3 py-2">Estrategia</th>
          <th className="border border-[#444] px-3 py-2">% TP</th>
          <th className="border border-[#444] px-3 py-2">% BE</th>
          <th className="border border-[#444] px-3 py-2">% SL</th>
          <th className="border border-[#444] px-3 py-2">Expectancy</th>
          <th className="border border-[#444] px-3 py-2">Profit Factor</th>
          <th className="border border-[#444] px-3 py-2">Sharpe</th>
          <th className="border border-[#444] px-3 py-2">SQN</th>
          <th className="border border-[#444] px-3 py-2">Max DD</th>
          <th className="border border-[#444] px-3 py-2">Retorno</th>
          <th className="border border-[#444] px-3 py-2">Calmar</th>
          <th className="border border-[#444] px-3 py-2">Payoff</th>
          <th className="border border-[#444] px-3 py-2">Kelly</th>
          <th className="border border-[#444] px-3 py-2">Max Loss</th>
          <th className="border border-[#444] px-3 py-2">Score</th>
        </tr>
        </thead>

        <tbody>
        {metricas.map((row:any,i:number)=>(
        <tr key={i} className="bg-black">

        <td className="border border-[#444] px-3 py-2 text-[#d4af37] font-bold">
        {row.estrategia}
        </td>

        <td
          className={`border border-[#444] px-3 py-2 ${
            row.tpRate > 0.55 ? "bg-[#d4af37] text-black" : ""
          }`}
        >
          {(row.tpRate * 100).toFixed(2)}%
        </td>

        <td className="border border-[#444] px-3 py-2">
          {(row.beRate * 100).toFixed(2)}%
        </td>

        <td
          className={`border border-[#444] px-3 py-2 ${
            row.slRate < 0.35 ? "bg-[#d4af37] text-black" : ""
          }`}
        >
          {(row.slRate * 100).toFixed(2)}%
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.expectancy>0.5?"bg-[#d4af37] text-black":""}`}>
        {row.expectancy.toFixed(2)} R
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.profitFactor>1.5?"bg-[#d4af37] text-black":""}`}>
        {row.profitFactor.toFixed(2)}
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.sharpe>0.4?"bg-[#d4af37] text-black":""}`}>
        {row.sharpe.toFixed(2)}
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.sqn>2?"bg-[#d4af37] text-black":""}`}>
        {row.sqn.toFixed(2)}
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.maxDD<8?"bg-[#d4af37] text-black":""}`}>
        {row.maxDD.toFixed(2)} R
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.retornoTotal>30?"bg-[#d4af37] text-black":""}`}>
        {row.retornoTotal.toFixed(2)} R
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.calmar>5?"bg-[#d4af37] text-black":""}`}>
        {row.calmar.toFixed(2)}
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.payoff>1?"bg-[#d4af37] text-black":""}`}>
        {row.payoff.toFixed(2)}
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.kelly>0.35?"bg-[#d4af37] text-black":""}`}>
        {row.kelly.toFixed(2)}
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.maxLosses<=5?"bg-[#d4af37] text-black":""}`}>
        {row.maxLosses}
        </td>

        <td className={`border border-[#444] px-3 py-2 ${row.score>100?"bg-[#d4af37] text-black":""}`}>
        {row.score.toFixed(2)}
        </td>

        </tr>
        ))}
        </tbody>

        </table>
      </div>

      <div className="mt-10 text-center text-[#d4af37] space-y-2">

      <p>WinRate: Porcentaje de operaciones ganadoras. Mide la frecuencia de acierto pero no la rentabilidad. &gt;60% indica alta consistencia; sistemas con menor winrate requieren mayor payoff.</p>

      <p>Expectancy: Beneficio esperado por operación expresado en R. Es la métrica más importante del sistema. &gt;0 R indica ventaja estadística; &gt;0.30 R es bueno; &gt;0.50 R muy sólido; &gt;1 R excepcional.</p>

      <p>Profit Factor: Relación entre ganancias totales y pérdidas totales. &gt;1.5 indica robustez; &gt;2 muy bueno; &gt;3 puede implicar sobreoptimización.</p>

      <p>Sharpe: Rentabilidad ajustada por volatilidad por operación. &gt;0.30 aceptable; &gt;0.50 bueno; &gt;0.70 excelente.</p>

      <p>SQN: System Quality Number. &gt;2 sólido; &gt;3 excelente; &gt;5 profesional.</p>

      <p>Max Drawdown: Mayor caída acumulada medida en R. Cuanto menor sea, mejor.</p>

      <p>Retorno Total: Beneficio acumulado expresado en R.</p>

      <p>Calmar: Relación retorno/drawdown. &gt;1 aceptable; &gt;3 bueno.</p>

      <p>Payoff: Relación ganancia/pérdida. &gt;1 sólido.</p>

      <p>Kelly: Fracción óptima de riesgo.</p>

      <p>Max Losses: Máxima racha de pérdidas.</p>

      </div>
      
    </div>
  );
}