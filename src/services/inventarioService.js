import { supabase } from "../supabaseClient";

const SELECT_INSUMOS = "id, nombre, categoria, unidad, stock_actual, stock_minimo, costo_promedio, activo, creado_en, actualizado_en";
const SELECT_MOVIMIENTOS = "id, insumo_id, tipo, cantidad, motivo, fecha, usuario, creado_en";

export const CATEGORIAS_INVENTARIO = ["Carnes", "Verduras", "Granos", "Lácteos", "Frutas", "Bebidas", "Desechables", "Aseo", "Otros"];
export const UNIDADES_INVENTARIO = ["kg", "g", "lb", "unidad", "paquete", "litro", "ml", "bolsa", "caja"];
export const TIPOS_MOVIMIENTO_INVENTARIO = ["entrada", "salida", "ajuste", "merma"];

export function obtenerFechaInventarioHoy() {
  const fecha = new Date();
  const offsetMs = -5 * 60 * 60 * 1000;
  return new Date(fecha.getTime() + offsetMs).toISOString().slice(0, 10);
}

export function normalizarInsumoInventario(item) {
  if (!item) return null;
  return {
    id: item.id,
    nombre: item.nombre || "",
    categoria: item.categoria || "Otros",
    unidad: item.unidad || "unidad",
    stockActual: Number(item.stock_actual || 0),
    stockMinimo: Number(item.stock_minimo || 0),
    costoPromedio: Number(item.costo_promedio || 0),
    activo: item.activo !== false,
    creadoEn: item.creado_en || "",
    actualizadoEn: item.actualizado_en || ""
  };
}

function prepararPayloadInsumo(insumo) {
  return {
    nombre: String(insumo.nombre || "").trim(),
    categoria: String(insumo.categoria || "Otros").trim() || "Otros",
    unidad: String(insumo.unidad || "unidad").trim() || "unidad",
    stock_actual: Number(insumo.stockActual || 0),
    stock_minimo: Number(insumo.stockMinimo || 0),
    costo_promedio: Number(insumo.costoPromedio || 0),
    activo: insumo.activo !== false,
    actualizado_en: new Date().toISOString()
  };
}

export async function cargarInventarioInsumos({ incluirInactivos = false } = {}) {
  let consulta = supabase.from("inventario_insumos").select(SELECT_INSUMOS).order("categoria", { ascending: true }).order("nombre", { ascending: true });
  if (!incluirInactivos) consulta = consulta.eq("activo", true);
  const { data, error } = await consulta;
  if (error) throw error;
  return (data || []).map(normalizarInsumoInventario).filter(Boolean);
}

export async function guardarInventarioInsumo(insumo) {
  const payload = prepararPayloadInsumo(insumo);
  if (!payload.nombre) throw new Error("El nombre del insumo es obligatorio.");
  if (!Number.isFinite(payload.stock_actual)) throw new Error("El stock actual no es válido.");

  if (insumo.id) {
    const { data, error } = await supabase.from("inventario_insumos").update(payload).eq("id", insumo.id).select(SELECT_INSUMOS).single();
    if (error) throw error;
    return normalizarInsumoInventario(data);
  }

  const { data, error } = await supabase.from("inventario_insumos").insert(payload).select(SELECT_INSUMOS).single();
  if (error) throw error;
  return normalizarInsumoInventario(data);
}

export async function registrarMovimientoInventario({ insumoId, tipo, cantidad, motivo, usuario }) {
  const payload = {
    insumo_id: insumoId,
    tipo,
    cantidad: Number(cantidad || 0),
    motivo: String(motivo || "").trim() || null,
    fecha: obtenerFechaInventarioHoy(),
    usuario: String(usuario || "").trim() || null
  };
  if (!payload.insumo_id) throw new Error("Selecciona un insumo.");
  if (!TIPOS_MOVIMIENTO_INVENTARIO.includes(payload.tipo)) throw new Error("Tipo de movimiento no válido.");
  if (!Number.isFinite(payload.cantidad) || payload.cantidad <= 0) throw new Error("La cantidad debe ser mayor a cero.");

  const { data, error } = await supabase.rpc("registrar_movimiento_inventario", payload).select?.(SELECT_MOVIMIENTOS);
  if (error) throw error;
  return data;
}

