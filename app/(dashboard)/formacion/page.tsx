"use client";

export default function FormacionPage() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 border-b border-[#d4af37] pb-2">
        🎥 Formación
      </h2>

      {/* INTRODUCCIÓN */}
      <div className="mb-10 text-center">

        <h2 className="text-[#d4af37] mb-4">Introducción</h2>

        <div className="flex justify-center">
          <iframe
            width="800"
            height="450"
            src="https://www.youtube.com/embed/XXXXXXXX"
            title="Introducción"
            allowFullScreen
            className="border border-[#444]"
          />
        </div>

      </div>

      {/* ESTRATEGIA */}
      <div className="mb-10 text-center">

        <h2 className="text-[#d4af37] mb-4">Estrategia</h2>

        <div className="flex justify-center">
          <iframe
            width="800"
            height="450"
            src="https://www.youtube.com/embed/XXXXXXXX"
            title="Estrategia"
            allowFullScreen
            className="border border-[#444]"
          />
        </div>

      </div>

    </div>
  );
}