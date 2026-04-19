"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const SLChart = dynamic(
  () => import("../../../components/charts/SLChart"),
  { ssr: false }
);

const DuracionChart = dynamic(
  () => import("../../../components/charts/DuracionChart"),
  { ssr: false }
);
import { getStrategies, calcularMejores } from "../../../lib/calculos";
import { normalizarDia } from "../../../lib/calculos";
export default function AnalisisPage() {

  const [data, setData] = useState<any[]>([]);
  const [estrategias, setEstrategias] = useState<string[]>([]);
  const [mejores, setMejores] = useState<Record<string, string>>({});
  const procesarDatos = (d: any[]) => {

    if (!Array.isArray(d)) return;

    const cleaned = d.map((row: any) => ({
      ...row,
      "Día semana": normalizarDia(row["Día semana"])
    }));

    const filtered = cleaned.filter(
      (r: any) => String(r["Contabilizar"]).toUpperCase() === "SI"
    );

    setData(filtered);

    const strats = getStrategies(filtered);
    setEstrategias(strats);

    const mej = calcularMejores(filtered, strats);
    setMejores(mej);
  };

  useEffect(() => {

    fetch("/api/entradas")
      .then(res => res.json())
      .then(d => {
        localStorage.setItem("entradas", JSON.stringify(d));
        procesarDatos(d);
      });

  }, []);

  return (
    <div className="p-6 text-white">

      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        📉 Análisis por Tamaño SL
      </h2>
      <SLChart
        data={data}
        estrategias={["MIX", ...Object.values(mejores).filter(Boolean)]}
      />

      <h2 className="text-2xl font-bold mt-12 mb-6 border-b border-[#d4af37] pb-2">
        ⏱️ Análisis por Duración
      </h2>
      <DuracionChart
        data={data}
        mejores={mejores}
      />

    </div>
  );
}