import { supabase, supabaseConfigOk } from "../supabaseClient";
import { describirErrorSupabase } from "../shared/utils/supabaseErrors";

const CAMPOS_CLIENTE_ESPECIAL =
  "id,codigo,codigo_normalizado,nombre,telefono,ubicacion,cumple_mes,cumple_dia,origen_registro,activo,mensaje_bienvenida,sin_restriccion_acompanantes,habilita_cafeteria,permite_modificar_datos,reglas_json,observaciones,creado_en,actualizado_en";

function limpiarTexto(valor) {
  return String(valor || "").trim().replace(/\s+/g, " ");
}

export function normalizarCodigoClienteEspecial(codigo) {
  return String(codigo || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

export function normalizarTelefonoCliente(telefono) {
  let digitos = String(telefono || "").replace(/\D+/g, "");
  if (digitos.startsWith("57") && digitos.length === 12) digitos = digitos.slice(2);
  return digitos;
}

export function esCelularColombianoValido(telefono) {
  return /^3\d{9}$/.test(normalizarTelefonoCliente(telefono));
}

export function diasEnMesCumpleanos(mes) {
  const mesNumero = Number(mes);
  if (!Number.isInteger(mesNumero) || mesNumero < 1 || mesNumero > 12) return 31;
  return new Date(2000, mesNumero, 0).getDate();
}

export function cumpleanosClienteValido(mes, dia, { permitirVacio = true } = {}) {
  const mesNumero = mes === "" || mes == null ? null : Number(mes);
  const diaNumero = dia === "" || dia == null ? null : Number(dia);

  if (mesNumero == null && diaNumero == null) return permitirVacio;
  if (!Number.isInteger(mesNumero) || !Number.isInteger(diaNumero)) return false;
  if (mesNumero < 1 || mesNumero > 12 || diaNumero < 1) return false;
  return diaNumero <= diasEnMesCumpleanos(mesNumero);
}

function normalizarClienteEspecial(cliente = {}) {
  if (!cliente || typeof cliente !== "object") return null;
  const cumpleMes = Number(cliente.cumple_mes);
  const cumpleDia = Number(cliente.cumple_dia);

  return {
    ...cliente,
    codigo: String(cliente.codigo || "").trim().toUpperCase(),
    codigo_normalizado: normalizarCodigoClienteEspecial(cliente.codigo_normalizado || cliente.codigo),
    nombre: limpiarTexto(cliente.nombre),
    telefono: String(cliente.telefono || "").trim(),
    ubicacion: limpiarTexto(cliente.ubicacion),
    cumple_mes: Number.isInteger(cumpleMes) && cumpleMes >= 1 && cumpleMes <= 12 ? cumpleMes : null,
    cumple_dia: Number.isInteger(cumpleDia) && cumpleDia >= 1 && cumpleDia <= 31 ? cumpleDia : null,
    origen_registro: cliente.origen_registro === "cliente" ? "cliente" : "administracion",
    mensaje_bienvenida: limpiarTexto(cliente.mensaje_bienvenida) || (cliente.nombre ? `Bienvenido, ${limpiarTexto(cliente.nombre)}` : ""),
    sin_restriccion_acompanantes: cliente.sin_restriccion_acompanantes === true,
    habilita_cafeteria: cliente.habilita_cafeteria === true,
    permite_modificar_datos: cliente.permite_modificar_datos !== false,
    reglas_json: cliente.reglas_json && typeof cliente.reglas_json === "object" ? cliente.reglas_json : {},
    activo: cliente.activo !== false
  };
}

function crearPayloadClienteEspecial(cambios = {}) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(cambios, "codigo")) {
    payload.codigo = String(cambios.codigo || "").trim().toUpperCase();
    payload.codigo_normalizado = normalizarCodigoClienteEspecial(payload.codigo);
  }
  if (Object.prototype.hasOwnProperty.call(cambios, "nombre")) payload.nombre = limpiarTexto(cambios.nombre);
  if (Object.prototype.hasOwnProperty.call(cambios, "telefono")) payload.telefono = String(cambios.telefono || "").trim();
  if (Object.prototype.hasOwnProperty.call(cambios, "ubicacion")) payload.ubicacion = limpiarTexto(cambios.ubicacion);
  if (Object.prototype.hasOwnProperty.call(cambios, "cumple_mes")) payload.cumple_mes = cambios.cumple_mes ? Number(cambios.cumple_mes) : null;
  if (Object.prototype.hasOwnProperty.call(cambios, "cumple_dia")) payload.cumple_dia = cambios.cumple_dia ? Number(cambios.cumple_dia) : null;
  if (Object.prototype.hasOwnProperty.call(cambios, "origen_registro")) payload.origen_registro = cambios.origen_registro === "cliente" ? "cliente" : "administracion";
  if (Object.prototype.hasOwnProperty.call(cambios, "activo")) payload.activo = Boolean(cambios.activo);
  if (Object.prototype.hasOwnProperty.call(cambios, "mensaje_bienvenida")) payload.mensaje_bienvenida = limpiarTexto(cambios.mensaje_bienvenida);
  if (Object.prototype.hasOwnProperty.call(cambios, "sin_restriccion_acompanantes")) payload.sin_restriccion_acompanantes = Boolean(cambios.sin_restriccion_acompanantes);
  if (Object.prototype.hasOwnProperty.call(cambios, "habilita_cafeteria")) payload.habilita_cafeteria = Boolean(cambios.habilita_cafeteria);
  if (Object.prototype.hasOwnProperty.call(cambios, "permite_modificar_datos")) payload.permite_modificar_datos = Boolean(cambios.permite_modificar_datos);
  if (Object.prototype.hasOwnProperty.call(cambios, "reglas_json")) payload.reglas_json = cambios.reglas_json && typeof cambios.reglas_json === "object" ? cambios.reglas_json : {};
  if (Object.prototype.hasOwnProperty.call(cambios, "observaciones")) payload.observaciones = limpiarTexto(cambios.observaciones);

  return payload;
}

