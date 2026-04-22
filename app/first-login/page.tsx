"use client";

import { useState } from "react";

export default function FirstLogin() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {

    await fetch("/api/auth/set-password", {
      method: "POST",
      body: JSON.stringify({ username: email, password })
    });

    alert("Password creado. Ya puedes hacer login");
  };

  return (
    <div className="text-white p-10">

      <h1 className="text-xl mb-4">Primer acceso</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-black border p-2 block mb-2"
      />

      <input
        placeholder="Nueva contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="bg-black border p-2 block mb-2"
      />

      <button onClick={handleSubmit}>
        Crear contraseña
      </button>

    </div>
  );
}