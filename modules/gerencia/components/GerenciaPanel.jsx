import React, { Suspense, useState } from "react";
import CargandoModulo from "../../../shared/components/CargandoModulo.jsx";
import ErrorBoundary from "../../../shared/components/ErrorBoundary.jsx";
import { lazyConReintento } from "../../../shared/utils/lazyConReintento.js";

const PanelRafaPrivado = lazyConReintento(() => import("../../dashboard/components/PanelRafaPrivado.jsx"), "GerenciaInformes");
const CajaAdmin = lazyConReintento(() => import("../../caja/components/CajaAdmin.jsx"), "GerenciaCaja");
const InventarioAdmin = lazyConReintento(() => import("../../inventario/components/InventarioAdmin.jsx"), "GerenciaInventario");
const AjustesRafiki = lazyConReintento(() => import("../../ajustes/components/AjustesRafiki.jsx"), "GerenciaAjustes");
const GastosDiarios = lazyConReintento(() => import("../../gastos/components/GastosDiarios.jsx"), "GerenciaGastos");
const CarteraClientesCredito = lazyConReintento(() => import("../../cartera/components/CarteraClientesCredito.jsx"), "GerenciaCartera");

const TABS_GERENCIA = [
  { id: "informes", label: "Informes" },
  { id: "caja", label: "Caja" },
  { id: "gastos", label: "Gastos" },
  { id: "cartera", label: "Cartera" },
  { id: "inventario", label: "Inventario" },
  { id: "catalogo", label: "Ajustes" }
];

export default function GerenciaPanel({
  puedeVerInformes,
  puedeVerCaja,
  puedeVerGastos,
  puedeVerInformeGastos,
  puedeVerInventario,
  puedeVerCatalogo,
  cerrarPanelAdmin
}) {
  const [tabActiva, setTabActiva] = useState("informes");

  return (
    <main className="admin-layout gerencia-layout">
      <header className="topbar admin-panel-header">
        <div>
          <div className="brand">📊 Gerencia</div>
        </div>
        <div className="admin-header-tools">
          <button type="button" className="button light" onClick={cerrarPanelAdmin}>
            Cerrar panel
          </button>
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



      {tabActiva === "informes" && puedeVerInformes && (
        <ErrorBoundary nombreModulo="Informes gerenciales" usarRecuperacionPWA>
          <Suspense fallback={<CargandoModulo texto="Cargando informes gerenciales..." />}>
            <PanelRafaPrivado />
          </Suspense>
        </ErrorBoundary>
      )}

      {tabActiva === "caja" && puedeVerCaja && (
        <ErrorBoundary nombreModulo="Caja gerencial" usarRecuperacionPWA>
          <Suspense fallback={<CargandoModulo texto="Cargando caja gerencial..." />}>
            <CajaAdmin />
          </Suspense>
        </ErrorBoundary>
      )}

      {tabActiva === "gastos" && puedeVerGastos && (
        <ErrorBoundary nombreModulo="Gastos gerenciales" usarRecuperacionPWA>
          <Suspense fallback={<CargandoModulo texto="Cargando gastos gerenciales..." />}>
            <GastosDiarios esAdministrador={puedeVerInformeGastos} />
          </Suspense>
        </ErrorBoundary>
      )}

      {tabActiva === "inventario" && puedeVerInventario && (
        <ErrorBoundary nombreModulo="Inventario gerencial" usarRecuperacionPWA>
          <Suspense fallback={<CargandoModulo texto="Cargando inventario gerencial..." />}>
            <InventarioAdmin />
          </Suspense>
        </ErrorBoundary>
      )}

      {tabActiva === "catalogo" && puedeVerCatalogo && (
        <ErrorBoundary nombreModulo="Ajustes gerenciales" usarRecuperacionPWA>
          <Suspense fallback={<CargandoModulo texto="Cargando ajustes gerenciales..." />}>
            <AjustesRafiki />
          </Suspense>
        </ErrorBoundary>
      )}

      {tabActiva === "cartera" && (
        <ErrorBoundary nombreModulo="Cartera" usarRecuperacionPWA>
          <Suspense fallback={<CargandoModulo texto="Cargando clientes crédito..." />}>
            <CarteraClientesCredito />
          </Suspense>
        </ErrorBoundary>
      )}

      {tabActiva !== "cartera" &&
        ((tabActiva === "informes" && !puedeVerInformes) ||
          (tabActiva === "caja" && !puedeVerCaja) ||
          (tabActiva === "gastos" && !puedeVerGastos) ||
          (tabActiva === "inventario" && !puedeVerInventario) ||
          (tabActiva === "catalogo" && !puedeVerCatalogo)) && (
          <section className="card card-pad">
            <h2>Acceso restringido</h2>
            <p className="muted">Este módulo solo está disponible para usuarios autorizados.</p>
          </section>
        )}
    </main>
  );
}
