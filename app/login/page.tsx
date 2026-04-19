"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {

  const [tab, setTab] = useState<"login" | "first" | "reset">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [oldPassword, setOldPassword] = useState("");

  // ================= LOGIN =================
  const handleLogin = async () => {

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: email,
        password,
        remember
      })
    });

    const data = await res.json();

    if (data.error === "FIRST_LOGIN") {
      setTab("first");
      return;
    }

    if (data.error) {
      alert(data.error);
      return;
    }

    window.location.href = "/entradas";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {

    if (e.key !== "Enter") return;

    if (tab === "login") handleLogin();
    if (tab === "first") handleFirstLogin();
    if (tab === "reset") handleReset();

  };

  // ================= FIRST LOGIN =================
  const handleFirstLogin = async () => {

    if (password !== password2) {
      alert("Las contraseñas no coinciden");
      return;
    }

    await fetch("/api/auth/set-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    alert("Contraseña creada, ahora haz login");
    setTab("login");
  };

  // ================= RESET =================
  const handleReset = async () => {

    if (password !== password2) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        oldPassword,
        newPassword: password,
        repeatPassword: password2
      })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    alert("Contraseña cambiada correctamente");
    setTab("login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">

      {/* ================= LOGO ================= */}
      <div className="-mt-10 mb-4">
        <Image
          src="/logo.png"
          alt="logo"
          width={400}
          height={400}
          className="w-[260px] h-auto object-cover"
        />
      </div>

      {/* ================= CARD ================= */}
      <div className="bg-[#0e0e0e] border border-[#333] p-8 rounded-xl w-[340px]">

        <h1 className="text-center text-xl text-[#d4af37] mb-6">
          Acceso
        </h1>

        {/* ================= TABS ================= */}
        <div className="flex justify-between mb-6 gap-2">

          {["login","first","reset"].map((t:any)=>(
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded text-sm ${
                tab === t
                  ? "bg-[#d4af37] text-black"
                  : "bg-[#111] border border-[#333]"
              }`}
            >
              {t === "login" && "Login"}
              {t === "first" && "Primer acceso"}
              {t === "reset" && "Cambiar contraseña"}
            </button>
          ))}

        </div>

        {/* ================= EMAIL ================= */}
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 bg-[#111] border border-[#444] rounded"
        />

        {/* ================= PASSWORD INPUT ================= */}
        <div className="relative mb-4">

          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 bg-[#111] border border-[#444] rounded pr-10"
          />

          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-2 top-2 text-xs text-gray-400"
          >
            {showPass ? "🙈" : "👁"}
          </button>

        </div>

        {/* ================= LOGIN ================= */}
        {tab === "login" && (
          <>
            {/* recordar sesión */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
              />
              Recordar sesión
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-[#d4af37] text-black py-2 rounded"
            >
              Entrar
            </button>
          </>
        )}

        {/* ================= FIRST ================= */}
        {tab === "first" && (
          <>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Repetir password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full mb-4 p-2 bg-[#111] border border-[#444] rounded"
            />

            <button
              onClick={handleFirstLogin}
              className="w-full bg-[#d4af37] text-black py-2 rounded"
            >
              Crear contraseña
            </button>
          </>
        )}

        {/* ================= RESET ================= */}
        {tab === "reset" && (
          <>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Contraseña actual"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full mb-4 p-2 bg-[#111] border border-[#444] rounded"
            />

            <input
              type={showPass ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full mb-4 p-2 bg-[#111] border border-[#444] rounded"
            />

            <input
              type={showPass ? "text" : "password"}
              placeholder="Repetir nueva contraseña"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full mb-4 p-2 bg-[#111] border border-[#444] rounded"
            />

            <button
              onClick={handleReset}
              className="w-full bg-[#d4af37] text-black py-2 rounded"
            >
              Cambiar contraseña
            </button>
          </>
        )}

      </div>

    </div>
  );
}