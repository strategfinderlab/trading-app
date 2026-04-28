export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center px-6">

      <h1 className="text-4xl font-bold mb-6 text-[#d4af37]">
        Pago completado ✅
      </h1>

      <p className="text-gray-300 mb-6 max-w-xl">
        Tu acceso a Strategy Finder Lab está confirmado.
        <br />
        Crea tu contraseña sobre el botón "primer acceso" con el e-mail que has registrado con la compra
      </p>

      <a
        href="/login"
        className="bg-[#d4af37] text-black px-6 py-3 rounded font-semibold"
      >
        Ir al login
      </a>

    </div>
  );
}