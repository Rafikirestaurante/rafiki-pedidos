import React from "react";
import PWAClearCacheButton from "../../../../shared/components/PWAClearCacheButton.jsx";

export default function RafaHeaderTabs({
  adminUsuario,
  adminNombreRol,
  navegar,
  cerrarPanelAdmin,
}) {
  return (
    <header className="topbar admin-panel-header">
      <div>
        <div className="brand">🦁 Panel Rafa</div>
        <h1>Centro administrativo avanzado</h1>
        <p className="muted">Informes, catálogo, gastos diarios, inventario y caja.</p>
        {adminUsuario?.email && <p className="muted small">Sesión activa: {adminUsuario.email}</p>}
        <p className="muted small">Rol: <strong>{adminNombreRol}</strong></p>
      </div>
      <div className="nav nav-wrap">
        <button type="button" onClick={() => navegar("/admin", "admin")}>
          Panel admin
        </button>
        <button type="button" onClick={() => navegar("/mesas", "mesas")}>
          Panel mesas
        </button>
        <button type="button" onClick={() => navegar("/pedidos", "pedidos")}>
          Pedidos hoy
        </button>
        <button type="button" onClick={cerrarPanelAdmin} className="button light">
          Cerrar panel
        </button>
        <PWAClearCacheButton compact />
      </div>
    </header>
  );
}
