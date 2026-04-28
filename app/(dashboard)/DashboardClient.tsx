"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function DashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // 🔥 AÑADE ESTO
  const [role, setRole] = useState("");

  useEffect(() => {
    fetch("/api/me-role")
      .then(res => res.json())
      .then(d => setRole(d.role));
  }, []);

  const navItem = (label: string, path: string) => {
    const isActive = pathname === path;

    return (
      <button
        onClick={() => router.push(path)}
        className={`w-full text-left px-3 py-2 rounded-lg border transition
          ${isActive 
            ? "bg-[#d4af37] text-black border-[#d4af37]" 
            : "bg-[#111] border-[#333] hover:bg-[#d4af37] hover:text-black"}
        `}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex">
      {/* SIDEBAR */}
      <div className="w-[260px] h-screen fixed left-0 top-0 bg-black border-r border-[#222] p-4 flex flex-col gap-3 overflow-y-auto">

        <div className="flex justify-center -mt-2 -mb-2">
          <Image
            src="/logo.png"
            alt="logo"
            width={300}
            height={300}
            className="w-[180px] h-auto object-cover scale-125"
          />
        </div>

        <div className="flex flex-col gap-2">

          <p className="text-gray-400 text-sm">📊 DATOS</p>
          {navItem("Entradas", "/entradas")}

          <p className="text-gray-400 text-sm mt-3">🔎 ANÁLISIS</p>
          {navItem("Análisis entradas", "/analisis-entradas")}
          {navItem("Análisis horas", "/analisis-horas")}
          {navItem("Análisis semanal", "/analisis-semanal")}
          {navItem("Análisis mensual", "/analisis-mensual")}

          <p className="text-gray-400 text-sm mt-3">📊 ESTADÍSTICAS</p>
          {navItem("Cálculos", "/estadisticas")}

          <p className="text-gray-400 text-sm mt-3">⚙️ SIMULACIÓN</p>
          {navItem("Simulación", "/simulacion")}

          <p className="text-gray-400 text-sm mt-3">🎓 FORMACIÓN</p>
          {navItem("Formación", "/formacion")}

          {/* 🔥 ADMIN */}
          {role === "admin" && (
            <>
              <p className="text-gray-400 text-sm mt-3">🛠️ ADMIN</p>
              {navItem("Admin", "/admin")}
            </>
          )}

        </div>

        <button
          onClick={async () => {
            await fetch("/api/logout");
            router.push("/");
          }}
          className="mt-auto bg-red-900 p-2 rounded"
        >
          Cerrar sesión
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 ml-[260px]">
        {children}
      </div>
    </div>
  );
}