export async function registrarEntradaInventarioDesdeGasto({ gastoId, insumoId, cantidad, motivo, fecha, usuario }) {
  const payload = {
    gasto_id: gastoId || null,
    insumo_id: insumoId,
    cantidad: Number(cantidad || 0),
    motivo: String(motivo || "Compra registrada desde Gastos").trim() || "Compra registrada desde Gastos",
    fecha: fecha || obtenerFechaInventarioHoy(),
    usuario: String(usuario || "Gastos").trim() || "Gastos"
  };

  if (!payload.insumo_id) throw new Error("Selecciona un insumo para actualizar inventario.");
  if (!Number.isFinite(payload.cantidad) || payload.cantidad <= 0) throw new Error("La cantidad de inventario debe ser mayor a cero.");

  const { data, error } = await supabase
    .rpc("registrar_entrada_inventario_desde_gasto", payload);

  if (error) throw error;
  return data;
}

function normalizarUnidadDesdeCatalogo(unidadBase) {
  const unidad = String(unidadBase || "unidad").trim().toLowerCase();
  if (["kg", "kilo", "kilos"].includes(unidad)) return "kg";
  if (["g", "gr", "gramo", "gramos"].includes(unidad)) return "g";
  if (["lt", "l", "litro", "litros"].includes(unidad)) return "litro";
  if (["ml", "mililitro", "mililitros"].includes(unidad)) return "ml";
  if (["und", "unidad", "unidades"].includes(unidad)) return "unidad";
  if (UNIDADES_INVENTARIO.includes(unidad)) return unidad;
  return "unidad";
}

