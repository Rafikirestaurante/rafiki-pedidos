import React, { useMemo, useState } from "react";
import {
  CAFETERIA_BATIDOS_CREMOSOS_SABORES,
  CAFETERIA_BATIDOS_REFRESCANTES_SABORES,
  CAFETERIA_BEBIDAS_CALIENTES,
  CAFETERIA_DESAYUNOS,
  CAFETERIA_JUGOS_TRADICIONALES_SABORES,
  CAFETERIA_POSTRES,
  CAFETERIA_SANDWICHES
} from "../data/menuCafeteria";
import { categoriasSolicitudProductos, productosRestauranteBase } from "../data/solicitudProductosData";

const STORAGE_CATALOGO_INSUMOS = "rafiki_catalogo_insumos_v1";
const STORAGE_CATALOGO_PRODUCTOS = "rafiki_catalogo_productos_v1";

function normalizarId(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function leerStorage(clave, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(clave);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

function guardarStorage(clave, data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(clave, JSON.stringify(data));
}

function crearProducto(nombre, categoria, precio = "", linea = "Cafetería") {
  return {
    id: `${normalizarId(linea)}-${normalizarId(categoria)}-${normalizarId(nombre)}`,
    linea,
    categoria,
    nombre,
    precio: precio === "" || precio == null ? "" : Number(precio),
    activo: true
  };
}

function crearInsumo(nombre, categoria) {
  return {
    id: `${normalizarId(categoria)}-${normalizarId(nombre)}`,
    categoria,
    nombre,
    activo: true
  };
}

const PRODUCTOS_INICIALES = [
  crearProducto("Parfait 12 oz", "Parfait", 12500),
  crearProducto("Parfait 16 oz", "Parfait", 16000),
  crearProducto("Parfait 22 oz", "Parfait", 19000),
  ...CAFETERIA_DESAYUNOS.map((p) => crearProducto(p.nombre, "Desayunos", p.precio)),
  ...CAFETERIA_SANDWICHES.map((p) => crearProducto(p.nombre, "Sándwiches y fritos", p.precio)),
  ...CAFETERIA_POSTRES.map((p) => crearProducto(p.nombre, "Postres y ensaladas", p.precio)),
  ...CAFETERIA_BEBIDAS_CALIENTES.map((p) => crearProducto(p.nombre, "Bebidas", p.precio)),
  ...CAFETERIA_BATIDOS_CREMOSOS_SABORES.map((nombre) => crearProducto(nombre, "Batidos cremosos")),
  ...CAFETERIA_BATIDOS_REFRESCANTES_SABORES.map((nombre) => crearProducto(nombre, "Batidos refrescantes")),
  ...CAFETERIA_JUGOS_TRADICIONALES_SABORES.map((nombre) => crearProducto(nombre, "Jugos tradicionales")),
  crearProducto("Pechuga asada sin salsa", "Platos", 16000, "Restaurante"),
  crearProducto("Cerdo asado sin salsa", "Platos", 16000, "Restaurante"),
  crearProducto("Sopas medianas sin arroz", "Sopas", 7000, "Restaurante"),
  crearProducto("Sopas medianas con arroz", "Sopas", 9000, "Restaurante"),
  crearProducto("Sancocho de pollo con arroz", "Sopas", 15000, "Restaurante")
];

const INSUMOS_INICIALES = productosRestauranteBase.map((item) => crearInsumo(item.nombre, item.categoria));

function dineroCatalogo(valor) {
  const numero = Number(valor || 0);
  if (!numero) return "";
  return numero.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function CatalogoTabla({ items, tipo, onEditar, onEliminar, onToggle }) {
  if (!items.length) return <div className="alert alert-info">No hay registros con ese filtro.</div>;

  return (
    <div className="pedidos-tabla-wrap" style={{ marginTop: 12 }}>
      <table className="pedidos-tabla-compacta">
        <thead>
          <tr>
            <th>Estado</th>
            {tipo === "productos" && <th>Línea</th>}
            <th>Categoría</th>
            <th>Nombre</th>
            {tipo === "productos" && <th>Precio</th>}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ opacity: item.activo ? 1 : 0.55 }}>
              <td>
                <button type="button" className={item.activo ? "badge badge-finalizado" : "badge"} onClick={() => onToggle(item.id)}>
                  {item.activo ? "Activo" : "Oculto"}
                </button>
              </td>
              {tipo === "productos" && <td>{item.linea}</td>}
              <td>{item.categoria}</td>
              <td><strong>{item.nombre}</strong></td>
              {tipo === "productos" && <td>{item.precio ? `$ ${dineroCatalogo(item.precio)}` : "—"}</td>}
              <td>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="button button-small" onClick={() => onEditar(item)}>Editar</button>
                  <button type="button" className="button button-small button-danger" onClick={() => onEliminar(item.id)}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CatalogoRafa() {
  const [tipo, setTipo] = useState("productos");
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState(() => leerStorage(STORAGE_CATALOGO_PRODUCTOS, PRODUCTOS_INICIALES));
  const [insumos, setInsumos] = useState(() => leerStorage(STORAGE_CATALOGO_INSUMOS, INSUMOS_INICIALES));
  const [editandoId, setEditandoId] = useState("");
  const [form, setForm] = useState({ linea: "Cafetería", categoria: "", nombre: "", precio: "" });
  const [mensaje, setMensaje] = useState("");

  const listaActual = tipo === "productos" ? productos : insumos;
  const categoriasProducto = useMemo(() => [...new Set(productos.map((item) => item.categoria).filter(Boolean))].sort(), [productos]);
  const categoriasInsumo = useMemo(() => [...categoriasSolicitudProductos].sort(), []);
  const categoriasActuales = tipo === "productos" ? categoriasProducto : categoriasInsumo;

  const listaFiltrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return listaActual;
    return listaActual.filter((item) => [item.linea, item.categoria, item.nombre].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [busqueda, listaActual]);

  function reiniciarFormulario(nuevoTipo = tipo) {
    setEditandoId("");
    setForm({ linea: "Cafetería", categoria: nuevoTipo === "productos" ? "" : CATEGORIA_SOLICITUD_DEFECTO_FALLBACK, nombre: "", precio: "" });
  }

  function cambiarTipo(nuevoTipo) {
    setTipo(nuevoTipo);
    setBusqueda("");
    setMensaje("");
    setEditandoId("");
    setForm({ linea: "Cafetería", categoria: "", nombre: "", precio: "" });
  }

  function guardar(e) {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const categoria = form.categoria.trim();
    if (!nombre || !categoria) {
      setMensaje("Completa nombre y categoría antes de guardar.");
      return;
    }

    if (tipo === "productos") {
      const nuevo = {
        id: editandoId || `${Date.now()}-${normalizarId(nombre)}`,
        linea: form.linea || "Cafetería",
        categoria,
        nombre,
        precio: form.precio === "" ? "" : Number(form.precio),
        activo: true
      };
      const actualizados = editandoId ? productos.map((item) => item.id === editandoId ? { ...item, ...nuevo, id: item.id, activo: item.activo } : item) : [nuevo, ...productos];
      setProductos(actualizados);
      guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
    } else {
      const nuevo = { id: editandoId || `${Date.now()}-${normalizarId(nombre)}`, categoria, nombre, activo: true };
      const actualizados = editandoId ? insumos.map((item) => item.id === editandoId ? { ...item, ...nuevo, id: item.id, activo: item.activo } : item) : [nuevo, ...insumos];
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
    }

    setMensaje(editandoId ? "Registro actualizado." : "Registro agregado.");
    reiniciarFormulario();
  }

  function editar(item) {
    setEditandoId(item.id);
    setForm({ linea: item.linea || "Cafetería", categoria: item.categoria || "", nombre: item.nombre || "", precio: item.precio || "" });
    setMensaje("");
  }

  function eliminar(id) {
    const confirmar = window.confirm("¿Eliminar este registro del catálogo local?");
    if (!confirmar) return;
    if (tipo === "productos") {
      const actualizados = productos.filter((item) => item.id !== id);
      setProductos(actualizados);
      guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
    } else {
      const actualizados = insumos.filter((item) => item.id !== id);
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
    }
    setMensaje("Registro eliminado.");
  }

  function toggle(id) {
    if (tipo === "productos") {
      const actualizados = productos.map((item) => item.id === id ? { ...item, activo: !item.activo } : item);
      setProductos(actualizados);
      guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
    } else {
      const actualizados = insumos.map((item) => item.id === id ? { ...item, activo: !item.activo } : item);
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
    }
  }

  function restaurarBase() {
    const confirmar = window.confirm("¿Restaurar el catálogo base? Esto reemplaza los cambios locales de esta sección.");
    if (!confirmar) return;
    setProductos(PRODUCTOS_INICIALES);
    setInsumos(INSUMOS_INICIALES);
    guardarStorage(STORAGE_CATALOGO_PRODUCTOS, PRODUCTOS_INICIALES);
    guardarStorage(STORAGE_CATALOGO_INSUMOS, INSUMOS_INICIALES);
    setMensaje("Catálogo base restaurado.");
    reiniciarFormulario();
  }

  return (
    <div className="soft-box" style={{ borderColor: "#bbf7d0", background: "linear-gradient(135deg, #f0fdf4, #ffffff)" }}>
      <div className="admin-top-row">
        <div>
          <h3>🧾 Catálogo Rafa</h3>
          <p className="muted">Listado editable de productos e insumos. Esta primera versión queda fuera de App.jsx y guarda cambios localmente.</p>
        </div>
        <button type="button" className="button button-secondary" onClick={restaurarBase}>Restaurar base</button>
      </div>

      <div className="filtros-historial" style={{ marginTop: 14 }}>
        <button type="button" onClick={() => cambiarTipo("productos")} className={tipo === "productos" ? "active" : ""}>Productos</button>
        <button type="button" onClick={() => cambiarTipo("insumos")} className={tipo === "insumos" ? "active" : ""}>Insumos</button>
        <input type="search" placeholder="Buscar por nombre, categoría o línea" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ minWidth: 240 }} />
      </div>

      <form onSubmit={guardar} className="soft-box" style={{ marginTop: 14, background: "#fff" }}>
        <h4>{editandoId ? "Editar registro" : `Agregar ${tipo === "productos" ? "producto" : "insumo"}`}</h4>
        <div className="grid-2" style={{ marginTop: 10 }}>
          {tipo === "productos" && (
            <label className="field-label">
              Línea
              <select value={form.linea} onChange={(e) => setForm((prev) => ({ ...prev, linea: e.target.value }))}>
                <option value="Cafetería">Cafetería</option>
                <option value="Restaurante">Restaurante</option>
              </select>
            </label>
          )}
          <label className="field-label">
            Categoría
            <input list="categorias-catalogo" value={form.categoria} onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))} placeholder="Ej: Parfait, Batidos, Proteínas" />
            <datalist id="categorias-catalogo">
              {categoriasActuales.map((cat) => <option key={cat} value={cat} />)}
            </datalist>
          </label>
          <label className="field-label">
            Nombre
            <input value={form.nombre} onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Nombre del producto o insumo" />
          </label>
          {tipo === "productos" && (
            <label className="field-label">
              Precio
              <input type="number" min="0" step="100" value={form.precio} onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))} placeholder="Opcional" />
            </label>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button type="submit" className="button">{editandoId ? "Guardar cambios" : "Agregar"}</button>
          {editandoId && <button type="button" className="button button-secondary" onClick={() => reiniciarFormulario()}>Cancelar edición</button>}
        </div>
      </form>

      {mensaje && <div className="alert alert-info" style={{ marginTop: 12 }}>{mensaje}</div>}
      <p className="muted" style={{ marginTop: 12 }}>{listaFiltrada.length} de {listaActual.length} registros visibles.</p>
      <CatalogoTabla items={listaFiltrada} tipo={tipo} onEditar={editar} onEliminar={eliminar} onToggle={toggle} />
    </div>
  );
}

const CATEGORIA_SOLICITUD_DEFECTO_FALLBACK = "Abarrotes, secos y condimentos";
