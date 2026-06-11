import React, { Suspense, lazy, useMemo, useState } from "react";
import CargandoModulo from "../../../../shared/components/CargandoModulo.jsx";

const PanelRafaPrivado = lazy(() => import("../../../dashboard/components/PanelRafaPrivado.jsx"));
const CatalogoRafa = lazy(() => import("../../../catalogo/components/CatalogoRafa.jsx"));
const GastosDiarios = lazy(() => import("../../../gastos/components/GastosDiarios.jsx"));
const InventarioAdmin = lazy(() => import("../../../inventario/components/InventarioAdmin.jsx"));
const CajaAdmin = lazy(() => import("../../../caja/components/CajaAdmin.jsx"));

const SECCIONES = [
  {
    id: "informes",
    titulo: "Informes",
    descripcion: "Dashboard, informe diario, clientes y diagnóstico de estabilidad.",
    icono: "📊",
    permiso: "rafa",
  },
  {
    id: "catalogo",
    titulo: "Catálogo",
    descripcion: "Productos, insumos y configuración base del menú.",
    icono: "📦",
    permiso: "catalogo",
  },
  {
    id: "gastos",
    titulo: "Gastos Diarios",
    descripcion: "Registro, consulta e informe de gastos del restaurante.",
    icono: "💸",
    permiso: "gastos",
  },
  {
    id: "inventario",
    titulo: "Inventario",
    descripcion: "Movimientos, existencias y control operativo de insumos.",
    icono: "🧾",
    permiso: "inventario",
  },
  {
    id: "caja",
    titulo: "Caja",
    descripcion: "Inicio del día, fin del día y cuadre real de dinero.",
    icono: "💰",
    permiso: "caja",
  },
];

function BotonSeccion({ seccion, activa, onClick }) {
  return (
    <button
      type="button"
      className={`card card-pad rafa-panel-link ${activa ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="rafa-panel-link-icon" aria-hidden="true">{seccion.icono}</div>
      <div>
        <strong>{seccion.titulo}</strong>
        <p className="muted small">{seccion.descripcion}</p>
      </div>
    </button>
  );
}

export default function PanelRafaAdmin({
  puedeVerCatalogo = false,
  puedeVerGastos = false,
  puedeVerInventario = false,
  puedeVerCaja = false,
  puedeVerInformeGastos = false,
}) {
  const permisos = useMemo(() => ({
    rafa: true,
    catalogo: puedeVerCatalogo,
    gastos: puedeVerGastos,
    inventario: puedeVerInventario,
    caja: puedeVerCaja,
  }), [puedeVerCatalogo, puedeVerGastos, puedeVerInventario, puedeVerCaja]);

  const seccionesDisponibles = useMemo(
    () => SECCIONES.filter((seccion) => permisos[seccion.permiso]),
    [permisos]
  );

  const [seccionActiva, setSeccionActiva] = useState(seccionesDisponibles[0]?.id || "informes");
  const seccionActual = seccionesDisponibles.find((seccion) => seccion.id === seccionActiva) || seccionesDisponibles[0];

  if (!seccionActual) {
    return (
      <section className="card card-pad">
        <h2>Panel Rafa</h2>
        <p className="muted">Tu rol no tiene módulos administrativos avanzados disponibles.</p>
      </section>
    );
  }

  return (
    <section className="rafa-admin-panel">
      <div className="card card-pad">
        <div className="section-header-row">
          <div>
            <h2>Panel Rafa</h2>
            <p className="muted">
              Centro administrativo privado para informes, catálogo, gastos, inventario y caja.
            </p>
          </div>
        </div>

        <div className="grid rafa-panel-grid">
          {seccionesDisponibles.map((seccion) => (
            <BotonSeccion
              key={seccion.id}
              seccion={seccion}
              activa={seccion.id === seccionActual.id}
              onClick={() => setSeccionActiva(seccion.id)}
            />
          ))}
        </div>
      </div>

      <div className="rafa-panel-content">
        {seccionActual.id === "informes" && (
          <Suspense fallback={<CargandoModulo texto="Cargando informes..." />}>
            <PanelRafaPrivado />
          </Suspense>
        )}

        {seccionActual.id === "catalogo" && (
          <Suspense fallback={<CargandoModulo texto="Cargando catálogo..." />}>
            <CatalogoRafa />
          </Suspense>
        )}

        {seccionActual.id === "gastos" && (
          <Suspense fallback={<CargandoModulo texto="Cargando gastos diarios..." />}>
            <GastosDiarios esAdministrador={puedeVerInformeGastos} />
          </Suspense>
        )}

        {seccionActual.id === "inventario" && (
          <Suspense fallback={<CargandoModulo texto="Cargando inventario..." />}>
            <InventarioAdmin />
          </Suspense>
        )}

        {seccionActual.id === "caja" && (
          <Suspense fallback={<CargandoModulo texto="Cargando caja..." />}>
            <CajaAdmin />
          </Suspense>
        )}
      </div>
    </section>
  );
}
