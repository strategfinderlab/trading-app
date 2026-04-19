"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {

  const [username, setUsername] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [currentUser, setCurrentUser] = useState("");

  // 🔄 cargar usuarios
  const loadUsers = async () => {
    const res = await fetch("/api/admin/get-users");
    const data = await res.json();
    setUsers(data);
  };

  // 🔥 obtener usuario actual desde cookie
  const loadMe = async () => {
    const res = await fetch("/api/me");
    const data = await res.json();
    setCurrentUser(data.user);
  };

  useEffect(() => {
    loadUsers();
    loadMe();
  }, []);

  // ➕ crear usuario
  const handleCreate = async () => {
    if (!username) return;

    console.log("CLICK crear usuario"); // 👈 añade esto

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username }),
    });

    console.log("STATUS:", res.status); // 👈 añade esto

    const data = await res.json();
    console.log("RESPONSE:", data); // 👈 añade esto

    if (data.error) {
      alert(data.error);
      return;
    }

    alert("Usuario creado");
    setUsername("");
    loadUsers();
  };

  // 🗑️ borrar usuario
  const handleDelete = async (user: string) => {

    if (user === currentUser) {
      alert("No puedes borrarte a ti mismo");
      return;
    }

    if (!confirm("¿Seguro que quieres borrar este usuario?")) return;

    await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username: user }),
    });

    loadUsers();
  };

  // 🔄 reset password
  const handleReset = async (user: string) => {

    if (!confirm("Esto borrará la contraseña. ¿Continuar?")) return;

    await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username: user }),
    });

    alert("Usuario deberá crear contraseña en el siguiente login");
  };

  // 🔍 filtro
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="text-white p-10">

      <h1 className="text-3xl mb-6 text-[#d4af37]">Panel Admin</h1>

      {/* CREAR USUARIO */}
      <div className="mb-6 flex gap-2">
        <input
          placeholder="Email usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-[#111] border border-[#d4af37] p-2 rounded"
        />

        <button
          onClick={handleCreate}
          className="px-4 py-2 border border-[#d4af37] text-[#d4af37] rounded hover:bg-[#d4af37] hover:text-black transition"
        >
          Crear
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="mb-4">
        <input
          placeholder="Buscar usuario..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#111] border border-[#333] p-2 rounded w-full"
        />
      </div>

      {/* CONTADOR */}
      <div className="mb-4 text-gray-400">
        Total usuarios: {filteredUsers.length}
      </div>

      {/* LISTA */}
      <div className="flex flex-col gap-2">

        {filteredUsers.map((u, i) => (
          <div
            key={i}
            className="flex justify-between items-center border border-[#333] p-3 rounded bg-[#111]"
          >
            <div>
              {u.username}{" "}
              <span className="text-gray-500">({u.role})</span>
            </div>

            <div className="flex gap-2">

              <button
                onClick={() => handleReset(u.username)}
                className="px-3 py-1 border border-blue-500 text-blue-400 rounded hover:bg-blue-500 hover:text-black transition"
              >
                Reset
              </button>

              <button
                onClick={() => handleDelete(u.username)}
                className="px-3 py-1 border border-red-500 text-red-400 rounded hover:bg-red-500 hover:text-black transition"
              >
                Borrar
              </button>

            </div>
          </div>
        ))}

      </div>

    </div>
  );
}