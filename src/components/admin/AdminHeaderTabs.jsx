import React from "react";

export default function AdminHeaderTabs({
  adminUsuario,
  adminNombreRol,
  adminTab,
  setAdminTab,
  puedeVerMenu,
  puedeVerProductos,
  puedeVerGenerador,
  puedeVerRafa,
  puedeVerCatalogo,
  puedeVerGastos,
  cerrarPanelAdmin,
  navegar,
}) {
  return (
    <>
      <header className="topbar admin-panel-header">
        <div>
          <div className="brand">⚙️ Panel Administrativo</div>
          <h1>Gestión de pedidos y ventas</h1>
          <p className="muted">Control de pedidos, menú diario, solicitudes y estadísticas.</p>
          {adminUsuario?.email && <p className="muted small">Sesión activa: {adminUsuario.email}</p>}
          <p className="muted small">Rol: <strong>{adminNombreRol}</strong></p>
        </div>
        <div className="nav nav-wrap">
          <button type="button" onClick={() => navegar("/mesas", "mesas")}>
            Panel mesas
          </button>
          <button type="button" onClick={() => navegar("/pedidos", "pedidos")}>
            Pedidos hoy
          </button>
          {puedeVerGastos && (
            <button type="button" onClick={() => navegar("/gastos", "gastos")}>
              Gastos
            </button>
          )}
        </div>
      </header>

      <div className="admin-tabs">
        <button
          type="button"
          onClick={() => setAdminTab("pedidos")}
          className={adminTab === "pedidos" ? "active" : ""}
        >
          Pedidos hoy
        </button>

        {puedeVerMenu && (
          <button
            type="button"
            onClick={() => setAdminTab("menu")}
            className={adminTab === "menu" ? "active" : ""}
          >
            Editar menú diario
          </button>
        )}

        {puedeVerProductos && (
          <button
            type="button"
            onClick={() => setAdminTab("productos")}
            className={adminTab === "productos" ? "active" : ""}
          >
            Solicitud de insumos
          </button>
        )}

        {puedeVerGenerador && (
          <button
            type="button"
            onClick={() => setAdminTab("generador")}
            className={adminTab === "generador" ? "active" : ""}
          >
            Generador de menú
          </button>
        )}

        {puedeVerCatalogo && (
          <button
            type="button"
            onClick={() => setAdminTab("catalogo")}
            className={adminTab === "catalogo" ? "active" : ""}
          >
            Catálogo
          </button>
        )}
        {puedeVerGastos && (
          <button
            type="button"
            onClick={() => setAdminTab("gastos")}
            className={adminTab === "gastos" ? "active" : ""}
          >
            Gastos Diarios
          </button>
        )}

        {puedeVerRafa && (
          <button
            type="button"
            onClick={() => setAdminTab("rafa")}
            className={adminTab === "rafa" ? "active" : ""}
          >
            Rafa
          </button>
        )}

        <button
          type="button"
          onClick={cerrarPanelAdmin}
          className="button light admin-tab-close"
        >
          Cerrar panel
        </button>
      </div>
    </>
  );
}
