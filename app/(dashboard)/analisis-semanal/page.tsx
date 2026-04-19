"use client";

import { useEffect, useState } from "react";
import SemanalChart from "../../../components/charts/SemanalChart";
import { getStrategies, calcularMejores, normalizarDia } from "../../../lib/calculos";

export default function AnalisisSemanalPage() {

  const [data, setData] = useState<any[]>([]);
  const [estrategias, setEstrategias] = useState<string[]>([]);
  const [mejores, setMejores] = useState<any>({});

  useEffect(() => {

    const cached = localStorage.getItem("entradas");

    if (cached) {
      procesar(JSON.parse(cached));
      return;
    }

    fetch("/api/entradas")
      .then(res => res.json())
      .then(d => {
        localStorage.setItem("entradas", JSON.stringify(d));
        procesar(d);
      });

  }, []);

  const procesar = (d: any[]) => {

    if (!Array.isArray(d)) return;

    const cleaned = d.map((row: any) => ({
      ...row,
      "Día semana": normalizarDia(row["Día semana"])
    }));

    const filtered = cleaned.filter(
      (r: any) =>
        String(r["Contabilizar"]).toUpperCase() === "SI" &&
        r["Fecha"]
    );

    setData(filtered);

    const strats = getStrategies(filtered);
    setEstrategias(strats);

    const mej = calcularMejores(filtered, strats);
    setMejores(mej);
  };

  const estrategiasMix = Object.values(mejores).filter(e => e && e !== "id");

  const resto = estrategias.filter(
    (e: string) => e !== "MIX" && !estrategiasMix.includes(e)
  );

  const estrategiasOrdenadas = [
    "MIX",
    ...new Set(estrategiasMix),
    ...resto
  ];

  return (
    <div className="text-white p-6">
      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        📅 Análisis Semanal
      </h2>

      <SemanalChart
        data={data}
        estrategias={estrategiasOrdenadas}
      />

    </div>
  );
}