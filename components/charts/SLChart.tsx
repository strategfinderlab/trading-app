"use client";

import Plot from "react-plotly.js";
import { getPlotlyLayout } from "@/lib/plotlyStyle";

export default function SLChart({ data, estrategias }: any) {

  // ✅ AQUÍ VAN LAS VARIABLES (FUERA DEL RETURN)
  const estrategiasLimpias = [...new Set(
    estrategias.filter(e => e && e !== "id")
  )].sort();

  return (
    <div className="flex flex-col gap-12">
      {estrategiasLimpias.map((estrategia: string) => {

        const filtered = data
          .filter((r: any) =>
            String(r["Contabilizar"]).toUpperCase() === "SI" &&
            r["Tamaño SL"] !== "" &&
            r[estrategia] !== "" &&
            r[estrategia] !== undefined
          )
          .map((r: any) => ({
            sl: Number(r["Tamaño SL"]),
            val: Number(r[estrategia])
          }))
          .filter((r: any) => !isNaN(r.sl) && !isNaN(r.val));

        if (filtered.length === 0) return null;

        const grouped: any = {};

        filtered.forEach((row: any) => {
          if (!grouped[row.sl]) {
            grouped[row.sl] = { pos: 0, neg: 0 };
          }

          if (row.val >= 0) grouped[row.sl].pos += row.val;
          else grouped[row.sl].neg += row.val;
        });

        const x = Object.keys(grouped).map(Number).sort((a, b) => a - b);
        const pos = x.map(k => grouped[k].pos);
        const neg = x.map(k => grouped[k].neg);

        const valores = [...pos, ...neg];

        return (
          <div key={estrategia} className="w-full">
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
                ...getPlotlyLayout(estrategia, valores),
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