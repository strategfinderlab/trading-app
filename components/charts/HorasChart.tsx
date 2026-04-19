"use client";

import Plot from "react-plotly.js";
import { getPlotlyLayout } from "@/lib/plotlyStyle";

export default function HorasChart({ data, estrategias }: any) {

  const dias = ["Martes", "Miércoles", "Jueves"];

  const procesar = (rows: any[], estrategia: string) => {

    const grouped: any = {};

    rows.forEach((r: any) => {

      const fecha = new Date(r["Fecha"]);
      if (isNaN(fecha.getTime())) return;

      const hora = fecha.getHours();
      const val = Number(r[estrategia]);

      if (isNaN(val)) return;

      if (!grouped[hora]) grouped[hora] = 0;

      grouped[hora] += val;
    });

    const x = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b);

    const y = x.map(h => grouped[h]);

    return { x, y };
  };

  return (
    <div className="flex flex-col gap-16">

      {estrategias.map((estrategia: string) => {

        if (!estrategia || estrategia === "id") return null;

        const filtered = data.filter(
          (r: any) => String(r["Contabilizar"]).toUpperCase() === "SI"
        );

        const global = procesar(filtered, estrategia);

        if (global.x.length === 0) return null;

        const valores = global.y;

        return (
          <div key={estrategia} className="border-b border-[#333] pb-10">

            {/* 🔥 TITULO */}
            <h3 className="text-center text-[#d4af37] text-lg mb-4 font-bold">
              {estrategia}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* GLOBAL */}
              <Plot
                data={[
                  {
                    x: global.x.map(h => `${h}:00`),
                    y: global.y,
                    type: "scatter",
                    mode: "lines+markers",
                    name: "Global"
                  }
                ]}
                layout={{
                  ...getPlotlyLayout("Todos", valores),
                  height: 250
                }}
              />

              {/* POR DIA */}
              {dias.map((dia) => {

                const dfDia = filtered.filter((r: any) => r["Día semana"] === dia);

                const res = procesar(dfDia, estrategia);

                if (res.x.length === 0) return null;

                return (
                  <Plot
                    key={dia}
                    data={[
                      {
                        x: res.x.map(h => `${h}:00`),
                        y: res.y,
                        type: "scatter",
                        mode: "lines+markers",
                        name: dia
                      }
                    ]}
                    layout={{
                      ...getPlotlyLayout(dia, res.y),
                      height: 250
                    }}
                  />
                );
              })}

            </div>

          </div>
        );
      })}
    </div>
  );
}