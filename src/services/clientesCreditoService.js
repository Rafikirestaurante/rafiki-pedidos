import { supabase, supabaseConfigOk } from "../supabaseClient";

function limpiarTexto(valor) {
  return String(valor || "").trim().replace(/\s+/g, " ");
}

function normalizarTelefono(valor) {
  return String(valor || "").trim();
}

function normalizarNumero(valor) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) ? numero : 0;
}

const CAMPOS_CLIENTE_CREDITO = "id,nombre,alias,telefono,observaciones,fecha_ultimo_pedido,total_pedidos,saldo_pendiente,activo,creado_en,actualizado_en";

export function normalizarNombreClienteCredito(nombre) {
  return limpiarTexto(nombre);
}

export async function listarClientesCreditoActivos() {
  if (!supabaseConfigOk) return [];

  const { data, error } = await supabase
    .from("clientes_credito")
    .select("id,nombre,alias,activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.warn("No se pudieron cargar clientes de crédito:", error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

export async function listarClientesCredito({ busqueda = "", incluirInactivos = true } = {}) {
  if (!supabaseConfigOk) return [];

  let consulta = supabase
    .from("clientes_credito")
    .select(CAMPOS_CLIENTE_CREDITO)
    .order("activo", { ascending: false })
    .order("nombre", { ascending: true });

  if (!incluirInactivos) consulta = consulta.eq("activo", true);

  const texto = limpiarTexto(busqueda);
  if (texto) {
    consulta = consulta.or(`nombre.ilike.%${texto}%,telefono.ilike.%${texto}%,observaciones.ilike.%${texto}%`);
  }

  const { data, error } = await consulta;

  if (error) {
    console.warn("No se pudo listar clientes de crédito:", error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

export async function buscarClientesCredito(busqueda) {
  return listarClientesCredito({ busqueda, incluirInactivos: true });
}

export async function obtenerClienteCredito(id) {
  if (!id || !supabaseConfigOk) return null;

  const { data, error } = await supabase
    .from("clientes_credito")
    .select(CAMPOS_CLIENTE_CREDITO)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn("No se pudo obtener cliente de crédito:", error.message);
    return null;
  }

  return data || null;
}

export async function crearClienteCredito({ nombre, telefono = "", observaciones = "", alias = [] } = {}) {
  const nombreLimpio = normalizarNombreClienteCredito(nombre);
  if (!nombreLimpio || !supabaseConfigOk) return null;

  const aliasLimpios = Array.isArray(alias)
    ? alias.map((item) => limpiarTexto(item)).filter(Boolean)
    : [];

  const { data, error } = await supabase
    .from("clientes_credito")
    .insert({
      nombre: nombreLimpio,
      telefono: normalizarTelefono(telefono),
      observaciones: limpiarTexto(observaciones),
      alias: aliasLimpios,
      activo: true,
      total_pedidos: 0,
      saldo_pendiente: 0,
    })
    .select(CAMPOS_CLIENTE_CREDITO)
    .single();

  if (error) {
    console.warn("No se pudo crear cliente de crédito:", error.message);
    throw error;
  }

  return data;
}

export async function editarClienteCredito(id, cambios = {}) {
  if (!id || !supabaseConfigOk) return null;

  const payload = {};
  if (Object.prototype.hasOwnProperty.call(cambios, "nombre")) payload.nombre = normalizarNombreClienteCredito(cambios.nombre);
  if (Object.prototype.hasOwnProperty.call(cambios, "telefono")) payload.telefono = normalizarTelefono(cambios.telefono);
  if (Object.prototype.hasOwnProperty.call(cambios, "observaciones")) payload.observaciones = limpiarTexto(cambios.observaciones);
  if (Object.prototype.hasOwnProperty.call(cambios, "activo")) payload.activo = Boolean(cambios.activo);
  if (Object.prototype.hasOwnProperty.call(cambios, "total_pedidos")) payload.total_pedidos = normalizarNumero(cambios.total_pedidos);
  if (Object.prototype.hasOwnProperty.call(cambios, "saldo_pendiente")) payload.saldo_pendiente = normalizarNumero(cambios.saldo_pendiente);
  if (Object.prototype.hasOwnProperty.call(cambios, "fecha_ultimo_pedido")) payload.fecha_ultimo_pedido = cambios.fecha_ultimo_pedido || null;

  if (!Object.keys(payload).length) return obtenerClienteCredito(id);

  const { data, error } = await supabase
    .from("clientes_credito")
    .update(payload)
    .eq("id", id)
    .select(CAMPOS_CLIENTE_CREDITO)
    .single();

  if (error) {
    console.warn("No se pudo editar cliente de crédito:", error.message);
    throw error;
  }

  return data;
}

export async function desactivarClienteCredito(id) {
  return editarClienteCredito(id, { activo: false });
}

export async function activarClienteCredito(id) {
  return editarClienteCredito(id, { activo: true });
}

export async function asegurarClienteCredito(nombre) {
  const nombreLimpio = normalizarNombreClienteCredito(nombre);
  if (!nombreLimpio || !supabaseConfigOk) return null;

  const { data: existente, error: errorBusqueda } = await supabase
    .from("clientes_credito")
    .select("id,nombre,alias,activo")
    .ilike("nombre", nombreLimpio)
    .maybeSingle();

  if (!errorBusqueda && existente?.id) return existente;

  const { data, error } = await supabase
    .from("clientes_credito")
    .insert({ nombre: nombreLimpio, activo: true, total_pedidos: 0, saldo_pendiente: 0 })
    .select("id,nombre,alias,activo")
    .single();

  if (error) {
    console.warn("No se pudo registrar cliente de crédito:", error.message);
    return null;
  }

  return data;
}
