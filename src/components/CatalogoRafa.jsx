import React, { useEffect, useMemo, useState } from "react";
import { PRODUCTOS_CATALOGO_FALLBACK } from "../data/catalogoProductosData";
import { categoriasSolicitudProductos, productosRestauranteBase } from "../data/solicitudProductosData";
import { supabaseConfigOk, supabaseConfigMensaje } from "../supabaseClient";
import CatalogoGastos from "./admin/CatalogoGastos";
import {
  actualizarInsumoCatalogoAdmin,
  cargarCatalogoInsumosAdmin,
  crearInsumoCatalogoAdmin
} from "../services/catalogoInsumosService";
import {
  actualizarProductoCatalogoAdmin,
  cargarCatalogoProductosAdmin,
  crearProductoCatalogoAdmin
} from "../services/catalogoProductosService";

const STORAGE_CATALOGO_INSUMOS = "rafiki_catalogo_insumos_v1";
const STORAGE_CATALOGO_PRODUCTOS = "rafiki_catalogo_productos_v1";
const CATEGORIA_SOLICITUD_DEFECTO_FALLBACK = "Abarrotes, secos y condimentos";

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

function crearInsumo(nombre, categoria) {
  return {
    id: `${normalizarId(categoria)}-${normalizarId(nombre)}`,
    catalogoId: null,
    categoria,
    nombre,
    unidadBase: "und",
    proveedor: "",
    activo: true,
    orden: 0,
    origenCatalogo: "local"
  };
}

const PRODUCTOS_INICIALES = PRODUCTOS_CATALOGO_FALLBACK;

const INSUMOS_INICIALES = productosRestauranteBase.map((item) => crearInsumo(item.nombre, item.categoria));

