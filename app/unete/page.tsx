"use client";

import Image from "next/image";

export default function UnetePage() {
  return (
    <div className="relative z-10 flex flex-col items-center gap-10">

      {/* 🔥 FONDO */}
      <div className="fixed inset-0 z-0 opacity-10">
        <Image src="/logo.png" alt="bg" fill className="object-contain" />
      </div>

      {/* 🔥 CONTENIDO */}
      <div className="relative z-10 flex flex-col items-center gap-16">

        {/* HEADER */}
        <section className="text-center py-12 max-w-4xl px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="block text-white">
              Tu estrategia no falla.
            </span>
            <span className="block text-[#d4af37]">
              No sabes cuándo usarla.
            </span>
          </h1>

          <p className="text-lg text-gray-300 mb-8">
            Strategy Finder Lab analiza tus entradas y te dice exactamente cuándo tu estrategia funciona y cuándo no.
          </p>

        </section>

        {/* PROBLEMA */}
          <section className="max-w-5xl px-6 text-center">
            <h3 className="text-2xl font-semibold mb-8 text-white">
              EL PROBLEMA
            </h3>

            <div className="grid md:grid-cols-3 gap-6 text-[#d4af37]">
              <div>❌ Cambias de estrategia antes de entenderla</div>
              <div>❌ No sabes qué días u horas te funcionan</div>
              <div>❌ Operas por intuición, no por datos</div>
            </div>
          </section>


          {/* QUÉ ES */}
          <section className="max-w-3xl text-center px-6">
            <h3 className="text-2xl font-semibold mb-6 text-white">
              QUÉ ES
            </h3>

            <p className="text-[#d4af37]">
              Strategy Finder Lab registra tus entradas y calcula automáticamente cuándo funcionan.
              Por día, por hora, por contexto de mercado. Sin cambiar tu modelo de entrada.
            </p>
          </section>


          {/* PARA QUIÉN */}
          <section className="max-w-3xl text-center px-6">
            <h3 className="text-2xl font-semibold mb-6 text-white">
              PARA QUIÉN ES
            </h3>

            <p className="text-[#d4af37]">
              Para traders de swing, intraday o scalping que ya tienen un modelo de entrada
              y quieren saber cuándo usarlo con datos reales detrás.
            </p>
          </section>


          {/* BENEFICIOS */}
          <section className="max-w-4xl px-6">
            <h3 className="text-2xl font-semibold mb-6 text-center text-white">
              LO QUE CONSIGUES
            </h3>

            <ul className="space-y-3 text-[#d4af37]">
              <li>✔ Sabes qué días operar y cuáles evitar</li>
              <li>✔ Sabes qué gestión aplicar según el día</li>
              <li>✔ Ves si tu estrategia es sólida o has tenido suerte (Montecarlo)</li>
              <li>✔ Analizas resultados por semana, mes y contexto de mercado</li>
              <li>✔ Encuentras la gestión óptima sin cambiar tu entrada</li>
            </ul>
          </section>

          {/* PRUEBA REAL */}
          <section className="max-w-4xl px-6 text-center">
            <h3 className="text-2xl font-semibold mb-6 text-white">
              PRUEBA REAL
            </h3>

            <img
              src="/demo1.png"
              className="rounded border border-[#333] mb-6 mx-auto"
            />

            <p className="text-[#d4af37]">
              Este es mi análisis real. Lunes y viernes no opero. Martes y jueves RR 1:1.
              Miércoles RR 1:2.45. Lo decidieron mis datos, no yo.
            </p>
          </section>


          {/* INCLUYE */}
          <section className="max-w-4xl px-6">
            <h3 className="text-2xl font-semibold mb-6 text-center text-white">
              LO QUE INCLUYE
            </h3>

            <ul className="space-y-2 text-[#d4af37]">
              <li>✔ Registro ilimitado de entradas</li>
              <li>✔ Análisis por día y hora</li>
              <li>✔ Separación alcista y bajista</li>
              <li>✔ Simulación Montecarlo</li>
              <li>✔ Estrategia MIX automática</li>
              <li>✔ Análisis por semanas y meses</li>
              <li>✔ Tus datos privados, solo tú los ves</li>
              <li>✔ Acceso de por vida a todas las mejoras futuras</li>
            </ul>
          </section>


          {/* FAQ */}
          <section className="max-w-3xl px-6 space-y-6">
            <h3 className="text-2xl font-semibold mb-6 text-center text-white">
              FAQ
            </h3>

            <div>
              <b className="text-white">¿Para qué mercados funciona?</b>
              <p className="text-[#d4af37]">Forex, índices, crypto, acciones.</p>
            </div>

            <div>
              <b className="text-white">¿Necesito experiencia previa?</b>
              <p className="text-[#d4af37]">
                Necesitas tener un modelo de entrada propio. SFL no te da la entrada, te dice cuándo usarla.
              </p>
            </div>

            <div>
              <b className="text-white">¿Cuántas entradas necesito?</b>
              <p className="text-[#d4af37]">
                A partir de 30 entradas los datos empiezan a ser relevantes.
              </p>
            </div>

            <div>
              <b className="text-white">¿Mis datos son privados?</b>
              <p className="text-[#d4af37]">
                Sí. Cada usuario solo ve sus propios datos.
              </p>
            </div>
          </section>
          {/* CTA FINAL */}
          <section className="text-center px-6">
            <p className="text-[#d4af37] mb-4">
              Early access — Primeros 20 usuarios
            </p>

            <h2 className="text-4xl font-bold mb-4 text-white">
              97€
            </h2>

            <p className="text-[#d4af37] mb-6">
              Acceso de por vida. Sin mensualidades. El precio sube a 147€.
            </p>

            <a
              href="/api/stripe/checkout"
              className="bg-[#d4af37] text-black px-10 py-5 rounded text-xl font-semibold hover:scale-105 transition"
            >
              Quiero acceso — 97€
            </a>
          </section>

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-500 pb-10 px-6">
          Strategy Finder Lab es una herramienta de análisis de datos para traders.
          No constituye asesoramiento financiero. Operar conlleva riesgo.
        </footer>

      </div>
    </div>
  );
}