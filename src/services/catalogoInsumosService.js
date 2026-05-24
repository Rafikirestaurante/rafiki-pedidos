import { supabase } from "../supabaseClient";
import { generarId } from "../utils/pedidos";
import { ordenarProductosPorNombre } from "../utils/solicitudProductos";
import { productosRestauranteBase } from "../data/solicitudProductosData";

const FALLBACK_MOTIVO = "fallback_local";

function normalizarInsumoCatalogo(insumo, index = 0) {
  const nombre = String(insumo?.nombre || "").trim();
  if (!nombre) return null;

  return {
    id: insumo?.id ? `insumo-bd-${insumo.id}` : generarId("insumo-bd"),
    catalogoId: insumo?.id || null,
    categoria: String(insumo?.categoria || "Productos").trim() || "Productos",
    nombre,
    cantidad: "",
    unidad: String(insumo?.unidad_base || "und").trim() || "und",
    nota: "",
    seleccionada: false,
    orden: Number.isFinite(Number(insumo?.orden)) ? Number(insumo.orden) : index + 1,
    origenCatalogo: "bd"
  };
}

export function crearProductosSolicitudFallback() {
  return ordenarProductosPorNombre(productosRestauranteBase).map((producto) => ({
    id: generarId("insumo-base"),
    categoria: producto.categoria,
    nombre: producto.nombre,
    cantidad: "",
    unidad: "und",
    nota: "",
    seleccionada: false,
    origenCatalogo: "local"
  }));
}

export function reconciliarCatalogoConSolicitudActual(catalogo, productosActuales = []) {
  const estadoPorNombre = new Map(
    (productosActuales || []).map((producto) => [String(producto?.nombre || "").trim().toLowerCase(), producto])
  );

  const nombresCatalogo = new Set();
  const productosReconciliados = (catalogo || []).map((producto) => {
    const clave = String(producto?.nombre || "").trim().toLowerCase();
    nombresCatalogo.add(clave);
    const previo = estadoPorNombre.get(clave);

    return {
      ...producto,
      id: previo?.id || producto.id,
      cantidad: previo?.cantidad || "",
      unidad: previo?.unidad || producto.unidad || "und",
      nota: previo?.nota || "",
      seleccionada: Boolean(previo?.seleccionada)
    };
  });

  const productosTemporales = (productosActuales || [])
    .filter((producto) => {
      const clave = String(producto?.nombre || "").trim().toLowerCase();
      return clave && !nombresCatalogo.has(clave) && producto.seleccionada;
    })
    .map((producto) => ({
      ...producto,
      origenCatalogo: producto.origenCatalogo || "temporal"
    }));

  return [...productosReconciliados, ...productosTemporales];
}

export async function cargarCatalogoInsumosSolicitud() {
  try {
    const { data, error } = await supabase
      .from("catalogo_insumos")
      .select("id, categoria, nombre, unidad_base, activo, orden")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      return {
        ok: false,
        productos: crearProductosSolicitudFallback(),
        fuente: "local",
        motivo: FALLBACK_MOTIVO,
        mensaje: error.message
      };
    }

    const productos = (data || [])
      .map(normalizarInsumoCatalogo)
      .filter(Boolean);

    if (productos.length === 0) {
      return {
        ok: false,
        productos: crearProductosSolicitudFallback(),
        fuente: "local",
        motivo: FALLBACK_MOTIVO,
        mensaje: "La tabla catalogo_insumos no tiene insumos activos."
      };
    }

    return {
      ok: true,
      productos,
      fuente: "bd",
      motivo: "catalogo_bd",
      mensaje: `Catálogo cargado desde Supabase (${productos.length} insumos).`
    };
  } catch (error) {
    return {
      ok: false,
      productos: crearProductosSolicitudFallback(),
      fuente: "local",
      motivo: FALLBACK_MOTIVO,
      mensaje: error?.message || "No se pudo consultar el catálogo en Supabase."
    };
  }
}
