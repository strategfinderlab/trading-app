export const getStrategies = (data: any[]) => {
  const base = [
    "Fecha","Día semana","Par","Direc",
    "Link antes","Tamaño SL","Comentarios","Link después",
    "Fecha cierre","Duración","SL/TP",
    "Filtro 1","Filtro 2","Contabilizar","MIX"
  ];

  if (!data.length) return [];

  return Object.keys(data[0]).filter(k =>
    !base.includes(k) &&
    k !== "id" &&
    k !== "ID" &&
    k !== "Id" &&
    typeof data[0][k] !== "object"
  );
};

export const calcularMejores = (data: any[], strategies: string[]) => {
  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
  const result: any = {};

  dias.forEach(dia => {
    const filas = data.filter(r =>
      r["Día semana"] === dia &&
      String(r["Contabilizar"]).toUpperCase() === "SI"
    );

    let mejor = null;
    let mejorValor = -Infinity;

    strategies.forEach(strat => {
      const suma = filas.reduce((acc, row) => {
        const val = parseFloat(row[strat]);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      if (suma > mejorValor) {
        mejorValor = suma;
        mejor = strat;
      }
    });

    result[dia] = mejor;
  });

  return result;
};

export const normalizarDia = (dia: string) => {

  const mapa: any = {
    Monday: "Lunes",
    Tuesday: "Martes",
    Wednesday: "Miércoles",
    Thursday: "Jueves",
    Friday: "Viernes"
  };

  return mapa[dia] || dia;
};