export async function validarCodigoClienteEspecial(codigo) {
  const codigoNormalizado = normalizarCodigoClienteEspecial(codigo);
  if (!codigoNormalizado || !supabaseConfigOk) return { ok: false, cliente: null, mensaje: "Código no válido." };

  try {
    const { data, error } = await supabase.rpc("validar_cliente_especial_codigo", {
      p_codigo: codigoNormalizado
    });

    if (error) {
      return {
        ok: false,
        cliente: null,
        mensaje: describirErrorSupabase(error, "validar el código de cliente")
      };
    }

    const cliente = normalizarClienteEspecial(data);
    if (!cliente?.id) return { ok: false, cliente: null, mensaje: "Código no encontrado o inactivo." };

    return { ok: true, cliente, mensaje: cliente.mensaje_bienvenida || `Bienvenido, ${cliente.nombre}` };
  } catch (error) {
    return {
      ok: false,
      cliente: null,
      mensaje: describirErrorSupabase(error, "validar el código de cliente")
    };
  }
}

export async function registrarClientePublico(datos = {}) {
  if (!supabaseConfigOk) {
    return { ok: false, cliente: null, mensaje: "No hay conexión disponible para completar el registro." };
  }

  const nombre = limpiarTexto(datos.nombre);
  const telefono = normalizarTelefonoCliente(datos.telefono);
  const ubicacion = limpiarTexto(datos.ubicacion);
  const cumpleMes = Number(datos.cumple_mes);
  const cumpleDia = Number(datos.cumple_dia);

  if (nombre.length < 2) return { ok: false, cliente: null, mensaje: "Ingresa tu nombre." };
  if (!esCelularColombianoValido(telefono)) {
    return { ok: false, cliente: null, mensaje: "Ingresa un celular colombiano válido de 10 dígitos." };
  }
  if (ubicacion.length < 3) return { ok: false, cliente: null, mensaje: "Ingresa tu ubicación habitual." };
  if (!cumpleanosClienteValido(cumpleMes, cumpleDia, { permitirVacio: false })) {
    return { ok: false, cliente: null, mensaje: "Selecciona un día y mes de cumpleaños válidos." };
  }

  try {
    const { data, error } = await supabase.rpc("registrar_cliente_publico", {
      p_nombre: nombre,
      p_telefono: telefono,
      p_ubicacion: ubicacion,
      p_cumple_mes: cumpleMes,
      p_cumple_dia: cumpleDia
    });

    if (error) {
      return {
        ok: false,
        cliente: null,
        mensaje: describirErrorSupabase(error, "registrar el cliente")
      };
    }

    const cliente = normalizarClienteEspecial(data?.cliente);
    return {
      ok: data?.ok === true && Boolean(cliente?.id),
      cliente,
      codigoExistente: data?.codigo_existente === true,
      mensaje: data?.mensaje || (cliente ? "Registro completado." : "No se pudo completar el registro.")
    };
  } catch (error) {
    return {
      ok: false,
      cliente: null,
      mensaje: describirErrorSupabase(error, "registrar el cliente")
    };
  }
}

