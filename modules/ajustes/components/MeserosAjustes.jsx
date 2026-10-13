import React, { useCallback, useEffect, useMemo, useState } from "react";
import { actualizarMesero, crearMesero, listarMeseros } from "../../../services/meserosService";

export default function MeserosAjustes() {
  const [meseros, setMeseros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const resultado = await listarMeseros({ soloActivos: false });
    setMeseros(resultado.meseros || []);
    if (!resultado.ok && resultado.mensaje) setError(resultado.mensaje);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const siguienteOrden = useMemo(
    () => Math.max(0, ...meseros.map((item) => Number(item.orden || 0))) + 1,
    [meseros]
  );

  function cancelarEdicion() {
    setEditandoId(null);
    setNombre("");
  }

  async function guardar(event) {
    event.preventDefault();
    const valor = nombre.trim();
    if (!valor || guardando) return;
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      if (editandoId) {
        await actualizarMesero(editandoId, { nombre: valor });
        setMensaje("Nombre del mesero actualizado.");
      } else {
        await crearMesero({ nombre: valor, orden: siguienteOrden });
        setMensaje("Mesero agregado correctamente.");
      }
      cancelarEdicion();
      await cargar();
    } catch (err) {
      setError(err?.message || "No se pudo guardar el mesero.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(mesero) {
    if (!mesero?.id || String(mesero.id).startsWith("local-") || guardando) {
      if (String(mesero?.id || "").startsWith("local-")) setError("Ejecuta el SQL de la Fase 39 para poder modificar los meseros.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      await actualizarMesero(mesero.id, { activo: mesero.activo === false });
      setMensaje(mesero.activo === false ? "Mesero activado." : "Mesero desactivado. Los pedidos históricos conservan su nombre.");
      await cargar();
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el estado del mesero.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="soft-box" style={{ marginTop: 14, borderColor: "#bfdbfe", background: "linear-gradient(135deg, #eff6ff, #ffffff)" }}>
      <div className="admin-top-row">
        <div>
          <h3 style={{ marginBottom: 4 }}>👥 Meseros</h3>
          <p className="muted small" style={{ margin: 0 }}>Administra los nombres que aparecen al tomar pedidos en /mesas. Desactivar conserva el historial.</p>
        </div>
      </div>

      {mensaje && <div className="alert alert-success" style={{ marginTop: 12 }}>{mensaje}</div>}
      {error && <div className="alert alert-warning" style={{ marginTop: 12 }}>{error}</div>}

      <form onSubmit={guardar} className="cartera-actions" style={{ marginTop: 14, alignItems: "end" }}>
        <label className="field" style={{ minWidth: 240, flex: 1 }}>
          <span>{editandoId ? "Editar nombre" : "Nuevo mesero"}</span>
          <input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Nombre del mesero" maxLength={60} />
        </label>
        <button type="submit" className="button" disabled={guardando || !nombre.trim()}>{guardando ? "Guardando..." : editandoId ? "Guardar cambio" : "Agregar mesero"}</button>
        {editandoId && <button type="button" className="button light" onClick={cancelarEdicion} disabled={guardando}>Cancelar</button>}
      </form>

      <div className="pedidos-tabla-wrap" style={{ marginTop: 14 }}>
        <table className="pedidos-tabla-compacta">
          <thead><tr><th>Mesero</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="3">Cargando meseros...</td></tr>
            ) : meseros.length === 0 ? (
              <tr><td colSpan="3">No hay meseros configurados.</td></tr>
            ) : meseros.map((mesero) => (
              <tr key={mesero.id} className={mesero.activo === false ? "subtle-row" : ""}>
                <td><strong>{mesero.nombre}</strong></td>
                <td>{mesero.activo === false ? "Inactivo" : "Activo"}</td>
                <td>
                  <div className="cartera-actions" style={{ margin: 0 }}>
                    <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={() => { setEditandoId(mesero.id); setNombre(mesero.nombre); setMensaje(""); setError(""); }} disabled={guardando || String(mesero.id).startsWith("local-")}>Editar</button>
                    <button type="button" className={`mini-btn ${mesero.activo === false ? "green" : "danger"}`} style={{ width: "auto", marginBottom: 0 }} onClick={() => cambiarEstado(mesero)} disabled={guardando || String(mesero.id).startsWith("local-")}>{mesero.activo === false ? "Activar" : "Desactivar"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
