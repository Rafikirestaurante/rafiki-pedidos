import React, { useEffect, useMemo, useState } from "react";
import { Aviso, Boton, CampoTexto, Tarjeta } from "../common";
import {
  CATEGORIAS_INVENTARIO,
  UNIDADES_INVENTARIO,
  calcularResumenInventario,
  cargarInventarioInsumos,
  guardarInventarioInsumo,
  sincronizarInventarioDesdeCatalogoInsumos
} from "../../services/inventarioService";
import { dinero } from "../../utils/pedidos";

const FORM_INICIAL = { nombre: "", categoria: "Carnes", unidad: "kg", stockActual: "", stockMinimo: "", costoPromedio: "", activo: true };

export default function InventarioAdmin() {
  const [insumos, setInsumos] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "info" });
  const [busqueda, setBusqueda] = useState("");

  const resumen = useMemo(() => calcularResumenInventario(insumos), [insumos]);
  const insumosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return insumos;
    return insumos.filter((item) => `${item.nombre} ${item.categoria}`.toLowerCase().includes(q));
  }, [insumos, busqueda]);

  async function cargarDatos() {
    setCargando(true);
    setMensaje({ texto: "", tipo: "info" });
    try {
      setInsumos(await cargarInventarioInsumos());
    } catch (error) {
      setMensaje({ texto: `No se pudo cargar inventario: ${error.message || error}`, tipo: "error" });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarDatos(); }, []);

  function actualizarCampo(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  function editarInsumo(item) {
    setEditandoId(item.id);
    setForm({
      nombre: item.nombre,
      categoria: item.categoria,
      unidad: item.unidad,
      stockActual: String(item.stockActual),
      stockMinimo: String(item.stockMinimo),
      costoPromedio: String(item.costoPromedio),
      activo: item.activo
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function traerBaseCatalogo() {
    setGuardando(true);
    setMensaje({ texto: "", tipo: "info" });
    try {
      const insertados = await sincronizarInventarioDesdeCatalogoInsumos(insumos);
      await cargarDatos();
      setMensaje({
        texto: insertados.length
          ? `${insertados.length} insumos fueron traídos desde el catálogo de Solicitud de insumos.`
          : "El inventario ya está sincronizado con el catálogo de Solicitud de insumos.",
        tipo: "success"
      });
    } catch (error) {
      setMensaje({ texto: `No se pudo traer la base del catálogo: ${error.message || error}`, tipo: "error" });
    } finally {
      setGuardando(false);
    }
  }

  async function guardar(event) {
    event.preventDefault();
    setGuardando(true);
    setMensaje({ texto: "", tipo: "info" });
    try {
      await guardarInventarioInsumo({ ...form, id: editandoId || undefined });
      setForm(FORM_INICIAL);
      setEditandoId("");
      await cargarDatos();
      setMensaje({ texto: editandoId ? "Insumo actualizado." : "Insumo creado en inventario.", tipo: "success" });
    } catch (error) {
      setMensaje({ texto: error.message || "No se pudo guardar el insumo.", tipo: "error" });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="admin-stack">
      <Tarjeta>
        <div className="section-title-row">
          <div>
            <h2>📦 Inventario inteligente</h2>
            <p className="muted">Fase 24A: inventario conectado a la base de insumos usada en Solicitud de insumos. Primero trae esa base y luego ajusta stock, mínimos y costos.</p>
          </div>
          <div className="admin-actions-stack horizontal">
            <Boton variante="light" onClick={traerBaseCatalogo} disabled={guardando}>Traer insumos del catálogo</Boton>
            <Boton variante="light" onClick={cargarDatos}>Actualizar</Boton>
          </div>
        </div>
        <Aviso mensaje={mensaje.texto} tipo={mensaje.tipo} />
        <div className="stats-grid" style={{ marginTop: 12 }}>
          <div className="stat-card"><span>Insumos activos</span><strong>{resumen.totalInsumos}</strong></div>
          <div className="stat-card"><span>Stock bajo</span><strong>{resumen.stockBajo}</strong></div>
          <div className="stat-card"><span>Agotados</span><strong>{resumen.agotados}</strong></div>
          <div className="stat-card"><span>Valor estimado</span><strong>{dinero(resumen.valorEstimado)}</strong></div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h3>{editandoId ? "Editar insumo" : "Crear insumo"}</h3>
        <form onSubmit={guardar} className="grid-form">
          <CampoTexto etiqueta="Nombre" value={form.nombre} onChange={(v) => actualizarCampo("nombre", v)} placeholder="Ej: Pechuga, arroz, tomate" />
          <label className="field"><span>Categoría</span><select value={form.categoria} onChange={(e) => actualizarCampo("categoria", e.target.value)}>{CATEGORIAS_INVENTARIO.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field"><span>Unidad</span><select value={form.unidad} onChange={(e) => actualizarCampo("unidad", e.target.value)}>{UNIDADES_INVENTARIO.map((u) => <option key={u}>{u}</option>)}</select></label>
          <CampoTexto etiqueta="Stock actual" type="number" value={form.stockActual} onChange={(v) => actualizarCampo("stockActual", v)} placeholder="0" />
          <CampoTexto etiqueta="Stock mínimo" type="number" value={form.stockMinimo} onChange={(v) => actualizarCampo("stockMinimo", v)} placeholder="0" />
          <CampoTexto etiqueta="Costo promedio" type="number" value={form.costoPromedio} onChange={(v) => actualizarCampo("costoPromedio", v)} placeholder="0" />
          <div className="admin-actions-stack horizontal">
            <Boton tipo="submit" disabled={guardando}>{guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear insumo"}</Boton>
            {editandoId && <Boton variante="light" onClick={() => { setEditandoId(""); setForm(FORM_INICIAL); }}>Cancelar</Boton>}
          </div>
        </form>
      </Tarjeta>

      <Tarjeta>
        <div className="section-title-row"><h3>Listado de inventario</h3><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar insumo..." /></div>
        {cargando ? <p className="muted">Cargando inventario...</p> : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Insumo</th><th>Categoría</th><th>Stock</th><th>Mínimo</th><th>Costo</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {insumosFiltrados.map((item) => {
                  const bajo = item.stockActual <= item.stockMinimo;
                  return <tr key={item.id}><td><strong>{item.nombre}</strong></td><td>{item.categoria}</td><td>{item.stockActual} {item.unidad}</td><td>{item.stockMinimo} {item.unidad}</td><td>{dinero(item.costoPromedio)}</td><td>{bajo ? "⚠️ Bajo" : "✅ OK"}</td><td><button type="button" className="button light" onClick={() => editarInsumo(item)}>Editar</button></td></tr>;
                })}
                {!insumosFiltrados.length && <tr><td colSpan="7" className="muted">Sin insumos registrados todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
