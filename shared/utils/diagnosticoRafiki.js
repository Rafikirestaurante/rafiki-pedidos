export const CLAVE_ERRORES_DIAGNOSTICO = "rafikiDiagnosticoErrores";
export const CLAVE_ULTIMA_SINCRONIZACION_DIAGNOSTICO = "rafikiDiagnosticoUltimaSincronizacion";
export const EVENTO_SINCRONIZACION_DIAGNOSTICO = "rafiki:diagnostico-sincronizacion";

const MAX_ERRORES = 8;

function storageDisponible(storage) {
  return storage && typeof storage.getItem === "function" && typeof storage.setItem === "function";
}

export function limitarErroresDiagnostico(items = []) {
  return (Array.isArray(items) ? items : []).slice(-MAX_ERRORES);
}

export function leerErroresDiagnostico(storage = globalThis?.localStorage) {
  if (!storageDisponible(storage)) return [];
  try {
    return limitarErroresDiagnostico(JSON.parse(storage.getItem(CLAVE_ERRORES_DIAGNOSTICO) || "[]"));
  } catch {
    return [];
  }
}

export function guardarErrorDiagnostico(error, storage = globalThis?.localStorage) {
  if (!storageDisponible(storage)) return null;
  const nuevo = {
    fecha: new Date().toISOString(),
    mensaje: String(error?.message || error || "Error no identificado").slice(0, 260),
    origen: String(error?.origen || "app").slice(0, 80)
  };

  try {
    storage.setItem(
      CLAVE_ERRORES_DIAGNOSTICO,
      JSON.stringify(limitarErroresDiagnostico([...leerErroresDiagnostico(storage), nuevo]))
    );
    return nuevo;
  } catch {
    return null;
  }
}

export function limpiarErroresDiagnostico(storage = globalThis?.localStorage) {
  try {
    storage?.removeItem?.(CLAVE_ERRORES_DIAGNOSTICO);
  } catch {
    // El diagnóstico nunca debe bloquear la aplicación.
  }
}

export function leerUltimaSincronizacionDiagnostico(storage = globalThis?.localStorage) {
  if (!storageDisponible(storage)) return null;
  try {
    const valor = JSON.parse(storage.getItem(CLAVE_ULTIMA_SINCRONIZACION_DIAGNOSTICO) || "null");
    return valor && typeof valor === "object" ? valor : null;
  } catch {
    return null;
  }
}

export function registrarSincronizacionDiagnostico(
  { origen = "Aplicación", estado = "ok", detalle = "Sincronización completada." } = {},
  storage = globalThis?.localStorage,
  eventTarget = globalThis?.window
) {
  const registro = {
    fecha: new Date().toISOString(),
    origen: String(origen || "Aplicación").slice(0, 80),
    estado: String(estado || "ok").slice(0, 30),
    detalle: String(detalle || "").slice(0, 260)
  };

  try {
    storage?.setItem?.(CLAVE_ULTIMA_SINCRONIZACION_DIAGNOSTICO, JSON.stringify(registro));
  } catch {
    // El registro de diagnóstico es auxiliar.
  }

  try {
    eventTarget?.dispatchEvent?.(new CustomEvent(EVENTO_SINCRONIZACION_DIAGNOSTICO, { detail: registro }));
  } catch {
    // CustomEvent puede no existir durante pruebas.
  }

  return registro;
}

export function formatearFechaDiagnostico(fecha, locale = "es-CO") {
  if (!fecha) return "Sin registro";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Sin registro";
  return valor.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function crearInformeTecnicoDiagnostico(datos = {}) {
  const lineas = [
    "RAFIKI PEDIDOS — INFORME TÉCNICO",
    `Generado: ${datos.generado || new Date().toISOString()}`,
    `Ruta: ${datos.ruta || "—"}`,
    `Versión instalada: ${datos.versionActual || "—"}`,
    `Versión publicada: ${datos.versionRemota || "No disponible"}`,
    `Internet: ${datos.online ? "Online" : "Offline"}`,
    `Supabase config: ${datos.supabaseConfig ? "OK" : "Incompleta"}`,
    `Prueba Supabase: ${datos.supabase || "No ejecutada"}`,
    `Service Worker: ${datos.serviceWorker || "No disponible"}`,
    `Cachés PWA: ${datos.caches || "No disponible"}`,
    `Última sincronización: ${datos.ultimaSincronizacion || "Sin registro"}`,
    `Carga inicial: ${datos.cargaInicial || "—"}`,
    `DOM listo: ${datos.domListo || "—"}`,
    `Red reportada: ${datos.red || "No reportada"}`,
    `Memoria reportada: ${datos.memoria || "No reportada"}`,
    `Agente: ${datos.userAgent || "No reportado"}`,
    "",
    "ÚLTIMOS ERRORES"
  ];

  const errores = Array.isArray(datos.errores) ? datos.errores : [];
  if (!errores.length) lineas.push("Sin errores recientes guardados.");
  errores.slice(-8).reverse().forEach((error) => {
    lineas.push(`- ${error.fecha || "—"} | ${error.origen || "app"} | ${error.mensaje || "Error sin detalle"}`);
  });

  return lineas.join("\n");
}
