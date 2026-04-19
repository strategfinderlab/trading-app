"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

// ------------------------
// FUNCIONES AUXILIARES
// ------------------------

const convertirDuracion = (dur: string) => {
  if (!dur) return null;
  const num = parseFloat(dur);
  return isNaN(num) ? null : num;
};

const calcularMejores = (data: any[], strategies: string[]) => {
  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
  const res: any = {};

  dias.forEach(dia => {
    const filas = data.filter(r =>
      r["Día semana"] === dia &&
      String(r["Contabilizar"]).toUpperCase() === "SI"
    );

    let mejor = null;
    let mejorVal = -Infinity;

    strategies.forEach(s => {
      const suma = filas.reduce((acc, row) => {
        const val = parseFloat(row[s]);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      if (suma > mejorVal) {
        mejorVal = suma;
        mejor = s;
      }
    });

    res[dia] = mejor;
  });

  return res;
};

// ------------------------
// COMPONENTE
// ------------------------

export default function AnalisisEntradas() {

  const [data, setData] = useState<any[]>([]);
  const [mejores, setMejores] = useState<any>({});
  const searchParams = useSearchParams();
  const user = searchParams.get("user");

  useEffect(() => {
    if (!user) return;

    fetch(`/api/entradas?user=${user}`)
      .then(res => res.json())
      .then(rows => {

        if (!rows || rows.length === 0) return;

        const columnasBase = [
          "Fecha","Día semana","Par","Direc",
          "Link antes","Tamaño SL","Comentarios","Link después",
          "Fecha cierre","Duración","SL/TP",
          "Filtro 1","Filtro 2","Contabilizar","MIX"
        ];

        const strategies = Object.keys(rows[0])
          .filter(k => !columnasBase.includes(k) && k !== "id");

        const mejoresCalc = calcularMejores(rows, strategies);

        setMejores(mejoresCalc);
        setData(rows);
      });

  }, [user]);

  // ------------------------
  // SL CHARTS
  // ------------------------

  const getSLData = (estrategia: string) => {

    const filtered = data
      .filter(r =>
        r["Contabilizar"] === "SI" &&
        r["Tamaño SL"] &&
        r[estrategia]
      );

    const grouped: any = {};

    filtered.forEach(r => {
      const sl = Number(r["Tamaño SL"]);
      const val = Number(r[estrategia]);

      if (!grouped[sl]) grouped[sl] = { sl, pos: 0, neg: 0 };

      if (val >= 0) grouped[sl].pos += val;
      else grouped[sl].neg += val;
    });

    return Object.values(grouped).sort((a: any,b: any) => a.sl - b.sl);
  };

  // ------------------------
  // DURACIÓN CHART
  // ------------------------

  const getDuracionData = (dia: string, estrategia: string) => {

    const filtered = data.filter(r => r["Día semana"] === dia);

    const grouped: any = {};

    filtered.forEach(r => {

      const dur = convertirDuracion(r["Duración"]);
      const val = Number(r[estrategia]);

      if (dur == null || isNaN(val)) return;

      const key = dur.toFixed(1);

      if (!grouped[key]) grouped[key] = { dur: key, pos: 0, neg: 0 };

      if (val >= 0) grouped[key].pos += val;
      else grouped[key].neg += val;
    });

    return Object.values(grouped);
  };

  const estrategiasMix = Array.from(
    new Set(Object.values(mejores).filter(Boolean))
  );

  const estrategiasMostrar = ["MIX", ...estrategiasMix];

  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

  return (
    <div className="p-4 text-white">

      {/* ---------------- SL ---------------- */}
      <h2 className="text-center text-xl mb-4">📊 Análisis por SL</h2>

      {estrategiasMostrar.map((e) => {

        const chartData = getSLData(e);
        if (chartData.length === 0) return null;

        return (
          <div key={e} className="mb-8">

            <h3 className="text-center mb-2 text-[#d4af37]">{e}</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="sl" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pos" fill="#d4af37" />
                <Bar dataKey="neg" fill="#555" />
              </BarChart>
            </ResponsiveContainer>

          </div>
        );
      })}

      {/* ---------------- DURACIÓN ---------------- */}
      <h2 className="text-center text-xl mt-10 mb-4">📊 Análisis por Duración</h2>

      {dias.map((dia) => {

        const estrategia = mejores[dia];
        if (!estrategia) return null;

        const chartData = getDuracionData(dia, estrategia);
        if (chartData.length === 0) return null;

        return (
          <div key={dia} className="mb-8">

            <h3 className="text-center mb-2 text-[#d4af37]">
              {dia} - {estrategia}
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="dur" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pos" fill="#d4af37" />
                <Bar dataKey="neg" fill="#555" />
              </BarChart>
            </ResponsiveContainer>

          </div>
        );
      })}

    </div>
  );
}