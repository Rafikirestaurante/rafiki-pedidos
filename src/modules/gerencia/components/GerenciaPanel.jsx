import React, { Suspense, lazy, useMemo, useState } from "react";
import CargandoModulo from "../../../shared/components/CargandoModulo.jsx";

const PanelRafaPrivado = lazy(() => import("../../dashboard/components/PanelRafaPrivado.jsx"));
const CajaAdmin = lazy(() => import("../../caja/components/CajaAdmin.jsx"));
const InventarioAdmin = lazy(() => import("../../inventario/components/InventarioAdmin.jsx"));
const CatalogoRafa = lazy(() => import("../../catalogo/components/CatalogoRafa.jsx"));
const GastosDiarios = lazy(() => import("../../gastos/components/GastosDiarios.jsx"));
const CarteraClientesCredito = lazy(() => import("../../cartera/components/CarteraClientesCredito.jsx"));

const TABS_GERENCIA = [
  { id: "inicio", label: "Inicio" },
  { id: "informes", label: "Informes" },
  { id: "caja", label: "Caja" },
  { id: "gastos", label: "Gastos" },
  { id: "cartera", label: "Cartera" },
  { id: "inventario", label: "Inventario" },
  { id: "catalogo", label: "Catálogo" },
];

export default function GerenciaPanel({
  puedeVerInformes,
  puedeVerCaja,
  puedeVerGastos,
  puedeVerInformeGastos,
  puedeVerInventario,
  puedeVerCatalogo,
  cerrarPanelAdmin,
  navegar,
}) {
  const [tabActiva, setTabActiva] = useState("inicio");

  const tarjetasInicio = useMemo(
    () => [
      {
        titulo: "Informes",
        texto: "Consulta ventas, clientes, estadísticas y reportes gerenciales.",
        tab: "informes",
        disponible: puedeVerInformes,
      },
      {
        titulo: "Caja",
        texto: "Controla inicio del día, arqueos, cierres e Informe Caja.",
        tab: "caja",
        disponible: puedeVerCaja,
      },
      {
        titulo: "Gastos",
        texto: "Registro y control gerencial de compras y salidas de dinero.",
        tab: "gastos",
        disponible: puedeVerGastos,
      },
      {
        titulo: "Cartera",
        texto: "Directorio de clientes crédito y base para cuentas por cobrar.",
        tab: "cartera",
        disponible: true,
      },
      {
        titulo: "Inventario",
        texto: "Acceso gerencial al control de insumos y alertas.",
        tab: "inventario",
        disponible: puedeVerInventario,
      },
      {
        titulo: "Catálogo",
        texto: "Gestión del catálogo conectado a productos e insumos.",
        tab: "catalogo",
        disponible: puedeVerCatalogo,
      },
    ],
    [puedeVerCatalogo, puedeVerCaja, puedeVerGastos, puedeVerInformes, puedeVerInventario]
  );

  return (
    <main className="admin-layout gerencia-layout">
      <header className="topbar admin-panel-header">
        <div>
          <div className="brand">📊 Gerencia</div>
        </div>
        <div className="nav nav-wrap">
          <button type="button" onClick={() => navegar("/admin", "admin")}>Admin</button>
          <button type="button" onClick={() => navegar("/mesas", "mesas")}>Mesas</button>
          <button type="button" onClick={() => navegar("/pedidos", "pedidos")}>Pedidos hoy</button>
          <button type="button" className="button light" onClick={cerrarPanelAdmin}>Cerrar panel</button>
        </div>
      </header>

      <div className="admin-tabs gerencia-tabs">
        {TABS_GERENCIA.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabActiva(tab.id)}
            className={tabActiva === tab.id ? "active" : ""}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabActiva === "inicio" && (
        <section className="card card-pad">
          <div className="dashboard-grid">
            {tarjetasInicio.map((tarjeta) => (
              <article key={tarjeta.tab} className="card card-pad soft-card">
                <h3>{tarjeta.titulo}</h3>
                <p className="muted small">{tarjeta.texto}</p>
                <button
                  type="button"
                  className="button"
                  onClick={() => setTabActiva(tarjeta.tab)}
                  disabled={!tarjeta.disponible}
                >
                  {tarjeta.disponible ? "Abrir" : "Sin permiso"}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tabActiva === "informes" && puedeVerInformes && (
        <Suspense fallback={<CargandoModulo texto="Cargando informes gerenciales..." />}>
          <PanelRafaPrivado />
        </Suspense>
      )}

      {tabActiva === "caja" && puedeVerCaja && (
        <Suspense fallback={<CargandoModulo texto="Cargando caja gerencial..." />}>
          <CajaAdmin />
        </Suspense>
      )}

      {tabActiva === "gastos" && puedeVerGastos && (
        <Suspense fallback={<CargandoModulo texto="Cargando gastos gerenciales..." />}>
          <GastosDiarios esAdministrador={puedeVerInformeGastos} />
        </Suspense>
      )}

      {tabActiva === "inventario" && puedeVerInventario && (
        <Suspense fallback={<CargandoModulo texto="Cargando inventario gerencial..." />}>
          <InventarioAdmin />
        </Suspense>
      )}

      {tabActiva === "catalogo" && puedeVerCatalogo && (
        <Suspense fallback={<CargandoModulo texto="Cargando catálogo gerencial..." />}>
          <CatalogoRafa />
        </Suspense>
      )}

      {tabActiva === "cartera" && (
        <Suspense fallback={<CargandoModulo texto="Cargando clientes crédito..." />}>
          <CarteraClientesCredito />
        </Suspense>
      )}

      {tabActiva !== "inicio" && tabActiva !== "cartera" && (
        ((tabActiva === "informes" && !puedeVerInformes) ||
          (tabActiva === "caja" && !puedeVerCaja) ||
          (tabActiva === "gastos" && !puedeVerGastos) ||
          (tabActiva === "inventario" && !puedeVerInventario) ||
          (tabActiva === "catalogo" && !puedeVerCatalogo)) && (
          <section className="card card-pad">
            <h2>Acceso restringido</h2>
            <p className="muted">Este módulo solo está disponible para usuarios autorizados.</p>
          </section>
        )
      )}
    </main>
  );
}
