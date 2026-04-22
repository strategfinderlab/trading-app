"use client";

import dynamic from "next/dynamic";
import { getPlotlyLayout } from "@/lib/plotlyStyle";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false
});

export default function TopPorParChart({ pares, dataChart }: any) {

  const palette = ["#4b5563", "#6b7280", "#9ca3af"]; // 👈 mismos colores

  const traces = dataChart.map((serie: any, i: number) => ({
    x: pares,
    y: serie.y,
    type: "bar",
    name: serie.name,
    marker: {
      color: palette[i] || "#ccc" // fallback por si hay más de 3
    }
  }));

  const valoresFlat = dataChart.flatMap((s: any) => s.y);

  return (
    <Plot
      data={traces}
      layout={{
        ...getPlotlyLayout("", valoresFlat),
        barmode: "group",
        height: 400
      }}
      style={{ width: "100%" }}
    />
  );
}