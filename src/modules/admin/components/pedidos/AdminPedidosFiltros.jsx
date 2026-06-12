import React, { useCallback } from "react";
import { CampoTexto } from "../../../../shared/components/common";
import { fechaISOColombia } from "../../../../shared/utils/pedidos";

function AdminPedidosFiltrosBase({
  filtroPedidos,
  setFiltroPedidos,
  fechaSeleccionada,
  setFechaSeleccionada,
  hayBusquedaPedidos,
  setBusqueda,
  busqueda,
  busquedaNumeroPedido = "",
  setBusquedaNumeroPedido,
  buscarPedidoPorNumeroGlobal,
  limpiarBusquedaNumeroPedido,
  cargandoNumeroPedido = false,
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

  const cambiarBusquedaNumero = useCallback((valor) => {
    if (setBusquedaNumeroPedido) {
      setBusquedaNumeroPedido(String(valor || "").replace(/\D+/g, ""));
    }
  }, [setBusquedaNumeroPedido]);

  const enviarBusquedaNumero = useCallback((event) => {
    event.preventDefault();
    if (buscarPedidoPorNumeroGlobal) buscarPedidoPorNumeroGlobal();
  }, [buscarPedidoPorNumeroGlobal]);

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
        placeholder="Buscar por cliente, producto, pago, mesa, estado u observación..."
      />

      <form className="pedido-numero-global" onSubmit={enviarBusquedaNumero}>
        <CampoTexto
          etiqueta="Buscar número de pedido sin fecha"
          value={busquedaNumeroPedido}
          onChange={cambiarBusquedaNumero}
          placeholder="Ej: 1234"
        />
        <div className="pedido-numero-global-actions">
          <button type="submit" className="button light" disabled={cargandoNumeroPedido}>
            {cargandoNumeroPedido ? "Buscando..." : "Buscar número"}
          </button>
          {busquedaNumeroPedido && (
            <button type="button" className="button light" onClick={limpiarBusquedaNumeroPedido} disabled={cargandoNumeroPedido}>
              Limpiar número
            </button>
          )}
        </div>
      </form>
    </>
  );
}

export default React.memo(AdminPedidosFiltrosBase);
