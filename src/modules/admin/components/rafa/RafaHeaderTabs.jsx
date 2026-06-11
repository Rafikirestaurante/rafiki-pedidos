import React from "react";
import PWAClearCacheButton from "../../../../shared/components/PWAClearCacheButton.jsx";

export default function RafaHeaderTabs({
  adminNombreRol,
  navegar,
  cerrarPanelAdmin,
}) {
  return (
    <header className="topbar admin-panel-header rafa-header-compact">
      <div className="rafa-header-title">
        <div className="brand">🦁 Panel Rafa</div>
        <p className="muted small">Rol: <strong>{adminNombreRol}</strong></p>
      </div>
      <div className="nav nav-wrap rafa-header-nav">
        <button type="button" onClick={() => navegar("/admin", "admin")}>
          Admin
        </button>
        <button type="button" onClick={() => navegar("/mesas", "mesas")}>
          Mesas
        </button>
        <button type="button" onClick={() => navegar("/pedidos", "pedidos")}>
          Pedidos
        </button>
        <button type="button" onClick={cerrarPanelAdmin} className="button light">
          Salir
        </button>
        <PWAClearCacheButton compact />
      </div>
    </header>
  );
}
