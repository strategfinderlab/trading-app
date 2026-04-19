export const getPlotlyLayout = (titulo: string, valores?: number[]) => {

  let dtick = 1;

  if (valores && valores.length > 0) {
    const maxVal = Math.max(...valores.map(v => Math.abs(v)));
    dtick = Math.max(1, Math.round(maxVal / 5));
  }

  return {
    title: {
      text: titulo,
      x: 0.5,
      xanchor: "center",
      font: { size: 18, color: "#d4af37" }
    },

    plot_bgcolor: "#000000",
    paper_bgcolor: "#000000",

    font: { color: "#d4af37" },

    margin: { l: 40, r: 20, t: 40, b: 40 },

    legend: { x: 1.02, y: 1 },

    xaxis: {
      showline: true,
      linecolor: "#aaaaaa",
      linewidth: 3,
      showgrid: false,
      tickfont: { size: 14, color: "#f5d27a" }
    },

    yaxis: {
      showline: true,
      linecolor: "#aaaaaa",
      linewidth: 3,

      showgrid: true,
      gridcolor: "#333",
      gridwidth: 0.7,

      zeroline: true,
      zerolinecolor: "#bbbbbb",
      zerolinewidth: 3,

      tickmode: "linear",
      dtick,
      tickfont: { size: 14, color: "#f5d27a" }
    }
  };
};