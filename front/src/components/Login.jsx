import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (res.ok && data.access_token) {
      const decoded = jwtDecode(data.access_token);
      const userObj = {
        id: decoded.sub,
        username: decoded.username,
        role: decoded.role,
        token: data.access_token,
      };
      localStorage.setItem("user", JSON.stringify(userObj));
      setMessage("¡Login exitoso!");
      if (onLogin) onLogin(userObj);
    } else {
      setMessage(typeof data.detail === "string" ? data.detail : "Error en el login");
    }
  };

  const handleResetRequest = async e => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/auth/password-reset-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setResetToken(data.token);
      setResetStep(2);
      setMessage("Te enviamos un token de recuperación. Ingresa tu nueva contraseña.");
    } else {
      setMessage(data.msg || "Si el email existe, se ha enviado un enlace.");
    }
  };

  const handleResetConfirm = async e => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/auth/password-reset-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, new_password: newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Contraseña restablecida. Ahora puedes iniciar sesión.");
      setShowReset(false);
      setResetStep(1);
      setResetEmail("");
      setNewPassword("");
      setResetToken("");
    } else {
      setMessage(data.detail || "No se pudo restablecer la contraseña.");
    }
  };

  if (showReset) {
    return (
      <form className="auth-form" onSubmit={resetStep === 1 ? handleResetRequest : handleResetConfirm}>
        <h2>Recuperar contraseña</h2>
        {resetStep === 1 ? (
          <>
            <label>
              Email
              <input
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="Tu email registrado"
              />
            </label>
            <button type="submit">Solicitar recuperación</button>
          </>
        ) : (
          <>
            <label>
              Nueva contraseña
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Nueva contraseña"
              />
            </label>
            <button type="submit">Restablecer contraseña</button>
          </>
        )}
        <button type="button" className="auth-link" onClick={() => { setShowReset(false); setMessage(""); }}>Volver al login</button>
        {message && (
          <div className={`auth-message${typeof message === "string" && message.toLowerCase().includes("error") ? " error" : ""}`}>
            {message}
          </div>
        )}
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Iniciar sesión</h2>
      <label>
        Email
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
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
          autoComplete="current-password"
          placeholder="Tu contraseña"
        />
      </label>
      <button type="submit">Entrar</button>
      <button type="button" className="auth-link" onClick={() => setShowReset(true)}>
        ¿Olvidaste tu contraseña?
      </button>
      {message && (
        <div className={`auth-message${typeof message === "string" && message.toLowerCase().includes("error") ? " error" : ""}`}>
          {message}
        </div>
      )}
    </form>
  );
}