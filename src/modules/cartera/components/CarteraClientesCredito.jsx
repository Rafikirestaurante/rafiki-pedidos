import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  activarClienteCredito,
  crearClienteCredito,
  desactivarClienteCredito,
  editarClienteCredito,
  listarClientesCredito,
} from "../../../services/clientesCreditoService";

const FORM_INICIAL = {
  nombre: "",
  telefono: "",
  observaciones: "",
};

function dinero(valor) {
  return Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatearFecha(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CarteraClientesCredito() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [clienteEditandoId, setClienteEditandoId] = useState(null);

  const cargarClientes = useCallback(async () => {
    setCargando(true);
    setError("");
    const data = await listarClientesCredito({ busqueda, incluirInactivos: mostrarInactivos });
    setClientes(data);
    setCargando(false);
  }, [busqueda, mostrarInactivos]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const indicadores = useMemo(() => {
    const activos = clientes.filter((cliente) => cliente.activo !== false);
    const conSaldo = clientes.filter((cliente) => Number(cliente.saldo_pendiente || 0) > 0);
    const saldoTotal = clientes.reduce((total, cliente) => total + Number(cliente.saldo_pendiente || 0), 0);
    return { activos: activos.length, conSaldo: conSaldo.length, saldoTotal };
  }, [clientes]);

  const clienteEditando = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteEditandoId) || null,
    [clientes, clienteEditandoId]
  );

  function limpiarFormulario() {
    setFormulario(FORM_INICIAL);
    setClienteEditandoId(null);
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function editar(cliente) {
    setClienteEditandoId(cliente.id);
    setFormulario({
      nombre: cliente.nombre || "",
      telefono: cliente.telefono || "",
      observaciones: cliente.observaciones || "",
    });
    setMensaje("");
    setError("");
  }

  async function guardarCliente(evento) {
    evento.preventDefault();
    if (!formulario.nombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      if (clienteEditandoId) {
        await editarClienteCredito(clienteEditandoId, formulario);
        setMensaje("Cliente crédito actualizado correctamente.");
      } else {
        await crearClienteCredito(formulario);
        setMensaje("Cliente crédito creado correctamente.");
      }
      limpiarFormulario();
      await cargarClientes();
    } catch (err) {
      const detalle = err?.message ? ` ${err.message}` : "";
      setError(`No se pudo guardar el cliente.${detalle}`);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(cliente) {
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      if (cliente.activo === false) {
        await activarClienteCredito(cliente.id);
        setMensaje("Cliente activado correctamente.");
      } else {
        await desactivarClienteCredito(cliente.id);
        setMensaje("Cliente desactivado correctamente.");
      }
      await cargarClientes();
    } catch (err) {
      const detalle = err?.message ? ` ${err.message}` : "";
      setError(`No se pudo cambiar el estado del cliente.${detalle}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="cartera-clientes-panel">
      <style>{`
        .cartera-clientes-panel .cartera-indicadores { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 12px 0; }
        .cartera-clientes-panel .cartera-indicador { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 12px; }
        .cartera-clientes-panel .cartera-indicador small { display: block; color: #9a3412; font-weight: 800; margin-bottom: 4px; }
        .cartera-clientes-panel .cartera-indicador strong { display: block; font-size: 20px; color: #431407; }
        .cartera-clientes-panel .cartera-form { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px; align-items: end; margin-top: 10px; }
        .cartera-clientes-panel .cartera-form textarea { grid-column: 1 / -1; }
        .cartera-clientes-panel input, .cartera-clientes-panel textarea { width: 100%; min-height: 44px; border: 1px solid #e7e5e4; border-radius: 14px; padding: 10px 12px; font: inherit; background: #fff; }
        .cartera-clientes-panel textarea { min-height: 76px; resize: vertical; }
        .cartera-clientes-panel .cartera-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .cartera-clientes-panel .cartera-filtros { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 14px 0 8px; }
        .cartera-clientes-panel .cartera-filtros input { flex: 1 1 220px; }
        .cartera-clientes-panel .estado-cliente { display: inline-block; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 900; background: #dcfce7; color: #166534; }
        .cartera-clientes-panel .estado-cliente.inactivo { background: #fee2e2; color: #991b1b; }
        .cartera-clientes-panel .pedidos-tabla-compacta { min-width: 900px; }
        @media (max-width: 760px) { .cartera-clientes-panel .cartera-indicadores, .cartera-clientes-panel .cartera-form { grid-template-columns: 1fr; } .cartera-clientes-panel .cartera-form textarea { grid-column: auto; } }
      `}</style>

      <div className="section-heading section-heading-pedidos-unificados">
        <div>
          <h2>Clientes Crédito</h2>
          <p className="muted small">Directorio para administrar clientes autorizados antes de activar la cartera automática.</p>
        </div>
      </div>

      <div className="cartera-indicadores">
        <div className="cartera-indicador"><small>Clientes activos</small><strong>{indicadores.activos}</strong></div>
        <div className="cartera-indicador"><small>Clientes con saldo</small><strong>{indicadores.conSaldo}</strong></div>
        <div className="cartera-indicador"><small>Total cartera pendiente</small><strong>{dinero(indicadores.saldoTotal)}</strong></div>
      </div>

      <form className="card card-pad" onSubmit={guardarCliente}>
        <h3>{clienteEditando ? "Editar cliente" : "+ Nuevo cliente"}</h3>
        <div className="cartera-form">
          <input value={formulario.nombre} onChange={(e) => cambiarCampo("nombre", e.target.value)} placeholder="Nombre del cliente" />
          <input value={formulario.telefono} onChange={(e) => cambiarCampo("telefono", e.target.value)} placeholder="Teléfono" />
          <textarea value={formulario.observaciones} onChange={(e) => cambiarCampo("observaciones", e.target.value)} placeholder="Observaciones" />
        </div>
        <div className="cartera-actions">
          <button type="submit" className="button" disabled={guardando}>{guardando ? "Guardando..." : clienteEditando ? "Guardar cambios" : "Crear cliente"}</button>
          {clienteEditando && <button type="button" className="button light" onClick={limpiarFormulario}>Cancelar edición</button>}
        </div>
      </form>

      {mensaje && <div className="alert success" style={{ marginTop: 10 }}>{mensaje}</div>}
      {error && <div className="alert error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="cartera-filtros">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, teléfono u observación" />
        <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={() => setMostrarInactivos((valor) => !valor)}>
          {mostrarInactivos ? "Ocultar inactivos" : "Mostrar inactivos"}
        </button>
        <button type="button" className="mini-btn print" style={{ width: "auto", marginBottom: 0 }} onClick={cargarClientes} disabled={cargando}>
          {cargando ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div className="pedidos-tabla-wrap">
        <table className="pedidos-tabla-compacta">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Último pedido</th>
              <th>Total pedidos</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>Observaciones</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr><td colSpan="8">{cargando ? "Cargando clientes..." : "Sin clientes registrados."}</td></tr>
            ) : clientes.map((cliente) => (
              <tr key={cliente.id} className={cliente.activo === false ? "fila-borrada" : ""}>
                <td><strong>{cliente.nombre}</strong><small>{Array.isArray(cliente.alias) && cliente.alias.length ? cliente.alias.join(", ") : "Sin alias"}</small></td>
                <td>{cliente.telefono || "—"}</td>
                <td>{formatearFecha(cliente.fecha_ultimo_pedido)}</td>
                <td>{Number(cliente.total_pedidos || 0)}</td>
                <td className="td-total">{dinero(cliente.saldo_pendiente)}</td>
                <td><span className={`estado-cliente ${cliente.activo === false ? "inactivo" : ""}`}>{cliente.activo === false ? "Inactivo" : "Activo"}</span></td>
                <td className="td-obs">{cliente.observaciones || "—"}</td>
                <td className="td-acciones">
                  <button type="button" className="mini-btn" onClick={() => editar(cliente)} disabled={guardando}>Editar</button>
                  <button type="button" className={`mini-btn ${cliente.activo === false ? "green" : "danger"}`} onClick={() => cambiarEstado(cliente)} disabled={guardando}>
                    {cliente.activo === false ? "Activar" : "Desactivar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
