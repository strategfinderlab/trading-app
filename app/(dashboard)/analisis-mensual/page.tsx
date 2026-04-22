"use client";

import { useEffect, useState } from "react";
import { calcularTop3Mensual } from "@/lib/calculosMensual";
import { normalizarDia } from "@/lib/calculos";
import React from "react";
export default function AnalisisMensualPage() {

  const [tabla, setTabla] = useState<any[]>([]);

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

  const procesar = (data: any[]) => {

    if (!Array.isArray(data)) return;

    const cleaned = data.map(row => ({
      ...row,
      "Día semana": normalizarDia(row["Día semana"])
    }));

    const res = calcularTop3Mensual(cleaned);
    setTabla(res);
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        📅 Análisis Mensual
      </h2>

      <div className="overflow-x-auto">

        <table className="w-full border border-[#444] text-sm">

          <thead>
            <tr className="bg-[#2c3e50] text-white">
              <th className="p-2">Mes</th>

              <th className="p-2 bg-[#1a252f]">MIX</th>
              <th className="p-2 bg-[#1a252f]">Valor</th>
              <th className="p-2 bg-[#1a252f]">Trades</th>

              <th className="p-2 bg-[#34495e] border-l-4 border-[#888]">TOP 1</th>
              <th className="p-2 bg-[#34495e]">Valor</th>
              <th className="p-2 bg-[#34495e]">Trades</th>

              <th className="p-2 bg-[#34495e] border-l-4 border-[#888]">TOP 2</th>
              <th className="p-2 bg-[#34495e]">Valor</th>
              <th className="p-2 bg-[#34495e]">Trades</th>

              <th className="p-2 bg-[#34495e] border-l-4 border-[#888]">TOP 3</th>
              <th className="p-2 bg-[#34495e]">Valor</th>
              <th className="p-2 bg-[#34495e]">Trades</th>
            </tr>
          </thead>

          <tbody>

            {tabla.map((row, i) => {


              return (
                <tr key={i} className="text-center">

                  <td className="p-2 text-[#d4af37] font-bold">
                    {row.mes}
                  </td>

                  <td className="p-2 bg-[#111] font-bold">MIX</td>

                  <td className="p-2 bg-[#111] font-bold">
                    {row.mix.valor.toFixed(2)}
                  </td>

                  <td className="p-2 bg-[#111]">
                    {row.mix.trades}
                  </td>

                  {row.top.map((t: any, idx: number) => (
                    <React.Fragment key={t.nombre + idx}>
                      <td className="p-2 border-l-4 border-[#888]">
                        {t.nombre}
                      </td>
                      <td className="p-2">
                        {t.valor.toFixed(2)}
                      </td>
                      <td className="p-2">
                        {t.trades}
                      </td>
                    </React.Fragment>
                  ))}

                </tr>
              );
            })}

          </tbody>
        </table>

      </div>
    </div>
  );
}