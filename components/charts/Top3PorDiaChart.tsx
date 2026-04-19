"use client";

import dynamic from "next/dynamic";
import { getPlotlyLayout } from "@/lib/plotlyStyle";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false
});

export default function Top3PorDiaChart({ dias, topNombres, topValores }: any) {

  const traces = [0, 1, 2].map(i => {

    const y = dias.map(d => topValores[d]?.[i] ?? 0);
    const text = dias.map(d => topNombres[d]?.[i] ?? "");
    const palette = ["#4b5563", "#6b7280", "#9ca3af"];

    return {
      x: dias,
      y,
      type: "bar",
      name: `Top ${i + 1}`,
      marker: {
        color: palette[i] // 🔥 AQUÍ ESTÁ LA CLAVE
      },
      text,
      textangle: -90,
      textposition: "inside",
      insidetextanchor: "start"
    };
  });

  const valoresFlat = dias.flatMap(d => topValores[d] || []);

  return (
    <Plot
      data={traces}
      layout={{
        ...getPlotlyLayout("Top 3 por Día", valoresFlat),
        barmode: "group",
        height: 400,
        autosize: true,
        margin: { t: 40, b: 80, l: 40, r: 20 } // 🔥 espacio etiquetas
      }}
      style={{ width: "100%" }}
    />
  );
}