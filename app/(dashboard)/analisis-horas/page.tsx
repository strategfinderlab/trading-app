"use client";

import { useEffect, useState } from "react";
import HorasChart from "../../../components/charts/HorasChart";
import { getStrategies, calcularMejores, normalizarDia } from "../../../lib/calculos";

export default function AnalisisHorasPage() {

  const [data, setData] = useState<any[]>([]);
  const [mejores, setMejores] = useState<any>({});

  useEffect(() => {

    const cached = localStorage.getItem("entradas");

    if (cached) {
      procesarDatos(JSON.parse(cached));
      return;
    }

    fetch("/api/entradas")
      .then(res => res.json())
      .then(d => {
        localStorage.setItem("entradas", JSON.stringify(d));
        procesarDatos(d);
      });

  }, []);

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
    const mej = calcularMejores(filtered, strats);

    setMejores(mej);
  };
  const estrategiasUnicas = [
    "MIX",
    ...new Set(
      Object.values(mejores)
        .filter(e => e && e !== "id")
    )
  ];
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        🕒 Análisis por Horas
      </h2>

      <HorasChart
        data={data}
        estrategias={estrategiasUnicas}
      />
    </div>
  );
}