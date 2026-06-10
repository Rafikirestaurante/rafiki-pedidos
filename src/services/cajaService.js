import { supabase } from "../supabaseClient";

const SELECT_CAJA_ARQUEOS = "id, fecha, inicio_data, fin_data, inicio_total, fin_total, creado_en, actualizado_en";

function hoyISOColombia(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(fecha);
}

function numeroSeguro(valor) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) ? numero : 0;
}

export function obtenerFechaCajaHoy() {
  return hoyISOColombia();
}

export function normalizarCajaArqueo(registro) {
  if (!registro) return null;
  return {
    id: registro.id,
    fecha: registro.fecha || hoyISOColombia(),
    inicioData: registro.inicio_data || null,
    finData: registro.fin_data || null,
    inicioTotal: numeroSeguro(registro.inicio_total),
    finTotal: numeroSeguro(registro.fin_total),
    creadoEn: registro.creado_en || "",
    actualizadoEn: registro.actualizado_en || "",
  };
}

export async function cargarCajaArqueoPorFecha(fecha = hoyISOColombia()) {
  const fechaConsulta = fecha || hoyISOColombia();
  const { data, error } = await supabase
    .from("caja_arqueos")
    .select(SELECT_CAJA_ARQUEOS)
    .eq("fecha", fechaConsulta)
    .maybeSingle();

  if (error) throw error;
  return normalizarCajaArqueo(data);
}

async function guardarCajaArqueoParcial({ fecha, campoData, campoTotal, estado, total }) {
  const fechaGuardar = fecha || hoyISOColombia();
  const payload = {
    fecha: fechaGuardar,
    [campoData]: estado || null,
    [campoTotal]: numeroSeguro(total),
    actualizado_en: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("caja_arqueos")
    .upsert(payload, { onConflict: "fecha" })
    .select(SELECT_CAJA_ARQUEOS)
    .single();

  if (error) throw error;
  return normalizarCajaArqueo(data);
}

export function guardarInicioCaja({ fecha, estado, total }) {
  return guardarCajaArqueoParcial({
    fecha,
    estado,
    total,
    campoData: "inicio_data",
    campoTotal: "inicio_total",
  });
}

export function guardarFinCaja({ fecha, estado, total }) {
  return guardarCajaArqueoParcial({
    fecha,
    estado,
    total,
    campoData: "fin_data",
    campoTotal: "fin_total",
  });
}