export async function sincronizarInventarioDesdeCatalogoInsumos(insumosInventarioActuales = []) {
  const existentes = new Set(
    (insumosInventarioActuales || [])
      .map((item) => String(item?.nombre || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const { data, error } = await supabase
    .from("catalogo_insumos")
    .select("categoria, nombre, unidad_base, activo, orden")
    .eq("activo", true)
    .order("categoria", { ascending: true })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw error;

  const nuevos = (data || [])
    .filter((item) => {
      const nombre = String(item?.nombre || "").trim();
      return nombre && !existentes.has(nombre.toLowerCase());
    })
    .map((item) => ({
      nombre: String(item.nombre || "").trim(),
      categoria: String(item.categoria || "Otros").trim() || "Otros",
      unidad: normalizarUnidadDesdeCatalogo(item.unidad_base),
      stock_actual: 0,
      stock_minimo: 0,
      costo_promedio: 0,
      activo: true,
      actualizado_en: new Date().toISOString()
    }));

  if (!nuevos.length) return [];

  const { data: insertados, error: insertError } = await supabase
    .from("inventario_insumos")
    .insert(nuevos)
    .select(SELECT_INSUMOS);

  if (insertError) throw insertError;
  return (insertados || []).map(normalizarInsumoInventario).filter(Boolean);
}


function textoNormalizadoInventario(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function nombreItemPedido(item) {
  return item?.producto || item?.plato || item?.proteina || item?.nombre || "Producto";
}

function cantidadItemPedido(item) {
  const cantidad = Number(item?.cantidad || 1);
  return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
}

function pedidoOItemParaLlevar(pedido, item) {
  const textoMesa = textoNormalizadoInventario(pedido?.mesa || pedido?.ubicacion || pedido?.tipo_pedido);
  return Boolean(item?.paraLlevar) || textoMesa.includes("llevar") || textoNormalizadoInventario(pedido?.tipo_pedido) === "llevar";
}

function agregarSalida(mapa, insumoNombre, cantidad, reglaCodigo, descripcion) {
  const clave = String(insumoNombre || "").trim();
  if (!clave || !Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) return;
  const codigo = String(reglaCodigo || clave).trim();
  const actual = mapa.get(codigo) || { insumoNombre: clave, cantidad: 0, reglaCodigo: codigo, descripcion: descripcion || clave };
  actual.cantidad += Number(cantidad);
  mapa.set(codigo, actual);
}

function clasificarEmpaqueParaLlevar(item) {
  const nombre = textoNormalizadoInventario(nombreItemPedido(item));
  const categoria = textoNormalizadoInventario(item?.categoria || item?.tipo);
  const tipo = textoNormalizadoInventario(item?.tipo);
  const tamano = textoNormalizadoInventario(item?.tamano || nombre);

  if (nombre.includes("sandwich") || nombre.includes("sanduche") || tipo.includes("sandwich") || tipo.includes("sanduche")) {
    return "sandwich";
  }
  if (nombre.includes("sancocho")) return "sancocho";
  if (categoria.includes("sopa") || nombre.includes("sopa") || nombre.includes("mondongo") || nombre.includes("ajiaco")) return "sopa";
  if (nombre.includes("pasta") || categoria.includes("pasta")) return "pasta";
  if (nombre.includes("arroz") || categoria.includes("arroz")) return "arroz";
  if (tipo.includes("batido") || tipo.includes("jugo") || nombre.includes("batido") || nombre.includes("jugo")) {
    if (tamano.includes("22")) return "bebida_22";
    if (tamano.includes("16")) return "bebida_16";
    return "bebida_12";
  }
  if (tipo.includes("parfait") || nombre.includes("parfait")) {
    if (tamano.includes("22")) return "parfait_22";
    if (tamano.includes("16")) return "parfait_16";
    return "parfait_12";
  }
  return "almuerzo_estandar";
}

export function calcularSalidasInventarioPedido(pedido) {
  const mapa = new Map();
  const items = Array.isArray(pedido?.items) ? pedido.items : [];

  items.forEach((item) => {
    const cantidad = cantidadItemPedido(item);
    const nombreNormalizado = textoNormalizadoInventario(nombreItemPedido(item));
    const tipoNormalizado = textoNormalizadoInventario(item?.tipo);

    // Receta sencilla inicial: Sándwich jamón y queso.
    // Se maneja en unidades para evitar entrar todavía a gramos o costos complejos.
    if (nombreNormalizado.includes("sandwich") || nombreNormalizado.includes("sanduche") || tipoNormalizado.includes("sandwich") || tipoNormalizado.includes("sanduche")) {
      agregarSalida(mapa, "Pan", cantidad, "sandwich_pan", "Sándwich: pan");
      agregarSalida(mapa, "Jamón", cantidad, "sandwich_jamon", "Sándwich: jamón");
      agregarSalida(mapa, "Queso mozzarella", cantidad, "sandwich_queso", "Sándwich: queso");
      agregarSalida(mapa, "Mantequilla", cantidad, "sandwich_mantequilla", "Sándwich: mantequilla");
      agregarSalida(mapa, "Servilletas", cantidad, "sandwich_servilletas", "Sándwich: servilletas");
    }

    if (!pedidoOItemParaLlevar(pedido, item)) return;

    const grupoEmpaque = clasificarEmpaqueParaLlevar(item);

    if (grupoEmpaque === "sandwich") {
      agregarSalida(mapa, "Papel para sándwich", cantidad, "empaque_sandwich_papel", "Para llevar sándwich: papel");
      agregarSalida(mapa, "Bolsas plásticas 2K", cantidad, "empaque_sandwich_bolsa", "Para llevar sándwich: bolsa");
      return;
    }

    if (grupoEmpaque === "pasta") {
      agregarSalida(mapa, "Contenedor C1", cantidad, "empaque_pasta", "Para llevar pasta: contenedor");
      agregarSalida(mapa, "Bolsas plásticas 2K", cantidad, "empaque_pasta_bolsa", "Para llevar pasta: bolsa");
      return;
    }

    if (grupoEmpaque === "arroz") {
      agregarSalida(mapa, "Contenedor J1 dorado", cantidad, "empaque_arroz", "Para llevar arroz: contenedor");
      agregarSalida(mapa, "Bolsas plásticas 2K", cantidad, "empaque_arroz_bolsa", "Para llevar arroz: bolsa");
      return;
    }

    if (grupoEmpaque === "sancocho") {
      agregarSalida(mapa, "Sopero 32 oz", cantidad, "empaque_sancocho", "Para llevar sancocho: sopero");
      agregarSalida(mapa, "Bolsas plásticas 10K", cantidad, "empaque_sancocho_bolsa", "Para llevar sancocho: bolsa");
      return;
    }

    if (grupoEmpaque === "sopa") {
      agregarSalida(mapa, "Sopero 24 oz", cantidad, "empaque_sopa", "Para llevar sopa: sopero");
      agregarSalida(mapa, "Bolsas plásticas 2K", cantidad, "empaque_sopa_bolsa", "Para llevar sopa: bolsa");
      return;
    }

    if (grupoEmpaque === "bebida_22") {
      agregarSalida(mapa, "Vasos Gold Carvajal 22 oz", cantidad, "empaque_bebida_22_vaso", "Para llevar bebida 22 oz: vaso");
      agregarSalida(mapa, "Tapas Darnel domo", cantidad, "empaque_bebida_22_tapa", "Para llevar bebida 22 oz: tapa");
      agregarSalida(mapa, "Pitillos batido 7 mm", cantidad, "empaque_bebida_pitillo", "Para llevar bebida: pitillo");
      return;
    }

    if (grupoEmpaque === "bebida_16") {
      agregarSalida(mapa, "Vasos Darnel 16 oz", cantidad, "empaque_bebida_16_vaso", "Para llevar bebida 16 oz: vaso");
      agregarSalida(mapa, "Tapa Darnel plana", cantidad, "empaque_bebida_16_tapa", "Para llevar bebida 16 oz: tapa");
      agregarSalida(mapa, "Pitillos batido 7 mm", cantidad, "empaque_bebida_pitillo", "Para llevar bebida: pitillo");
      return;
    }

    if (grupoEmpaque === "bebida_12") {
      agregarSalida(mapa, "Vasos Darnel 12 oz", cantidad, "empaque_bebida_12_vaso", "Para llevar bebida 12 oz: vaso");
      agregarSalida(mapa, "Tapa Darnel plana", cantidad, "empaque_bebida_12_tapa", "Para llevar bebida 12 oz: tapa");
      agregarSalida(mapa, "Pitillos batido 7 mm", cantidad, "empaque_bebida_pitillo", "Para llevar bebida: pitillo");
      return;
    }

    // Proteínas y platos corrientes para llevar: empaque estándar.
    agregarSalida(mapa, "Contenedor 3 divisiones negro", cantidad, "empaque_almuerzo_estandar", "Para llevar almuerzo estándar");
    agregarSalida(mapa, "Bolsas plásticas 2K", cantidad, "empaque_almuerzo_bolsa", "Para llevar almuerzo: bolsa");
  });

  return Array.from(mapa.values()).filter((item) => item.cantidad > 0);
}

export async function registrarDescuentoInventarioPedido(pedido, { usuario = "Pedidos Rafiki" } = {}) {
  const salidas = calcularSalidasInventarioPedido(pedido);
  if (!pedido?.id || salidas.length === 0) {
    return { total: 0, aplicadas: [], omitidas: [], salidas };
  }

  const resultados = [];

  for (const salida of salidas) {
    const { data, error } = await supabase.rpc("registrar_salida_inventario_pedido", {
      pedido_id: pedido.id,
      insumo_nombre: salida.insumoNombre,
      cantidad: salida.cantidad,
      regla_codigo: salida.reglaCodigo,
      motivo: `Salida automática por pedido #${pedido.numero_pedido || pedido.id}: ${salida.descripcion}`,
      usuario
    });

    if (error) throw error;
    resultados.push(data);
  }

  return {
    total: resultados.filter((item) => item?.estado === "registrado").length,
    aplicadas: resultados.filter((item) => item?.estado === "registrado"),
    omitidas: resultados.filter((item) => item?.estado !== "registrado"),
    salidas
  };
}

export function calcularResumenInventario(insumos = []) {
  const activos = insumos.filter((item) => item.activo !== false);
  const stockBajo = activos.filter((item) => item.stockActual <= item.stockMinimo);
  const agotados = activos.filter((item) => item.stockActual <= 0);
  const valorEstimado = activos.reduce((total, item) => total + item.stockActual * item.costoPromedio, 0);
  return { totalInsumos: activos.length, stockBajo: stockBajo.length, agotados: agotados.length, valorEstimado };
}
