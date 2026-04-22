export const calcularTop3Mensual = (data: any[]) => {

  const filtrado = data.filter(
    r => String(r["Contabilizar"]).toUpperCase() === "SI"
  );

  if (filtrado.length === 0) return [];

  const parseFecha = (fecha: string) => {
    if (!fecha) return null;

    const [datePart] = fecha.split(" ");
    const [d, m, y] = datePart.split("/");

    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  };

  // 🔥 detectar estrategias
  const base = [
    "Fecha","Día semana","Par","Direc",
    "Link antes","Tamaño SL","Comentarios","Link después",
    "Fecha cierre","Duración","SL/TP",
    "Filtro 1","Filtro 2","Contabilizar","MIX","id"
  ];

  const columnas = Object.keys(filtrado[0]);

  const estrategias = columnas
    .filter(c => !base.includes(c)) // quitar base
    .filter(c => {
      const val = filtrado[0][c];
      return !isNaN(parseFloat(val)); // solo numéricas
    });

  const grouped: any = {};

  filtrado.forEach(row => {

    const fecha = parseFecha(row["Fecha"]);
    if (!fecha) return;

    const mes = `${fecha.getMonth()}-${fecha.getFullYear()}`;

    if (!grouped[mes]) {
      grouped[mes] = {
        fecha: fecha,
        valores: {},
        conteo: {}
      };

      [ "MIX", ...estrategias ].forEach(e => {
        grouped[mes].valores[e] = 0;
        grouped[mes].conteo[e] = 0;
      });
    }

    [ "MIX", ...estrategias ].forEach(e => {

      let raw = String(row[e] ?? "");

      raw = raw
        .replace("R", "")
        .replace("BE", "0")
        .replace(",", ".");

      const val = Number(raw);

      if (!isNaN(val)) {
        grouped[mes].valores[e] += val;
        grouped[mes].conteo[e] += 1;
      }
    });
  });

  const resultado: any[] = [];

  Object.keys(grouped).forEach(key => {

    const { fecha, valores, conteo } = grouped[key];

    const suma = { ...valores };
    const conteos = { ...conteo };

    const mixValor = suma["MIX"] || 0;
    const mixTrades = conteos["MIX"] || 0;

    delete suma["MIX"];

    const top3 = Object.entries(suma)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3);

    const mesTexto = fecha.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric"
    });

    resultado.push({
      mes: mesTexto,

      mix: {
        nombre: "MIX",
        valor: mixValor,
        trades: mixTrades
      },

      top: top3.map(([nombre, valor]: any, i) => ({
        nombre,
        valor,
        trades: conteos[nombre] || 0
      }))
    });
  });

  return resultado.sort((a, b) => 0); // luego si quieres ordenamos
};