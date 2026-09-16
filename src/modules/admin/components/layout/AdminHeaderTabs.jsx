import PWAClearCacheButton from "../../../../shared/components/PWAClearCacheButton.jsx";

export default function AdminHeaderTabs({
  adminTab,
  setAdminTab,
  puedeVerMenu,
  puedeVerProductos,
  puedeVerGenerador,
  cerrarPanelAdmin,
}) {
  return (
    <>
      <header className="topbar admin-panel-header">
        <div>
          <div className="brand">⚙️ Admin</div>
        </div>
        <div className="admin-header-tools"><PWAClearCacheButton compact /></div>
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

        {puedeVerProductos && (
          <button
            type="button"
            onClick={() => setAdminTab("insumosPendientes")}
            className={adminTab === "insumosPendientes" ? "active" : ""}
          >
            Insumos Pendientes
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

        {puedeVerGenerador && (
          <button
            type="button"
            onClick={() => setAdminTab("historialMenu")}
            className={adminTab === "historialMenu" ? "active" : ""}
          >
            Historial de menú
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
