import React from "react";

export function InicioRafiki({ navegar }) {
  return (
    <main className="welcome">
      <section className="welcome-card">
        <img src="/logo-rafiki.png" alt="Rafiki Restaurante" className="welcome-logo" />
        <h2>Bienvenido a Rafiki</h2>
        <p>Escoge tu almuerzo del día, selecciona tus acompañantes y envíanos tu pedido por WhatsApp.</p>

        <div className="welcome-actions">
          <button type="button" onClick={() => navegar("/cliente", "cliente")} className="welcome-button">
            🛍️ Haz tu pedido aquí
          </button>
        </div>
      </section>
    </main>
  );
}

export function AdminLogin({
  claveAdmin,
  errorClaveAdmin,
  setClaveAdmin,
  setErrorClaveAdmin,
  validarClaveAdmin,
  navegar,
}) {
  return (
    <main style={{ maxWidth: 520, margin: "0 auto" }}>
      <section className="card card-pad">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="brand">🔐 Panel Rafiki</div>
          <h2>Acceso administrativo</h2>
          <p className="muted">Ingresa la clave para ver pedidos y editar el menú diario.</p>
        </div>

        {errorClaveAdmin && <div className="alert alert-error">{errorClaveAdmin}</div>}

        <form onSubmit={validarClaveAdmin}>
          <label className="field">
            <span>Clave del panel</span>
            <input
              type="password"
              value={claveAdmin}
              onChange={(e) => {
                setClaveAdmin(e.target.value);
                setErrorClaveAdmin("");
              }}
              placeholder="Escribe la clave"
              autoFocus
            />
          </label>

          <button type="submit" className="button" style={{ width: "100%" }}>
            Entrar al panel
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setClaveAdmin("");
            setErrorClaveAdmin("");
            navegar("/", "inicio");
          }}
          className="button light"
          style={{ width: "100%", marginTop: 12 }}
        >
          Volver al inicio
        </button>
      </section>
    </main>
  );
}
