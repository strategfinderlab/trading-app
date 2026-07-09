"use client";

import { useMemo, useState } from "react";
import { calcularPrediccion } from "@/lib/calculosPrediccion";

type Props = {
    data:any[];
    estrategias:string[];
};

const dias = [
    "",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes"
];

export default function PrediccionOperacion({

    data,
    estrategias

}:Props){

    const [estrategia,setEstrategia]=useState("MIX");

    const [direccion,setDireccion]=useState("");

    const [dia,setDia]=useState("");

    const [recientes,setRecientes]=useState(20);

    const pred=useMemo(()=>{

        return calcularPrediccion(

            data,

            estrategia,

            direccion || null,

            dia || null,

            recientes

        );

    },[

        data,

        estrategia,

        direccion,

        dia,

        recientes

    ]);

    return(

        <div className="mt-10">

            <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
                📊 Predicción próxima operación
            </h2>

            <div className="flex gap-4 flex-wrap mb-8">

                <div>

                    <label className="block mb-1">
                        Estrategia
                    </label>

                    <select

                        value={estrategia}

                        onChange={e=>setEstrategia(e.target.value)}

                        className="bg-black border border-[#555] p-2"

                    >

                        <option>MIX</option>

                        {estrategias
                            .filter(e=>e!=="MIX")
                            .map(e=>

                            <option key={e}>
                                {e}
                            </option>

                        )}

                    </select>

                </div>

                <div>

                    <label className="block mb-1">

                        Dirección

                    </label>

                    <select

                        value={direccion}

                        onChange={e=>setDireccion(e.target.value)}

                        className="bg-black border border-[#555] p-2"

                    >

                        <option value="">
                            Todas
                        </option>

                        <option>
                            Alcista
                        </option>

                        <option>
                            Bajista
                        </option>

                    </select>

                </div>

                <div>

                    <label className="block mb-1">

                        Día

                    </label>

                    <select

                        value={dia}

                        onChange={e=>setDia(e.target.value)}

                        className="bg-black border border-[#555] p-2"

                    >

                        {dias.map(d=>

                            <option

                                key={d}

                                value={d}

                            >

                                {d || "Todos"}

                            </option>

                        )}

                    </select>

                </div>

                <div>

                    <label className="block mb-1">

                        Recientes

                    </label>

                    <input

                        type="number"

                        min={5}

                        max={100}

                        value={recientes}

                        onChange={e=>

                            setRecientes(

                                Number(e.target.value)

                            )

                        }

                        className="bg-black border border-[#555] p-2 w-24"

                    />

                </div>

            </div>

            <table className="border border-[#444] text-center w-full">

                <thead>

                    <tr className="bg-[#2c3e50]">

                        <th className="border border-[#444] py-2">
                            Métrica
                        </th>

                        <th className="border border-[#444]">
                            Valor
                        </th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td className="border border-[#444]">
                            Probabilidad TP
                        </td>

                        <td className="border border-[#444] text-[#6CFF6C] font-bold">

                            {(pred.tp*100).toFixed(2)}%

                        </td>

                    </tr>

                    <tr>

                        <td className="border border-[#444]">

                            Probabilidad BE

                        </td>

                        <td className="border border-[#444] text-yellow-400 font-bold">

                            {(pred.be*100).toFixed(2)}%

                        </td>

                    </tr>

                    <tr>

                        <td className="border border-[#444]">

                            Probabilidad SL

                        </td>

                        <td className="border border-[#444] text-red-500 font-bold">

                            {(pred.sl*100).toFixed(2)}%

                        </td>

                    </tr>

                    <tr>

                        <td className="border border-[#444]">

                            Confianza

                        </td>

                        <td className="border border-[#444]">

                            {pred.confianza.toFixed(0)}%

                        </td>

                    </tr>

                    <tr>

                        <td className="border border-[#444]">

                            Momentum

                        </td>

                        <td

                            className={`border border-[#444] font-bold ${
                                pred.momentum>=0
                                ? "text-[#6CFF6C]"
                                : "text-red-500"
                            }`}

                        >

                            {pred.momentum.toFixed(1)}%

                        </td>

                    </tr>

                    <tr>

                        <td className="border border-[#444]">

                            Muestra total

                        </td>

                        <td className="border border-[#444]">

                            {pred.muestraTotal}

                        </td>

                    </tr>

                    <tr>

                        <td className="border border-[#444]">

                            Muestra reciente

                        </td>

                        <td className="border border-[#444]">

                            {pred.muestraReciente}

                        </td>

                    </tr>

                    <tr>

                        <td className="border border-[#444]">

                            Muestra contexto

                        </td>

                        <td className="border border-[#444]">

                            {pred.muestraContexto}

                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    );

}