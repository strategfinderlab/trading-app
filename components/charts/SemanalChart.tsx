"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false
});
import { getPlotlyLayout } from "@/lib/plotlyStyle";

export default function SemanalChart({ data, estrategias }: any) {

  const parseFecha = (fecha: string) => {
    if (!fecha) return null;

    const [datePart, timePart] = fecha.split(" ");
    if (!datePart) return null;

    const [day, month, year] = datePart.split("/");
    const [hour = "00", min = "00"] = (timePart || "").split(":");

    const d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(min)
    );

    return isNaN(d.getTime()) ? null : d;
  };

  const getSemana = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);

    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    return monday.toISOString();
  };

  return (
    <div className="flex flex-col gap-12">

      {estrategias.map((estrategia: string) => {

        const grouped: any = {};

        data.forEach((row: any) => {

          const fecha = parseFecha(row["Fecha"]);
          if (!fecha) return;

          let raw = String(row[estrategia] ?? "");

          raw = raw
            .replace("R", "")
            .replace("BE", "0")
            .replace(",", ".");

          const val = Number(raw);

          if (isNaN(val)) return;

          const semana = getSemana(fecha);

          if (!grouped[semana]) grouped[semana] = 0;

          grouped[semana] += val;
        });

        const semanas = Object.keys(grouped)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const valores = semanas.map(s => grouped[s]);

        if (valores.every(v => v === 0)) return null;

        const labels = semanas.map(s => {
          const d = new Date(s);
          const end = new Date(d);
          end.setDate(d.getDate() + 6);

          return `${d.toLocaleDateString()} → ${end.toLocaleDateString()}`;
        });

        return (
          <div key={estrategia}>

            <h3 className="text-center text-[#d4af37] mb-2 text-lg font-bold">
              {estrategia}
            </h3>

            <Plot
              data={[
                {
                  x: labels,
                  y: valores,
                  type: "bar",
                  marker: {
                    color: valores.map((v: number) =>
                      v >= 0 ? "#d4af37" : "#666666"
                    )
                  },
                  hovertemplate:
                    "<b>%{x}</b><br>" +
                    "Resultado: %{y:.2f}<extra></extra>"
                }
              ]}
              layout={{
                ...getPlotlyLayout("", valores),
                height: 400,
                margin: { l: 40, r: 20, t: 20, b: 160 },
                xaxis: {
                tickangle: -90
                }
              }}
              style={{ width: "100%" }}
            />
          </div>
        );
      })}
    </div>
  );
}