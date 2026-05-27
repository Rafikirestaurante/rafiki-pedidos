import React, { useEffect, useMemo, useState } from "react";
import { supabaseConfigMensaje, supabaseConfigOk } from "../../supabaseClient";
import {
  CATEGORIAS_GASTOS,
  METODOS_PAGO_GASTOS,
  actualizarGastoDiario,
  cargarGastosDiarios,
  crearGastoDiario,
  eliminarGastoDiario,
  obtenerFechaGastoHoy
} from "../../services/gastosDiariosService";

const FORMULARIO_INICIAL = {
  numeroFactura: "",
  fecha: obtenerFechaGastoHoy(),
  proveedor: "",
  articulos: "",
  valor: "",
  categoria: "mercado",
  metodoPago: "efectivo",
  observacion: ""
};

function dinero(valor) {
  return Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function capitalizar(texto) {
  const limpio = String(texto || "").trim();
  if (!limpio) return "Sin definir";
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function resumirPorCampo(gastos, campo) {
  return gastos.reduce((acc, gasto) => {
    const clave = gasto[campo] || "otro";
    acc[clave] = (acc[clave] || 0) + Number(gasto.valor || 0);
    return acc;
  }, {});
}

export default function GastosDiarios({ esAdministrador = false, modoRapido = false, mostrarInforme = true }) {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [fechaInforme, setFechaInforme] = useState(obtenerFechaGastoHoy());
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const totalGastos = useMemo(() => gastos.reduce((total, gasto) => total + Number(gasto.valor || 0), 0), [gastos]);
  const resumenCategorias = useMemo(() => resumirPorCampo(gastos, "categoria"), [gastos]);
  const resumenPagos = useMemo(() => resumirPorCampo(gastos, "metodoPago"), [gastos]);

  async function cargar(fecha = fechaInforme) {
    if (!supabaseConfigOk || !esAdministrador) return;
    setCargando(true);
    setError("");
    try {
      const data = await cargarGastosDiarios(fecha);
      setGastos(data);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los gastos diarios.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar(fechaInforme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInforme, esAdministrador]);

  function cambiarCampo(campo, valor) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  }

  function limpiarFormulario() {
    setFormulario({ ...FORMULARIO_INICIAL, fecha: obtenerFechaGastoHoy() });
    setEditandoId(null);
  }

  async function guardarGasto(event) {
    event.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      if (editandoId) {
        await actualizarGastoDiario(editandoId, formulario);
        setMensaje("Gasto actualizado correctamente.");
      } else {
        await crearGastoDiario(formulario);
        setMensaje("Gasto guardado correctamente.");
      }
      const fechaGuardada = formulario.fecha || obtenerFechaGastoHoy();
      limpiarFormulario();
      if (esAdministrador) {
        setFechaInforme(fechaGuardada);
        await cargar(fechaGuardada);
      }
    } catch (err) {
      setError(err?.message || "No se pudo guardar el gasto.");
    } finally {
      setGuardando(false);
    }
  }

  function editarGasto(gasto) {
    setEditandoId(gasto.id);
    setFormulario({
      numeroFactura: gasto.numeroFactura || "",
      fecha: gasto.fecha || obtenerFechaGastoHoy(),
      proveedor: gasto.proveedor || "",
      articulos: gasto.articulos || "",
      valor: gasto.valor || "",
      categoria: gasto.categoria || "otro",
      metodoPago: gasto.metodoPago || "efectivo",
      observacion: gasto.observacion || ""
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function eliminarGasto(gasto) {
    const confirmar = window.confirm(`¿Eliminar el gasto de ${gasto.proveedor} por $${dinero(gasto.valor)}?`);
    if (!confirmar) return;
    setError("");
    setMensaje("");
    try {
      await eliminarGastoDiario(gasto.id);
      setMensaje("Gasto eliminado correctamente.");
      await cargar(fechaInforme);
    } catch (err) {
      setError(err?.message || "No se pudo eliminar el gasto.");
    }
  }

  return (
    <section className={modoRapido ? "card card-pad gastos-diarios-panel gastos-rapidos-panel" : "card card-pad gastos-diarios-panel"}>
      <style>{`
        .gastos-diarios-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
        .gastos-diarios-panel input, .gastos-diarios-panel textarea, .gastos-diarios-panel select { width: 100%; }
        .gastos-resumen-mini { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 12px 0; }
        .gastos-resumen-card { border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 14px; padding: 10px 12px; background: #fffaf0; }
        .gastos-resumen-card strong { display: block; color: #111827; }
        .gastos-tabla-wrap { overflow-x: auto; margin-top: 12px; }
        .gastos-tabla { width: 100%; border-collapse: collapse; min-width: 760px; }
        .gastos-tabla th, .gastos-tabla td { padding: 9px 10px; border-bottom: 1px solid rgba(15, 23, 42, 0.1); text-align: left; vertical-align: top; }
        .gastos-tabla th { background: #fff7ed; color: #111827; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; }
        .gastos-informe-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
        .gastos-acciones { display: flex; gap: 8px; flex-wrap: wrap; }
        .gastos-rapidos-panel { max-width: 720px; margin: 0 auto; }
        .gastos-rapidos-panel .gastos-formulario-box { padding: 16px; }
        .gastos-rapidos-panel .gastos-boton-guardar { min-height: 52px; font-size: 1.02rem; }
        @media (max-width: 720px) {
          .gastos-diarios-grid { grid-template-columns: 1fr; }
          .gastos-informe-header { align-items: stretch; }
          .gastos-informe-header label { width: 100%; }
          .gastos-tabla { min-width: 680px; }
          .gastos-rapidos-panel { border-radius: 18px; padding: 14px; }
        }
      `}</style>

      <div className="gastos-rapidos-header">
        <h2>{modoRapido ? "💸 Registrar gasto rápido" : "💸 Gastos Diarios"}</h2>
        <p className="muted">{modoRapido ? "Formulario liviano para guardar gastos desde el celular." : "Registra facturas, compras y salidas de dinero del día. El informe inferior solo lo ve el rol administrador."}</p>
      </div>

      {!supabaseConfigOk && <div className="alert alert-warning">{supabaseConfigMensaje}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={guardarGasto} className="box soft gastos-formulario-box" style={{ marginTop: 12 }}>
        <h3>{editandoId ? "Editar gasto" : "Registrar gasto"}</h3>
        <div className="gastos-diarios-grid">
          <label className="field-label">No. factura
            <input value={formulario.numeroFactura} onChange={(e) => cambiarCampo("numeroFactura", e.target.value)} placeholder="Ej: FV-123" />
          </label>
          <label className="field-label">Fecha
            <input type="date" value={formulario.fecha} onChange={(e) => cambiarCampo("fecha", e.target.value)} />
          </label>
          <label className="field-label">Proveedor *
            <input value={formulario.proveedor} onChange={(e) => cambiarCampo("proveedor", e.target.value)} placeholder="Ej: Olímpica, carnicería, proveedor" required />
          </label>
          <label className="field-label">Valor *
            <input type="number" min="0" step="100" value={formulario.valor} onChange={(e) => cambiarCampo("valor", e.target.value)} placeholder="0" required />
          </label>
          <label className="field-label">Categoría
            <select value={formulario.categoria} onChange={(e) => cambiarCampo("categoria", e.target.value)}>
              {CATEGORIAS_GASTOS.map((categoria) => <option key={categoria} value={categoria}>{capitalizar(categoria)}</option>)}
            </select>
          </label>
          <label className="field-label">Método de pago
            <select value={formulario.metodoPago} onChange={(e) => cambiarCampo("metodoPago", e.target.value)}>
              {METODOS_PAGO_GASTOS.map((metodo) => <option key={metodo} value={metodo}>{capitalizar(metodo)}</option>)}
            </select>
          </label>
        </div>

        <label className="field-label" style={{ marginTop: 12 }}>Artículos
          <textarea rows="3" value={formulario.articulos} onChange={(e) => cambiarCampo("articulos", e.target.value)} placeholder="Opcional. Puedes escribir solo los artículos principales." />
        </label>

        <label className="field-label" style={{ marginTop: 12 }}>Observación
          <textarea rows="2" value={formulario.observacion} onChange={(e) => cambiarCampo("observacion", e.target.value)} placeholder="Opcional. Ej: compra urgente, factura pendiente, etc." />
        </label>

        <div className="admin-actions-stack horizontal" style={{ marginTop: 12 }}>
          <button type="submit" className="button gastos-boton-guardar" disabled={guardando || !supabaseConfigOk}>{guardando ? "Guardando..." : editandoId ? "Actualizar gasto" : "Guardar gasto"}</button>
          <button type="button" className="button light" onClick={limpiarFormulario}>Limpiar</button>
        </div>
      </form>

      {mostrarInforme && (
      <section className="box" style={{ marginTop: 16 }}>
        <div className="gastos-informe-header">
          <div>
            <h3>📊 Informe de gastos</h3>
            <p className="muted small">Solo visible para rol administrador.</p>
          </div>
          {esAdministrador && (
            <label className="field-label" style={{ minWidth: 190 }}>Fecha del informe
              <input type="date" value={fechaInforme} onChange={(e) => setFechaInforme(e.target.value)} />
            </label>
          )}
        </div>

        {!esAdministrador ? (
          <div className="alert alert-info">El informe de gastos está restringido al rol administrador.</div>
        ) : (
          <>
            <div className="gastos-resumen-mini">
              <div className="gastos-resumen-card"><span className="muted small">Gastos registrados</span><strong>{gastos.length}</strong></div>
              <div className="gastos-resumen-card"><span className="muted small">Total del día</span><strong>${dinero(totalGastos)}</strong></div>
              <div className="gastos-resumen-card"><span className="muted small">Fecha</span><strong>{fechaInforme}</strong></div>
            </div>

            {cargando ? <div className="alert alert-info">Cargando informe de gastos...</div> : null}

            <div className="gastos-resumen-mini">
              {Object.entries(resumenCategorias).map(([categoria, total]) => (
                <div className="gastos-resumen-card" key={categoria}><span className="muted small">Categoría: {capitalizar(categoria)}</span><strong>${dinero(total)}</strong></div>
              ))}
              {Object.entries(resumenPagos).map(([metodo, total]) => (
                <div className="gastos-resumen-card" key={metodo}><span className="muted small">Pago: {capitalizar(metodo)}</span><strong>${dinero(total)}</strong></div>
              ))}
            </div>

            {!gastos.length && !cargando ? <div className="alert alert-info">No hay gastos registrados para esta fecha.</div> : null}

            {!!gastos.length && (
              <div className="gastos-tabla-wrap">
                <table className="gastos-tabla">
                  <thead>
                    <tr>
                      <th>Factura</th><th>Proveedor</th><th>Artículos</th><th>Categoría</th><th>Pago</th><th>Valor</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastos.map((gasto) => (
                      <tr key={gasto.id}>
                        <td>{gasto.numeroFactura || "—"}</td>
                        <td><strong>{gasto.proveedor}</strong>{gasto.observacion ? <><br /><span className="muted small">{gasto.observacion}</span></> : null}</td>
                        <td>{gasto.articulos || <span className="muted">Sin detalle</span>}</td>
                        <td>{capitalizar(gasto.categoria)}</td>
                        <td>{capitalizar(gasto.metodoPago)}</td>
                        <td><strong>${dinero(gasto.valor)}</strong></td>
                        <td><div className="gastos-acciones"><button type="button" className="button button-small" onClick={() => editarGasto(gasto)}>Editar</button><button type="button" className="button button-small button-danger" onClick={() => eliminarGasto(gasto)}>Eliminar</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
      )}
    </section>
  );
}
