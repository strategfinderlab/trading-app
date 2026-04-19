"use client";

import Plot from "react-plotly.js";
import { getPlotlyLayout } from "@/lib/plotlyStyle";

export default function DuracionChart({ data, mejores }: any) {

  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

  return (
    <div className="flex flex-col gap-12">
      {dias.map((dia) => {

        const estrategia = mejores[dia];
        if (!estrategia) return null;

        const filtered = data
          .filter((r: any) =>
            r["Día semana"] === dia &&
            r["Duración"] !== "" &&
            r[estrategia] !== "" &&
            r[estrategia] !== undefined
          )
          .map((r: any) => ({
            dur: Number(r["Duración"]),
            val: Number(r[estrategia])
          }))
          .filter((r: any) => !isNaN(r.dur) && !isNaN(r.val));

        if (filtered.length === 0) return null;

        const grouped: any = {};

        filtered.forEach((row: any) => {
          const d = Number(row.dur.toFixed(2));

          if (!grouped[d]) {
            grouped[d] = { pos: 0, neg: 0 };
          }

          if (row.val >= 0) grouped[d].pos += row.val;
          else grouped[d].neg += row.val;
        });

        const x = Object.keys(grouped).map(Number).sort((a, b) => a - b);
        const pos = x.map(k => grouped[k].pos);
        const neg = x.map(k => grouped[k].neg);

        const valores = [...pos, ...neg];

        return (
          <div key={dia}>
            <Plot
              data={[
                {
                  x,
                  y: pos,
                  type: "bar",
                  name: "R > 0",
                  marker: { color: "#d4af37" } // dorado
                },
                {
                  x,
                  y: neg,
                  type: "bar",
                  name: "R < 0",
                  marker: { color: "#666666" } // gris
                }
              ]}
              layout={{
                ...getPlotlyLayout(`${dia} - ${estrategia}`, valores),
                barmode: "relative"
              }}
              style={{ width: "100%", height: "400px" }}
            />
          </div>
        );
      })}
    </div>
  );
}