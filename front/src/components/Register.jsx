import React, { useState } from "react";

export default function Register({ onRegister }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      if (onRegister) onRegister(data.access_token);
    } else if (res.ok) {
      setMessage("¡Registro exitoso! Iniciando sesión...");
      const loginRes = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.access_token && onRegister) {
        onRegister(loginData.access_token);
      }
    } else {
      setMessage(data.detail || "Error en el registro");
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Registrarse</h2>
      <label>
        Usuario
        <input
          name="username"
          type="text"
          value={form.username}
          onChange={handleChange}
          required
          placeholder="Elige un nombre de usuario"
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="Tu email"
        />
      </label>
      <label>
        Contraseña
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          placeholder="Elige una contraseña"
        />
      </label>
      <button type="submit">Crear cuenta</button>
      {message && <div className="auth-message">{message}</div>}
    </form>
  );
}