export async function listarClientesEspeciales({ busqueda = "", incluirInactivos = true } = {}) {
  if (!supabaseConfigOk) return { ok: false, clientes: [], mensaje: "Falta configuración de Supabase." };

  try {
    let consulta = supabase
      .from("clientes_especiales")
      .select(CAMPOS_CLIENTE_ESPECIAL)
      .order("activo", { ascending: false })
      .order("nombre", { ascending: true });

    if (!incluirInactivos) consulta = consulta.eq("activo", true);

    const texto = limpiarTexto(busqueda);
    if (texto) {
      consulta = consulta.or(`nombre.ilike.%${texto}%,codigo.ilike.%${texto}%,telefono.ilike.%${texto}%,ubicacion.ilike.%${texto}%`);
    }

    const { data, error } = await consulta;
    if (error) throw error;

    return {
      ok: true,
      clientes: Array.isArray(data) ? data.map(normalizarClienteEspecial).filter(Boolean) : [],
      mensaje: "Clientes cargados."
    };
  } catch (error) {
    return {
      ok: false,
      clientes: [],
      mensaje: describirErrorSupabase(error, "cargar clientes")
    };
  }
}

export async function crearClienteEspecial(datos = {}) {
  if (!supabaseConfigOk) return { ok: false, cliente: null, mensaje: "Falta configuración de Supabase." };

  const payload = crearPayloadClienteEspecial({
    activo: true,
    sin_restriccion_acompanantes: true,
    habilita_cafeteria: true,
    permite_modificar_datos: true,
    origen_registro: "administracion",
    reglas_json: {},
    ...datos
  });

  if (!payload.codigo_normalizado || payload.codigo_normalizado.length < 3) {
    return { ok: false, cliente: null, mensaje: "El código debe tener al menos 3 caracteres." };
  }
  if (!payload.nombre || payload.nombre.length < 2) {
    return { ok: false, cliente: null, mensaje: "El nombre del cliente es obligatorio." };
  }
  if (!cumpleanosClienteValido(payload.cumple_mes, payload.cumple_dia)) {
    return { ok: false, cliente: null, mensaje: "El cumpleaños no es válido." };
  }

  try {
    const { data, error } = await supabase
      .from("clientes_especiales")
      .upsert(payload, { onConflict: "codigo_normalizado" })
      .select(CAMPOS_CLIENTE_ESPECIAL)
      .single();

    if (error) throw error;
    return { ok: true, cliente: normalizarClienteEspecial(data), mensaje: "Cliente guardado." };
  } catch (error) {
    return {
      ok: false,
      cliente: null,
      mensaje: describirErrorSupabase(error, "guardar el cliente", {
        mensajeDuplicado: "Ya existe un cliente con ese código."
      })
    };
  }
}

export async function actualizarClienteEspecial(id, cambios = {}) {
  if (!id || !supabaseConfigOk) return { ok: false, cliente: null, mensaje: "Cliente no válido." };

  const payload = crearPayloadClienteEspecial(cambios);
  if (!Object.keys(payload).length) return { ok: false, cliente: null, mensaje: "No hay cambios para guardar." };
  if (!cumpleanosClienteValido(payload.cumple_mes, payload.cumple_dia)) {
    return { ok: false, cliente: null, mensaje: "El cumpleaños no es válido." };
  }

  try {
    const { data, error } = await supabase
      .from("clientes_especiales")
      .update(payload)
      .eq("id", id)
      .select(CAMPOS_CLIENTE_ESPECIAL)
      .single();

    if (error) throw error;
    return { ok: true, cliente: normalizarClienteEspecial(data), mensaje: "Cliente actualizado." };
  } catch (error) {
    return {
      ok: false,
      cliente: null,
      mensaje: describirErrorSupabase(error, "actualizar el cliente", {
        mensajeDuplicado: "Ya existe un cliente con ese código."
      })
    };
  }
}

export function crearReglasClienteEspecialBase(reglas = {}) {
  return {
    promociones: false,
    regalo: null,
    descuento: null,
    prioridad: "normal",
    ...reglas
  };
}
