import React, { useCallback } from "react";
import { CampoTexto } from "../../../shared/components/common";
import { fechaISOColombia } from "../../../utils/pedidos";

function AdminPedidosFiltrosBase({
  filtroPedidos,
  setFiltroPedidos,
  fechaSeleccionada,
  setFechaSeleccionada,
  hayBusquedaPedidos,
  setBusqueda,
  busqueda,
}) {
  const seleccionarHoy = useCallback(() => {
    setFiltroPedidos("hoy");
    setFechaSeleccionada(fechaISOColombia());
  }, [setFiltroPedidos, setFechaSeleccionada]);

  const seleccionarDia = useCallback((e) => {
    setFechaSeleccionada(e.target.value);
    setFiltroPedidos("dia");
  }, [setFechaSeleccionada, setFiltroPedidos]);

  const limpiarBusqueda = useCallback(() => {
    setBusqueda("");
  }, [setBusqueda]);

  return (
    <>
      <div className="filtros-historial">
        <button
          type="button"
          onClick={seleccionarHoy}
          className={filtroPedidos === "hoy" ? "active" : ""}
        >
          Hoy
        </button>

        <label className="calendario-filtro">
          <span>Buscar día</span>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={seleccionarDia}
          />
        </label>

        {hayBusquedaPedidos && (
          <button type="button" onClick={limpiarBusqueda}>
            Limpiar búsqueda
          </button>
        )}
      </div>

      <CampoTexto
        etiqueta="Buscar pedido"
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por cliente, ubicación o pago..."
      />
    </>
  );
}

export default React.memo(AdminPedidosFiltrosBase);
