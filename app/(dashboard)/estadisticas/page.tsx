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
import { calcularPrediccion } from "@/lib/calculosPrediccion";

export default function EstadisticasPage() {

  const [stats, setStats] = useState<any>(null);
  const [estrategiaPred, setEstrategiaPred] = useState("MIX");
  const [direccionPred, setDireccionPred] = useState("Todas");
  const [diaPred, setDiaPred] = useState("Todos");

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
  const prediccion = calcularPrediccion(
    data,
    estrategiaPred,
    direccionPred === "Todas" ? null : direccionPred,
    diaPred === "Todos" ? null : diaPred,
    20
  );

  const deltaTP = (prediccion.tp - prediccion.tpGlobal) * 100;
  const deltaBE = (prediccion.be - prediccion.beGlobal) * 100;
  const deltaSL = (prediccion.sl - prediccion.slGlobal) * 100;

  function interpretarVentaja(delta: number, tipo: "TP" | "BE" | "SL") {

      if (tipo === "TP") {

          if (delta >= 10) return "🟢 Muy favorable";
          if (delta >= 5) return "🟢 Favorable";
          if (delta >= -5) return "🟡 Neutral";

          return "🔴 Desfavorable";

      }

      // Para BE y SL cuanto MENOS mejor

      if (delta <= -10) return "🟢 Muy favorable";
      if (delta <= -5) return "🟢 Favorable";
      if (delta <= 5) return "🟡 Neutral";

      return "🔴 Desfavorable";

  }

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

            <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
      🧠 Predicción próxima operación
      </h2>

      <div className="flex flex-wrap gap-6 justify-center items-end mb-8">

          <div>

              <label className="block mb-1 text-[#d4af37]">
                  Estrategia
              </label>

              <select
                  value={estrategiaPred}
                  onChange={(e)=>setEstrategiaPred(e.target.value)}
                  className="bg-black border border-[#444] p-2"
              >

                  <option>MIX</option>

                  {estrategias
                      .filter((e:string)=>e!=="MIX")
                      .map((e:string)=>

                          <option key={e}>
                              {e}
                          </option>

                      )}

              </select>

          </div>

          <div>

              <label className="block mb-1 text-[#d4af37]">
                  Dirección
              </label>

              <select
                  value={direccionPred}
                  onChange={(e)=>setDireccionPred(e.target.value)}
                  className="bg-black border border-[#444] p-2"
              >

                  <option>Todas</option>
                  <option>alcista</option>
                  <option>bajista</option>

              </select>

          </div>

          <div>

              <label className="block mb-1 text-[#d4af37]">
                  Día
              </label>

              <select
                  value={diaPred}
                  onChange={(e)=>setDiaPred(e.target.value)}
                  className="bg-black border border-[#444] p-2"
              >

                  <option>Todos</option>

                  {dias.map((d:string)=>

                      <option key={d}>
                          {d}
                      </option>

                  )}

              </select>

          </div>

      </div>

      <div className="flex justify-center">

      <table className="border border-[#444] text-center">

      <thead>

      <tr className="bg-[#2c3e50]">

      <th className="border border-[#444] px-5 py-2">
      TP
      </th>

      <th className="border border-[#444] px-5 py-2">
      BE
      </th>

      <th className="border border-[#444] px-5 py-2">
      SL
      </th>

      <th className="border border-[#444] px-5 py-2">
      Confianza
      </th>

      <th className="border border-[#444] px-5 py-2">
      Momentum
      </th>

      <th className="border border-[#444] px-5 py-2">
      Muestra
      </th>

      </tr>

      </thead>

      <tbody>

      <tr>

      <td className="border border-[#444] px-5 py-3 text-green-400 font-bold">

      {(prediccion.tp*100).toFixed(1)}%

      </td>

      <td className="border border-[#444] px-5 py-3 text-yellow-400 font-bold">

      {(prediccion.be*100).toFixed(1)}%

      </td>

      <td className="border border-[#444] px-5 py-3 text-red-400 font-bold">

      {(prediccion.sl*100).toFixed(1)}%

      </td>

      <td className="border border-[#444] px-5 py-3">

      {prediccion.confianza.toFixed(0)}%

      </td>

      <td
      className={`border border-[#444] px-5 py-3 font-bold ${
      prediccion.momentum>=0
      ?"text-green-400"
      :"text-red-400"
      }`}
      >

      {prediccion.momentum.toFixed(1)}%

      </td>

      <td className="border border-[#444] px-5 py-3">

      {prediccion.muestraContexto}

      </td>

      </tr>

      </tbody>

      </table>

      </div>
      
      <div
        style={{
            marginTop:20,
            padding:20,
            borderRadius:10,
            background:"#1e1e1e",
            border:"1px solid #444"
        }}
    >

        <h3
            style={{
                marginBottom:10
            }}
        >
            Recomendación
        </h3>

        <div
            style={{
                fontSize:32
            }}
        >
            {"⭐".repeat(prediccion.estrellas)}
        </div>

        <div
            style={{
                fontSize:22,
                fontWeight:"bold",
                marginTop:10
            }}
        >
            {prediccion.recomendacion}
        </div>

        <div
            style={{
                marginTop:10
            }}
        >
            Score: <b>{prediccion.score.toFixed(1)}</b>/100
        </div>
      
       </div>

        <div className="mt-6 flex justify-center">

        <table className="border border-[#444] text-center">

        <thead>

        <tr className="bg-[#2c3e50]">

        <th className="border border-[#444] px-4 py-2"></th>

        <th className="border border-[#444] px-4 py-2">
        Predicción
        </th>

        <th className="border border-[#444] px-4 py-2">
        Histórico
        </th>

        <th className="border border-[#444] px-4 py-2">
        Desviación
        </th>

        <th className="border border-[#444] px-4 py-2">
        Interpretación
        </th>

        </tr>

        </thead>

        <tbody>

        <tr>

        <td className="border px-4 py-2 text-green-400 font-bold">
        TP
        </td>

        <td className="border px-4 py-2">
        {(prediccion.tp*100).toFixed(1)}%
        </td>

        <td className="border px-4 py-2">
        {(prediccion.tpGlobal*100).toFixed(1)}%
        </td>

        <td
        className={`border px-4 py-2 font-bold ${
        deltaTP>0
        ?"text-green-400"
        :"text-red-400"
        }`}
        >

        {deltaTP>0?"+":""}
        {deltaTP.toFixed(1)}%

        </td>

        <td className="border px-4 py-2">
        {interpretarVentaja(deltaTP,"TP")}
        </td>

        </tr>

        <tr>

        <td className="border px-4 py-2 text-yellow-400 font-bold">
        BE
        </td>

        <td className="border px-4 py-2">
        {(prediccion.be*100).toFixed(1)}%
        </td>

        <td className="border px-4 py-2">
        {(prediccion.beGlobal*100).toFixed(1)}%
        </td>

        <td
        className={`border px-4 py-2 font-bold ${
        deltaBE<0
        ?"text-green-400"
        :"text-red-400"
        }`}
        >
        {deltaBE>0?"+":""}
        {deltaBE.toFixed(1)}%
        </td>

        <td className="border px-4 py-2">
        {interpretarVentaja(deltaBE,"BE")}
        </td>

        </tr>

        <tr>

        <td className="border px-4 py-2 text-red-400 font-bold">
        SL
        </td>

        <td className="border px-4 py-2">
        {(prediccion.sl*100).toFixed(1)}%
        </td>

        <td className="border px-4 py-2">
        {(prediccion.slGlobal*100).toFixed(1)}%
        </td>

        <td
        className={`border px-4 py-2 font-bold ${
        deltaSL<0
        ?"text-green-400"
        :"text-red-400"
        }`}
        >

        {deltaSL>0?"+":""}
        {deltaSL.toFixed(1)}%

        </td>

        <td className="border px-4 py-2">
        {interpretarVentaja(deltaSL,"SL")}
        </td>

        </tr>

        </tbody>

        </table>

        </div> 

              <div
        className="mt-8 mx-auto"
        style={{
          maxWidth: 700,
          background: "#1b1b1b",
          border: "1px solid #444",
          borderRadius: 10,
          padding: 20
        }}
      >

      <h3 className="text-xl font-bold text-[#d4af37] mb-4">
      🧩 Patrón detectado
      </h3>

      <div className="text-center text-3xl mb-6">

      {prediccion.patronDetectado.length > 0
        ? prediccion.patronDetectado.join(" ➜ ")
        : "Sin patrón"}

      </div>

      <div className="flex justify-center">

      <table className="border border-[#444] text-center">

      <thead>

      <tr className="bg-[#2c3e50]">

      <th className="border px-4 py-2">
      TP
      </th>

      <th className="border px-4 py-2">
      BE
      </th>

      <th className="border px-4 py-2">
      SL
      </th>

      <th className="border px-4 py-2">
      Muestra
      </th>

      <th className="border px-4 py-2">
      Influencia
      </th>

      </tr>

      </thead>

      <tbody>

      <tr>

      <td className="border px-4 py-2 text-green-400 font-bold">
      {(prediccion.tpPatronPct*100).toFixed(1)}%
      </td>

      <td className="border px-4 py-2 text-yellow-400 font-bold">
      {(prediccion.bePatronPct*100).toFixed(1)}%
      </td>

      <td className="border px-4 py-2 text-red-400 font-bold">
      {(prediccion.slPatronPct*100).toFixed(1)}%
      </td>

      <td className="border px-4 py-2">
      {prediccion.muestraPatron}
      </td>

      <td className="border px-4 py-2">

      {prediccion.pesoPatron===1
      ?"⭐⭐⭐⭐⭐"

      :prediccion.pesoPatron>=0.75
      ?"⭐⭐⭐⭐"

      :prediccion.pesoPatron>=0.4
      ?"⭐⭐⭐"

      :"⭐"}

      </td>

      </tr>

      </tbody>

      </table>

      </div>

      <p className="text-center text-gray-400 mt-4">

      Se han buscado en el histórico todas las veces que apareció exactamente esta secuencia de resultados y se ha calculado cuál fue el resultado de la operación siguiente.

      </p>

      </div>

    </div>
  );
}