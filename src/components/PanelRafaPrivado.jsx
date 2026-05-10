import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { consolidarPedidos, dinero, fechaISOColombia, obtenerEstadoPedido } from "../utils/pedidos";

export default function PanelRafaPrivado() {
  const hoy = fechaISOColombia();
  const [modoFecha, setModoFecha] = useState("dia");
  const [fechaRafa, setFechaRafa] = useState(hoy);
  const [fechaInicioRafa, setFechaInicioRafa] = useState(hoy);
  const [fechaFinRafa, setFechaFinRafa] = useState(hoy);
  const [pedidosRafa, setPedidosRafa] = useState([]);
  const [cargandoRafa, setCargandoRafa] = useState(false);
  const [errorRafa, setErrorRafa] = useState("");

  const rangoRafa = useMemo(() => {
    const inicioTexto = modoFecha === "rango" ? (fechaInicioRafa || hoy) : (fechaRafa || hoy);
    const finTexto = modoFecha === "rango" ? (fechaFinRafa || inicioTexto) : inicioTexto;

    const inicio = new Date(`${inicioTexto}T00:00:00-05:00`);
    const fin = new Date(`${finTexto}T00:00:00-05:00`);
    fin.setDate(fin.getDate() + 1);

    return {
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      inicioTexto,
      finTexto
    };
  }, [modoFecha, fechaRafa, fechaInicioRafa, fechaFinRafa, hoy]);

  useEffect(() => {
    let cancelado = false;

    async function cargarPedidosRafa() {
      setCargandoRafa(true);
      setErrorRafa("");

      try {
        const { data, error } = await supabase
          .from("pedidos")
          .select("*")
          .gte("created_at", rangoRafa.inicio)
          .lt("created_at", rangoRafa.fin)
          .order("created_at", { ascending: true });

        if (cancelado) return;

        if (error) {
          setErrorRafa(`Error cargando informe: ${error.message}`);
          setPedidosRafa([]);
          return;
        }

        setPedidosRafa(data || []);
      } catch (error) {
        if (!cancelado) {
          setErrorRafa(`No se pudo cargar el informe. ${error.message || ""}`.trim());
          setPedidosRafa([]);
        }
      } finally {
        if (!cancelado) setCargandoRafa(false);
      }
    }

    cargarPedidosRafa();

    return () => {
      cancelado = true;
    };
  }, [rangoRafa]);

  const pedidosValidos = pedidosRafa.filter((pedido) => obtenerEstadoPedido(pedido) !== "Cancelado");
  const totalVentas = pedidosValidos.reduce((suma, pedido) => suma + (Number(pedido.total) || 0), 0);
  const totalPedidos = pedidosValidos.length;
  const pendientes = pedidosValidos.filter((pedido) => obtenerEstadoPedido(pedido) === "Pendiente").length;
  const finalizados = pedidosValidos.filter((pedido) => obtenerEstadoPedido(pedido) === "Finalizado").length;
  const resumenProductos = consolidarPedidos(pedidosValidos);
  const productosOrdenados = Object.entries(resumenProductos).sort((a, b) => b[1] - a[1]);
  const promedioPedido = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
  const tituloPeriodo = modoFecha === "rango"
    ? `${rangoRafa.inicioTexto} al ${rangoRafa.finTexto}`
    : rangoRafa.inicioTexto;

  return (
    <section className="card card-pad">
      <div className="admin-top-row">
        <div>
          <h2>🔒 Panel Rafa</h2>
          <p className="muted">Espacio privado para revisar información gerencial del restaurante.</p>
        </div>
      </div>

      <div className="soft-box" style={{ marginBottom: 16 }}>
        <h3>Seleccionar periodo</h3>
        <div className="filtros-historial" style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setModoFecha("dia")}
            className={modoFecha === "dia" ? "active" : ""}
          >
            Un día
          </button>
          <button
            type="button"
            onClick={() => setModoFecha("rango")}
            className={modoFecha === "rango" ? "active" : ""}
          >
            Varios días
          </button>

          {modoFecha === "dia" ? (
            <label className="calendario-filtro">
              <span>Fecha</span>
              <input
                type="date"
                value={fechaRafa}
                onChange={(e) => setFechaRafa(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label className="calendario-filtro">
                <span>Desde</span>
                <input
                  type="date"
                  value={fechaInicioRafa}
                  onChange={(e) => setFechaInicioRafa(e.target.value)}
                />
              </label>
              <label className="calendario-filtro">
                <span>Hasta</span>
                <input
                  type="date"
                  value={fechaFinRafa}
                  onChange={(e) => setFechaFinRafa(e.target.value)}
                />
              </label>
            </>
          )}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Informe seleccionado: <strong>{tituloPeriodo}</strong>
        </p>
      </div>

      {errorRafa && <div className="alert alert-error">{errorRafa}</div>}
      {cargandoRafa && <div className="alert alert-info">Cargando informe...</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <span>Ventas</span>
          <strong>{dinero(totalVentas)}</strong>
        </div>
        <div className="stat-card">
          <span>Pedidos</span>
          <strong>{totalPedidos}</strong>
        </div>
        <div className="stat-card">
          <span>Promedio</span>
          <strong>{dinero(promedioPedido)}</strong>
        </div>
        <div className="stat-card">
          <span>Pendientes</span>
          <strong>{pendientes}</strong>
        </div>
      </div>

      <div className="grid-2">
        <div className="soft-box">
          <h3>Resumen del periodo</h3>
          <p><strong>Finalizados:</strong> {finalizados}</p>
          <p><strong>Pendientes:</strong> {pendientes}</p>
          <p><strong>Total pedidos:</strong> {totalPedidos}</p>
          <p><strong>Total vendido:</strong> {dinero(totalVentas)}</p>
        </div>

        <div className="soft-box">
          <h3>Productos más pedidos</h3>
          {productosOrdenados.length === 0 ? (
            <p className="muted">Todavía no hay productos para resumir en este periodo.</p>
          ) : (
            <ul className="simple-list">
              {productosOrdenados.slice(0, 12).map(([producto, cantidad]) => (
                <li key={producto}>
                  <span>{producto}</span>
                  <strong>{cantidad}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}



