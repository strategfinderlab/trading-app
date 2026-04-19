"use client";

import Plot from "react-plotly.js";

export default function MontecarloChart({
  media,
  p5,
  p95,
  equityReal
}: any) {

  const x = Array.from({ length: media.length }, (_, i) => i + 1);
  const toPct = (arr: number[]) => arr.map(v => (v - 1) * 100);

  return (
    <Plot
      data={[
        {
          x,
          y: toPct(media),
          type: "scatter",
          mode: "lines",
          name: "Media",
          line: { color: "#d4af37", width: 3 }
        },
        {
          x,
          y: toPct(p5),
          type: "scatter",
          mode: "lines",
          name: "P5",
          line: { dash: "dash", color: "#666666" }
        },
        {
          x,
          y: toPct(p95),
          type: "scatter",
          mode: "lines",
          name: "P95",
          line: { dash: "dash", color: "#666666" }
        },
        {
          x: equityReal.map((_: any, i: number) => i + 1),
          y: toPct(equityReal),
          type: "scatter",
          mode: "lines",
          name: "Equity Real",
          line: { color: "#ffffff", width: 2 }
        },
      ]}
      layout={{
        paper_bgcolor: "#000",
        plot_bgcolor: "#000",
        font: { color: "#d4af37" },
        height: 500,
        title: "Montecarlo MIX",
        yaxis: {
          ticksuffix: "%",
        }
      }}
      style={{ width: "100%" }}
    />
  );
}