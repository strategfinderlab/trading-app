
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";

type Props = {
  data: any[];
};

export default function MixDiaMesChart({ data }: Props) {

  const resultados = Array.from({ length: 31 }, (_, i) => {
    const dia = i + 1;

    const entradasDia = data.filter((r: any) => {
      const fecha = r["Fecha"];
      if (!fecha) return false;

      // Extraer el día de la fecha
      const partes = String(fecha).split(/[\/-]/);
      const diaFecha = Number(partes[0]);

      return diaFecha === dia;
    });

    const total = entradasDia.reduce((sum: number, r: any) => {
      const mix = Number(
        String(r["MIX"] ?? 0).replace(",", ".")
      );

      return sum + (Number.isFinite(mix) ? mix : 0);
    }, 0);

    return {
      dia: String(dia),
      mix: Number(total.toFixed(2)),
      operaciones: entradasDia.length
    };
  });

  return (
    <div className="w-full bg-[#111] border border-[#333] rounded-xl p-4">

      <h3 className="text-lg font-bold text-[#d4af37] mb-1">
        MIX acumulado por día del mes
      </h3>

      <p className="text-xs text-gray-400 mb-5">
        Suma de MIX de todas las entradas contabilizadas
      </p>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={resultados}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333"
            />

            <XAxis
              dataKey="dia"
              stroke="#aaa"
              tick={{ fill: "#aaa", fontSize: 11 }}
            />

            <YAxis
              stroke="#aaa"
              tick={{ fill: "#aaa", fontSize: 11 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #d4af37",
                borderRadius: "8px",
                color: "#fff"
              }}
              formatter={(value: any, name: any) => [
                value,
                name === "mix" ? "MIX acumulado" : name
              ]}
              labelFormatter={(label) => `Día ${label}`}
            />

            <ReferenceLine
              y={0}
              stroke="#888"
              strokeDasharray="4 4"
            />

            <Line
              type="monotone"
              dataKey="mix"
              stroke="#d4af37"
              strokeWidth={2.5}
              dot={{ fill: "#d4af37", r: 3 }}
              activeDot={{ r: 6 }}
            />

          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