function dineroCatalogo(valor) {
  const numero = Number(valor || 0);
  if (!numero) return "";
  return numero.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function CatalogoTabla({ items, tipo, onEditar, onEliminar, onToggleActivo, onToggleAgotado, onPrecioRapido }) {
  if (!items.length) return <div className="alert alert-info">No hay registros con ese filtro.</div>;

  return (
    <>
      <div className="pedidos-tabla-wrap catalogo-tabla-desktop" style={{ marginTop: 12 }}>
        <table className="pedidos-tabla-compacta">
          <thead>
            <tr>
              <th>Estado</th>
              {tipo === "productos" && <th>Agotado</th>}
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
                  <button type="button" className={item.activo ? "badge badge-estado-negro" : "badge badge-estado-negro"} onClick={() => onToggleActivo(item.id)}>
                    {item.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                {tipo === "productos" && (
                  <td>
                    <button type="button" className={item.agotado ? "badge badge-estado-negro" : "badge badge-estado-negro"} onClick={() => onToggleAgotado(item.id)}>
                      {item.agotado ? "Agotado" : "Disponible"}
                    </button>
                  </td>
                )}
                {tipo === "productos" && <td>{item.linea}</td>}
                <td>{item.categoria}</td>
                <td><strong>{item.nombre}</strong></td>
                {tipo === "productos" && (
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={item.precio ?? ""}
                      onChange={(e) => onPrecioRapido(item.id, e.target.value)}
                      className="catalogo-precio-rapido"
                      aria-label={`Precio de ${item.nombre}`}
                    />
                  </td>
                )}
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

      <div className="catalogo-cards-mobile">
        {items.map((item) => (
          <article key={item.id} className="catalogo-card" style={{ opacity: item.activo ? 1 : 0.6 }}>
            <div className="catalogo-card-head">
              <strong>{item.nombre}</strong>
              <button type="button" className={item.activo ? "badge badge-estado-negro" : "badge badge-estado-negro"} onClick={() => onToggleActivo(item.id)}>
                {item.activo ? "Activo" : "Inactivo"}
              </button>
            </div>
            <div className="catalogo-card-meta">
              {tipo === "productos" && <span>{item.linea}</span>}
              <span>{item.categoria}</span>
              {tipo === "productos" && <span>{item.agotado ? "Agotado temporal" : "Disponible"}</span>}
            </div>
            {tipo === "productos" && (
              <label className="field-label" style={{ marginTop: 8 }}>
                Precio rápido
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={item.precio ?? ""}
                  onChange={(e) => onPrecioRapido(item.id, e.target.value)}
                  className="catalogo-precio-rapido"
                />
              </label>
            )}
            <div className="catalogo-card-actions">
              {tipo === "productos" && (
                <button type="button" className={item.agotado ? "button button-small button-secondary" : "button button-small"} onClick={() => onToggleAgotado(item.id)}>
                  {item.agotado ? "Marcar disponible" : "Marcar agotado"}
                </button>
              )}
              <button type="button" className="button button-small" onClick={() => onEditar(item)}>Editar</button>
              <button type="button" className="button button-small button-danger" onClick={() => onEliminar(item.id)}>Eliminar</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default function CatalogoRafa() {
  const [tipo, setTipo] = useState("gastos");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [ordenFiltro, setOrdenFiltro] = useState("categoria");
  const [productos, setProductos] = useState(() => leerStorage(STORAGE_CATALOGO_PRODUCTOS, PRODUCTOS_INICIALES));
  const [insumos, setInsumos] = useState(() => leerStorage(STORAGE_CATALOGO_INSUMOS, INSUMOS_INICIALES));
  const [editandoId, setEditandoId] = useState("");
  const [form, setForm] = useState({ linea: "Restaurante", categoria: "", nombre: "", precio: "" });
  const [mensaje, setMensaje] = useState("");
  const [cargandoInsumos, setCargandoInsumos] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [fuenteInsumos, setFuenteInsumos] = useState("local");
  const [fuenteProductos, setFuenteProductos] = useState("local");
  const [guardando, setGuardando] = useState(false);

  const esGastos = tipo === "gastos";
  const esInsumos = tipo === "insumos";
  const esProductosRestaurante = tipo === "productos_restaurante";
  const esProductosCafeteria = tipo === "productos_cafeteria";
  const esProductos = esProductosRestaurante || esProductosCafeteria;
  const lineaTipo = esProductosRestaurante ? "Restaurante" : esProductosCafeteria ? "Cafetería" : "";

  const productosRestaurante = useMemo(() => productos.filter((item) => item.linea === "Restaurante"), [productos]);
  const productosCafeteria = useMemo(() => productos.filter((item) => item.linea === "Cafetería"), [productos]);
  const listaActual = esGastos ? [] : esProductosRestaurante ? productosRestaurante : esProductosCafeteria ? productosCafeteria : insumos;
  const categoriasProducto = useMemo(() => [...new Set(listaActual.map((item) => item.categoria).filter(Boolean))].sort(), [listaActual]);
  const categoriasInsumo = useMemo(() => [...new Set([...categoriasSolicitudProductos, ...insumos.map((item) => item.categoria).filter(Boolean)])].sort(), [insumos]);
  const categoriasActuales = esProductos ? categoriasProducto : categoriasInsumo;

  const resumenCatalogo = useMemo(() => {
    const activos = listaActual.filter((item) => item.activo !== false).length;
    const inactivos = listaActual.filter((item) => item.activo === false).length;
    const agotados = esProductos ? listaActual.filter((item) => item.agotado).length : 0;
    return { activos, inactivos, agotados, total: listaActual.length };
  }, [esProductos, listaActual]);

  const listaFiltrada = useMemo(() => {
    const terminos = busqueda
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const filtrados = listaActual.filter((item) => {
      const texto = [item.linea, item.categoria, item.nombre, item.proveedor, item.unidadBase]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda = terminos.length === 0 || terminos.every((termino) => texto.includes(termino));
      const coincideCategoria = categoriaFiltro === "todas" || item.categoria === categoriaFiltro;
      const coincideEstado =
        estadoFiltro === "todos" ||
        (estadoFiltro === "activos" && item.activo !== false && !item.agotado) ||
        (estadoFiltro === "inactivos" && item.activo === false) ||
        (estadoFiltro === "agotados" && Boolean(item.agotado));

      return coincideBusqueda && coincideCategoria && coincideEstado;
    });

    return [...filtrados].sort((a, b) => {
      if (ordenFiltro === "nombre") return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
      if (ordenFiltro === "precio") return Number(b.precio || 0) - Number(a.precio || 0);
      if (ordenFiltro === "estado") return Number(a.activo === false) - Number(b.activo === false) || Number(b.agotado || 0) - Number(a.agotado || 0);
      return String(a.categoria || "").localeCompare(String(b.categoria || ""), "es") || Number(a.orden || 0) - Number(b.orden || 0) || String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
    });
  }, [busqueda, categoriaFiltro, estadoFiltro, listaActual, ordenFiltro]);

  const filtrosActivos = Boolean(busqueda.trim()) || categoriaFiltro !== "todas" || estadoFiltro !== "todos" || ordenFiltro !== "categoria";

  function limpiarFiltrosCatalogo() {
    setBusqueda("");
    setCategoriaFiltro("todas");
    setEstadoFiltro("todos");
    setOrdenFiltro("categoria");
  }

  useEffect(() => {
    let activo = true;

    async function cargarProductosDesdeSupabase() {
      if (!supabaseConfigOk) {
        setFuenteProductos("local");
        return;
      }

      setCargandoProductos(true);
      const resultado = await cargarCatalogoProductosAdmin();
      if (!activo) return;

      if (resultado.ok && resultado.productos.length > 0) {
        setProductos(resultado.productos);
        guardarStorage(STORAGE_CATALOGO_PRODUCTOS, resultado.productos);
        setFuenteProductos("bd");
      } else {
        setFuenteProductos("local");
        if (resultado.mensaje) {
          setMensaje(`No se pudo cargar productos desde Supabase. Se mantiene respaldo local. Detalle: ${resultado.mensaje}`);
        }
      }

      setCargandoProductos(false);
    }

    async function cargarInsumosDesdeSupabase() {
      if (!supabaseConfigOk) {
        setFuenteInsumos("local");
        setMensaje(`Catálogo usando respaldo local: ${supabaseConfigMensaje}`);
        return;
      }

      setCargandoInsumos(true);
      const resultado = await cargarCatalogoInsumosAdmin();
      if (!activo) return;

      if (resultado.ok && resultado.insumos.length > 0) {
        setInsumos(resultado.insumos);
        guardarStorage(STORAGE_CATALOGO_INSUMOS, resultado.insumos);
        setFuenteInsumos("bd");
      } else {
        setFuenteInsumos("local");
        if (resultado.mensaje) {
          setMensaje(`No se pudo cargar insumos desde Supabase. Se mantiene respaldo local. Detalle: ${resultado.mensaje}`);
        }
      }

      setCargandoInsumos(false);
    }

    cargarProductosDesdeSupabase();
    cargarInsumosDesdeSupabase();

    return () => {
      activo = false;
    };
  }, []);

  function reiniciarFormulario(nuevoTipo = tipo) {
    setEditandoId("");
    const esNuevoProductos = nuevoTipo === "productos_restaurante" || nuevoTipo === "productos_cafeteria";
    const linea = nuevoTipo === "productos_restaurante" ? "Restaurante" : nuevoTipo === "productos_cafeteria" ? "Cafetería" : "";
    setForm({ linea, categoria: esNuevoProductos ? "" : CATEGORIA_SOLICITUD_DEFECTO_FALLBACK, nombre: "", precio: "", unidadBase: "und", proveedor: "" });
  }

  function cambiarTipo(nuevoTipo) {
    setTipo(nuevoTipo);
    setBusqueda("");
    setCategoriaFiltro("todas");
    setEstadoFiltro("todos");
    setOrdenFiltro("categoria");
    setMensaje("");
    setEditandoId("");
    const esNuevoProductos = nuevoTipo === "productos_restaurante" || nuevoTipo === "productos_cafeteria";
    const linea = nuevoTipo === "productos_restaurante" ? "Restaurante" : nuevoTipo === "productos_cafeteria" ? "Cafetería" : "";
    setForm({ linea, categoria: esNuevoProductos ? "" : CATEGORIA_SOLICITUD_DEFECTO_FALLBACK, nombre: "", precio: "", unidadBase: "und", proveedor: "" });
  }

  async function guardar(e) {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const categoria = form.categoria.trim();
    if (!nombre || !categoria) {
      setMensaje("Completa nombre y categoría antes de guardar.");
      return;
    }

    if (esProductos) {
      setGuardando(true);
      const ordenSiguienteProducto = Math.max(0, ...productos.map((item) => Number(item.orden || 0))) + 1;

      try {
        if (!supabaseConfigOk) throw new Error(supabaseConfigMensaje);

        let productoGuardado;
        if (editandoId) {
          const actual = productos.find((item) => item.id === editandoId);
          if (!actual?.catalogoId && actual?.origenCatalogo !== "bd") {
            throw new Error("Este producto existe solo en el respaldo local. Vuelve a cargar Supabase antes de editarlo en BD.");
          }
          productoGuardado = await actualizarProductoCatalogoAdmin(actual.catalogoId || actual.id, {
            linea: lineaTipo || form.linea || "Cafetería",
            categoria,
            nombre,
            precio: form.precio
          });
        } else {
          productoGuardado = await crearProductoCatalogoAdmin({
            linea: lineaTipo || form.linea || "Cafetería",
            categoria,
            nombre,
            precio: form.precio,
            orden: ordenSiguienteProducto
          });
        }

        const actualizados = editandoId
          ? productos.map((item) => item.id === editandoId ? { ...item, ...productoGuardado, activo: item.activo } : item)
          : [productoGuardado, ...productos];
        setProductos(actualizados);
        guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
        setFuenteProductos("bd");
        setMensaje(editandoId ? "Producto actualizado en Supabase." : "Producto creado en Supabase.");
        reiniciarFormulario();
      } catch (error) {
        const nuevoLocal = {
          id: editandoId || `${Date.now()}-${normalizarId(nombre)}`,
          catalogoId: null,
          linea: lineaTipo || form.linea || "Cafetería",
          categoria,
          nombre,
          precio: form.precio === "" ? "" : Number(form.precio),
          activo: true,
          agotado: false,
          orden: ordenSiguienteProducto,
          origenCatalogo: "local"
        };
        const actualizados = editandoId
          ? productos.map((item) => item.id === editandoId ? { ...item, ...nuevoLocal, id: item.id, activo: item.activo } : item)
          : [nuevoLocal, ...productos];
        setProductos(actualizados);
        guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
        setFuenteProductos("local");
        setMensaje(`No se pudo guardar producto en Supabase. Cambio guardado como respaldo local. Detalle: ${error?.message || "error desconocido"}`);
        reiniciarFormulario();
      } finally {
        setGuardando(false);
      }
      return;
    }

    setGuardando(true);
    const ordenSiguiente = Math.max(0, ...insumos.map((item) => Number(item.orden || 0))) + 1;

    try {
      if (!supabaseConfigOk) throw new Error(supabaseConfigMensaje);

      let insumoGuardado;
      if (editandoId) {
        const actual = insumos.find((item) => item.id === editandoId);
        if (!actual?.catalogoId && actual?.origenCatalogo !== "bd") {
          throw new Error("Este insumo existe solo en el respaldo local. Vuelve a cargar Supabase antes de editarlo en BD.");
        }
        insumoGuardado = await actualizarInsumoCatalogoAdmin(actual.catalogoId || actual.id, {
          categoria,
          nombre,
          unidadBase: form.unidadBase || "und",
          proveedor: form.proveedor || ""
        });
      } else {
        insumoGuardado = await crearInsumoCatalogoAdmin({
          categoria,
          nombre,
          unidadBase: form.unidadBase || "und",
          proveedor: form.proveedor || "",
          orden: ordenSiguiente
        });
      }

      const actualizados = editandoId
        ? insumos.map((item) => item.id === editandoId ? { ...item, ...insumoGuardado, activo: item.activo } : item)
        : [insumoGuardado, ...insumos];
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
      setFuenteInsumos("bd");
      setMensaje(editandoId ? "Insumo actualizado en Supabase." : "Insumo creado en Supabase.");
      reiniciarFormulario();
    } catch (error) {
      const nuevoLocal = {
        id: editandoId || `${Date.now()}-${normalizarId(nombre)}`,
        catalogoId: null,
        categoria,
        nombre,
        unidadBase: form.unidadBase || "und",
        proveedor: form.proveedor || "",
        activo: true,
        orden: ordenSiguiente,
        origenCatalogo: "local"
      };
      const actualizados = editandoId
        ? insumos.map((item) => item.id === editandoId ? { ...item, ...nuevoLocal, id: item.id, activo: item.activo } : item)
        : [nuevoLocal, ...insumos];
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
      setFuenteInsumos("local");
      setMensaje(`No se pudo guardar en Supabase. Cambio guardado como respaldo local. Detalle: ${error?.message || "error desconocido"}`);
      reiniciarFormulario();
    } finally {
      setGuardando(false);
    }
  }

  function editar(item) {
    setEditandoId(item.id);
    setForm({ linea: item.linea || "Cafetería", categoria: item.categoria || "", nombre: item.nombre || "", precio: item.precio || "", unidadBase: item.unidadBase || "und", proveedor: item.proveedor || "" });
    setMensaje("");
  }

  async function eliminar(id) {
    const confirmar = window.confirm(tipo === "insumos" ? "¿Ocultar este insumo en el catálogo de Supabase?" : "¿Eliminar este registro del catálogo local?");
    if (!confirmar) return;
    if (esProductos) {
      const actual = productos.find((item) => item.id === id);
      try {
        if (!supabaseConfigOk) throw new Error(supabaseConfigMensaje);
        if (!actual?.catalogoId && actual?.origenCatalogo !== "bd") throw new Error("Este producto solo existe en el respaldo local.");
        const productoActualizado = await actualizarProductoCatalogoAdmin(actual.catalogoId || actual.id, { activo: false });
        const actualizados = productos.map((item) => item.id === id ? { ...item, ...productoActualizado, activo: false } : item);
        setProductos(actualizados);
        guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
        setMensaje("Producto ocultado en Supabase.");
      } catch (error) {
        const actualizados = productos.filter((item) => item.id !== id);
        setProductos(actualizados);
        guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
        setFuenteProductos("local");
        setMensaje(`No se pudo actualizar Supabase. Se eliminó solo del respaldo local. Detalle: ${error?.message || "error desconocido"}`);
      }
      return;
    }

    const actual = insumos.find((item) => item.id === id);
    try {
      if (!supabaseConfigOk) throw new Error(supabaseConfigMensaje);
      if (!actual?.catalogoId && actual?.origenCatalogo !== "bd") throw new Error("Este insumo solo existe en el respaldo local.");
      const insumoActualizado = await actualizarInsumoCatalogoAdmin(actual.catalogoId || actual.id, { activo: false });
      const actualizados = insumos.map((item) => item.id === id ? { ...item, ...insumoActualizado, activo: false } : item);
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
      setMensaje("Insumo ocultado en Supabase.");
    } catch (error) {
      const actualizados = insumos.filter((item) => item.id !== id);
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
      setFuenteInsumos("local");
      setMensaje(`No se pudo actualizar Supabase. Se eliminó solo del respaldo local. Detalle: ${error?.message || "error desconocido"}`);
    }
  }

  async function toggleActivo(id) {
    if (esProductos) {
      const actual = productos.find((item) => item.id === id);
      const nuevoActivoProducto = !actual?.activo;
      try {
        if (!supabaseConfigOk) throw new Error(supabaseConfigMensaje);
        if (!actual?.catalogoId && actual?.origenCatalogo !== "bd") throw new Error("Este producto solo existe en el respaldo local.");
        const productoActualizado = await actualizarProductoCatalogoAdmin(actual.catalogoId || actual.id, { activo: nuevoActivoProducto });
        const actualizados = productos.map((item) => item.id === id ? { ...item, ...productoActualizado, activo: nuevoActivoProducto } : item);
        setProductos(actualizados);
        guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
        setMensaje(nuevoActivoProducto ? "Producto activado en Supabase." : "Producto ocultado en Supabase.");
      } catch (error) {
        const actualizados = productos.map((item) => item.id === id ? { ...item, activo: nuevoActivoProducto } : item);
        setProductos(actualizados);
        guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
        setFuenteProductos("local");
        setMensaje(`Cambio aplicado solo en respaldo local. Detalle: ${error?.message || "error desconocido"}`);
      }
      return;
    }

    const actual = insumos.find((item) => item.id === id);
    const nuevoActivo = !actual?.activo;
    try {
      if (!supabaseConfigOk) throw new Error(supabaseConfigMensaje);
      if (!actual?.catalogoId && actual?.origenCatalogo !== "bd") throw new Error("Este insumo solo existe en el respaldo local.");
      const insumoActualizado = await actualizarInsumoCatalogoAdmin(actual.catalogoId || actual.id, { activo: nuevoActivo });
      const actualizados = insumos.map((item) => item.id === id ? { ...item, ...insumoActualizado, activo: nuevoActivo } : item);
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
      setMensaje(nuevoActivo ? "Insumo activado en Supabase." : "Insumo ocultado en Supabase.");
    } catch (error) {
      const actualizados = insumos.map((item) => item.id === id ? { ...item, activo: nuevoActivo } : item);
      setInsumos(actualizados);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, actualizados);
      setFuenteInsumos("local");
      setMensaje(`Cambio aplicado solo en respaldo local. Detalle: ${error?.message || "error desconocido"}`);
    }
  }

  async function toggleAgotado(id) {
    const actual = productos.find((item) => item.id === id);
    if (!actual) return;
    const nuevoAgotado = !actual.agotado;

    try {
      if (!supabaseConfigOk) throw new Error(supabaseConfigMensaje);
      if (!actual?.catalogoId && actual?.origenCatalogo !== "bd") throw new Error("Este producto solo existe en el respaldo local.");
      const productoActualizado = await actualizarProductoCatalogoAdmin(actual.catalogoId || actual.id, { agotado: nuevoAgotado });
      const actualizados = productos.map((item) => item.id === id ? { ...item, ...productoActualizado, agotado: nuevoAgotado } : item);
      setProductos(actualizados);
      guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
      setMensaje(nuevoAgotado ? "Producto marcado como agotado temporalmente." : "Producto marcado como disponible.");
    } catch (error) {
      const actualizados = productos.map((item) => item.id === id ? { ...item, agotado: nuevoAgotado } : item);
      setProductos(actualizados);
      guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
      setFuenteProductos("local");
      setMensaje(`Cambio aplicado solo en respaldo local. Para guardar agotados en Supabase agrega la columna agotado. Detalle: ${error?.message || "error desconocido"}`);
    }
  }

  async function precioRapido(id, valor) {
    const actual = productos.find((item) => item.id === id);
    if (!actual) return;
    const precio = valor === "" ? "" : Number(valor);
    const actualizadosRapidos = productos.map((item) => item.id === id ? { ...item, precio } : item);
    setProductos(actualizadosRapidos);
    guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizadosRapidos);

    try {
      if (!supabaseConfigOk) throw new Error(supabaseConfigMensaje);
      if (!actual?.catalogoId && actual?.origenCatalogo !== "bd") throw new Error("Este producto solo existe en el respaldo local.");
      const productoActualizado = await actualizarProductoCatalogoAdmin(actual.catalogoId || actual.id, { precio });
      const actualizados = actualizadosRapidos.map((item) => item.id === id ? { ...item, ...productoActualizado, precio } : item);
      setProductos(actualizados);
      guardarStorage(STORAGE_CATALOGO_PRODUCTOS, actualizados);
      setMensaje("Precio actualizado.");
    } catch (error) {
      setFuenteProductos("local");
      setMensaje(`Precio cambiado solo en respaldo local. Detalle: ${error?.message || "error desconocido"}`);
    }
  }


  function restaurarBase() {
    const confirmar = window.confirm("¿Restaurar el catálogo base? Esto reemplaza los cambios locales de esta sección.");
    if (!confirmar) return;
    setProductos(PRODUCTOS_INICIALES);
    guardarStorage(STORAGE_CATALOGO_PRODUCTOS, PRODUCTOS_INICIALES);
    if (fuenteInsumos !== "bd") {
      setInsumos(INSUMOS_INICIALES);
      guardarStorage(STORAGE_CATALOGO_INSUMOS, INSUMOS_INICIALES);
    }
    setFuenteProductos("local");
    setMensaje(fuenteInsumos === "bd" ? "Productos restaurados localmente. Los insumos siguen conectados a Supabase." : "Catálogo base restaurado localmente.");
    reiniciarFormulario();
  }

  return (
    <div className="soft-box catalogo-rafa" style={{ borderColor: "#bbf7d0", background: "linear-gradient(135deg, #f0fdf4, #ffffff)" }}>
      <style>{`.catalogo-rafa .badge-estado-negro { color: #111827 !important; }`}</style>
      <div className="admin-top-row">
        <h3>🧾 Catálogo Rafa</h3>
        <button type="button" className="button button-secondary" onClick={restaurarBase}>Restaurar base</button>
      </div>

      <div className="catalogo-selector-tarjetas" style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={() => cambiarTipo("gastos")}
          className={`catalogo-selector-card ${tipo === "gastos" ? "active" : ""}`}
          aria-pressed={tipo === "gastos"}
        >
          <span className="catalogo-selector-icono">💸</span>
          <span>
            <strong>Gastos</strong>
          </span>
        </button>
        <button
          type="button"
          onClick={() => cambiarTipo("productos_restaurante")}
          className={`catalogo-selector-card ${tipo === "productos_restaurante" ? "active" : ""}`}
          aria-pressed={tipo === "productos_restaurante"}
        >
          <span className="catalogo-selector-icono">🍽️</span>
          <span><strong>Productos Restaurante</strong></span>
        </button>
        <button
          type="button"
          onClick={() => cambiarTipo("productos_cafeteria")}
          className={`catalogo-selector-card ${tipo === "productos_cafeteria" ? "active" : ""}`}
          aria-pressed={tipo === "productos_cafeteria"}
        >
          <span className="catalogo-selector-icono">☕</span>
          <span><strong>Productos Cafetería</strong></span>
        </button>
        <button
          type="button"
          onClick={() => cambiarTipo("insumos")}
          className={`catalogo-selector-card ${tipo === "insumos" ? "active" : ""}`}
          aria-pressed={tipo === "insumos"}
        >
          <span className="catalogo-selector-icono">📦</span>
          <span><strong>Insumos</strong><small style={{ display: "block" }}>Base de Solicitud e Inventario</small></span>
        </button>
      </div>

      {tipo === "gastos" ? (
        <CatalogoGastos />
      ) : (
        <>
      {esInsumos && (
        <div className="alert alert-info" style={{ marginTop: 12 }}>
          Este listado es el mismo catálogo base que usa <strong>Solicitud de insumos</strong>. Desde aquí también quedará como base para Inventario en la Fase 24.
        </div>
      )}

      <div className="catalogo-resumen-mini" style={{ marginTop: 12 }}>
        <span><strong>{resumenCatalogo.total}</strong> registros</span>
        <span><strong>{resumenCatalogo.activos}</strong> activos</span>
        <span><strong>{resumenCatalogo.inactivos}</strong> inactivos</span>
        {esProductos && <span><strong>{resumenCatalogo.agotados}</strong> agotados</span>}
      </div>

      <div className="catalogo-filtros-avanzados" style={{ marginTop: 12 }}>
        <label className="field catalogo-busqueda-field">
          <span>🔎 Buscar en catálogo</span>
          <input type="search" placeholder="Ej: pechuga asada, sopa arroz, parfait" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="catalogo-busqueda" />
        </label>
        <label className="field-label">
          Categoría
          <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
            <option value="todas">Todas</option>
            {categoriasActuales.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </label>
        <label className="field-label">
          Estado
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="activos">Activos disponibles</option>
            <option value="inactivos">Inactivos</option>
            {esProductos && <option value="agotados">Agotados</option>}
          </select>
        </label>
        <label className="field-label">
          Ordenar por
          <select value={ordenFiltro} onChange={(e) => setOrdenFiltro(e.target.value)}>
            <option value="categoria">Categoría / orden</option>
            <option value="nombre">Nombre</option>
            {esProductos && <option value="precio">Precio mayor a menor</option>}
            <option value="estado">Estado</option>
          </select>
        </label>
        <button type="button" className="button button-secondary catalogo-limpiar-filtros" onClick={limpiarFiltrosCatalogo} disabled={!filtrosActivos}>
          Limpiar filtros
        </button>
      </div>


      <form onSubmit={guardar} className="soft-box" style={{ marginTop: 14, background: "#fff" }}>
        <h4>{editandoId ? "Editar registro" : `Agregar ${esProductos ? "producto" : "insumo"}`}</h4>
        <div className="grid-2" style={{ marginTop: 10 }}>
          {esProductos && (
            <label className="field-label">
              Línea
              <input value={lineaTipo} readOnly />
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
          {!esProductos && (
            <>
              <label className="field-label">
                Unidad base
                <input value={form.unidadBase || "und"} onChange={(e) => setForm((prev) => ({ ...prev, unidadBase: e.target.value }))} placeholder="und, kg, g, lt" />
              </label>
              <label className="field-label">
                Proveedor
                <input value={form.proveedor || ""} onChange={(e) => setForm((prev) => ({ ...prev, proveedor: e.target.value }))} placeholder="Opcional" />
              </label>
            </>
          )}
          {esProductos && (
            <label className="field-label">
              Precio
              <input type="number" min="0" step="100" value={form.precio} onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))} placeholder="Opcional" />
            </label>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button type="submit" className="button" disabled={guardando}>{guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Agregar"}</button>
          {editandoId && <button type="button" className="button button-secondary" onClick={() => reiniciarFormulario()}>Cancelar edición</button>}
        </div>
      </form>

      {mensaje && <div className="alert alert-info" style={{ marginTop: 12 }}>{mensaje}</div>}
      <CatalogoTabla
        items={listaFiltrada}
        tipo={esProductos ? "productos" : "insumos"}
        onEditar={editar}
        onEliminar={eliminar}
        onToggleActivo={toggleActivo}
        onToggleAgotado={toggleAgotado}
        onPrecioRapido={precioRapido}
      />
        </>
      )}
    </div>
  );
}
