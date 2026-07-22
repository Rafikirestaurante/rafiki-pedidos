import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigOk } from "../../../supabaseClient";
import { RAFIKI_BUILD } from "../../../config/rafikiBuild";
import { fechaISOColombia } from "../../../shared/utils/pedidos";
import { consultarVersionRemota, esVersionRemotaMasNueva } from "../../../shared/utils/pwaVersion";
import { useAvisosRafiki } from "../../../shared/components/common";
import {
  CLAVE_ERRORES_DIAGNOSTICO,
  EVENTO_SINCRONIZACION_DIAGNOSTICO,
  crearInformeTecnicoDiagnostico,
  formatearFechaDiagnostico,
  guardarErrorDiagnostico,
  leerErroresDiagnostico,
  leerUltimaSincronizacionDiagnostico,
  limpiarErroresDiagnostico,
  registrarSincronizacionDiagnostico
} from "../../../shared/utils/diagnosticoRafiki";
import "../styles/diagnosticoRafiki.css";

function ms(valor) {
  return Number.isFinite(valor) && valor >= 0 ? `${Math.round(valor)} ms` : "—";
}

function obtenerInfoNavegacion() {
  const nav = window.performance?.getEntriesByType?.("navigation")?.[0];
  if (!nav) return null;
  return {
    carga: nav.loadEventEnd ? nav.loadEventEnd - nav.startTime : 0,
    dom: nav.domContentLoadedEventEnd ? nav.domContentLoadedEventEnd - nav.startTime : 0,
    respuesta: nav.responseEnd && nav.requestStart ? nav.responseEnd - nav.requestStart : 0,
    tipo: nav.type || "—"
  };
}

function contarRecursos() {
  const recursos = window.performance?.getEntriesByType?.("resource") || [];
  return { total: recursos.length, lentos: recursos.filter((item) => Number(item.duration) > 1200).length };
}

async function obtenerEstadoServiceWorker() {
  if (!("serviceWorker" in navigator)) return { texto: "No disponible", detalle: "Navegador sin Service Worker." };
  const registro = await navigator.serviceWorker.getRegistration();
  if (!registro) return { texto: "Sin registrar", detalle: "No existe registro para esta ruta." };
  if (registro.waiting) return { texto: "Actualización pendiente", detalle: "Hay una versión esperando activación." };
  if (registro.installing) return { texto: "Instalando", detalle: registro.installing.state || "En proceso" };
  if (registro.active) {
    return {
      texto: navigator.serviceWorker.controller ? "Activo" : "Activo sin controlar",
      detalle: `Estado: ${registro.active.state || "activated"}`
    };
  }
  return { texto: "Registrado", detalle: "Sin trabajador activo." };
}

async function obtenerEstadoCaches() {
  if (!("caches" in window)) return { texto: "No disponible", nombres: [] };
  const nombres = await window.caches.keys();
  return { texto: nombres.length ? `${nombres.length} caché${nombres.length === 1 ? "" : "s"}` : "Sin cachés", nombres };
}

async function conTimeout(promesa, msTimeout = 10000) {
  let timer;
  try {
    return await Promise.race([
      promesa,
      new Promise((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(`Supabase tardó más de ${msTimeout / 1000}s en responder.`)), msTimeout);
      })
    ]);
  } finally {
    window.clearTimeout(timer);
  }
}

async function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(texto);
  const area = document.createElement("textarea");
  area.value = texto;
  area.readOnly = true;
  area.className = "diagnostico-copiar-fallback";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export function iniciarDiagnosticoRafikiLigero() {
  if (window.__rafikiDiagnosticoActivo) return;
  window.__rafikiDiagnosticoActivo = true;
  window.addEventListener("error", (event) => guardarErrorDiagnostico({ origen: "error", message: event?.message }));
  window.addEventListener("unhandledrejection", (event) => {
    guardarErrorDiagnostico({ origen: "promesa", message: event?.reason?.message || event?.reason });
  });
}

export default function DiagnosticoRafiki() {
  const [mostrarAviso, avisosRafiki] = useAvisosRafiki();
  const [online, setOnline] = useState(navigator.onLine);
  const [errores, setErrores] = useState(() => leerErroresDiagnostico());
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(() => leerUltimaSincronizacionDiagnostico());
  const [probando, setProbando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [resultadoSupabase, setResultadoSupabase] = useState(null);
  const [versionRemota, setVersionRemota] = useState(null);
  const [errorVersion, setErrorVersion] = useState("");
  const [serviceWorker, setServiceWorker] = useState({ texto: "Revisando...", detalle: "" });
  const [estadoCaches, setEstadoCaches] = useState({ texto: "Revisando...", nombres: [] });
  const navegacion = useMemo(obtenerInfoNavegacion, []);
  const recursos = useMemo(contarRecursos, []);

  const revisarEntorno = useCallback(async () => {
    setActualizando(true);
    setErrorVersion("");
    const [version, sw, caches] = await Promise.allSettled([
      consultarVersionRemota(), obtenerEstadoServiceWorker(), obtenerEstadoCaches()
    ]);
    if (version.status === "fulfilled") setVersionRemota(version.value);
    else setErrorVersion(version.reason?.message || "No se pudo consultar la versión publicada.");
    setServiceWorker(sw.status === "fulfilled" ? sw.value : { texto: "Error", detalle: sw.reason?.message || "Sin detalle" });
    setEstadoCaches(caches.status === "fulfilled" ? caches.value : { texto: "Error", nombres: [] });
    setErrores(leerErroresDiagnostico());
    setUltimaSincronizacion(leerUltimaSincronizacionDiagnostico());
    setActualizando(false);
  }, []);

  useEffect(() => {
    const actualizarOnline = () => setOnline(navigator.onLine);
    const actualizarSincronizacion = (event) => setUltimaSincronizacion(event?.detail || leerUltimaSincronizacionDiagnostico());
    const actualizarStorage = (event) => {
      if (!event.key || event.key === CLAVE_ERRORES_DIAGNOSTICO) setErrores(leerErroresDiagnostico());
    };
    window.addEventListener("online", actualizarOnline);
    window.addEventListener("offline", actualizarOnline);
    window.addEventListener(EVENTO_SINCRONIZACION_DIAGNOSTICO, actualizarSincronizacion);
    window.addEventListener("storage", actualizarStorage);
    revisarEntorno();
    const intervalo = window.setInterval(() => setErrores(leerErroresDiagnostico()), 5000);
    return () => {
      window.removeEventListener("online", actualizarOnline);
      window.removeEventListener("offline", actualizarOnline);
      window.removeEventListener(EVENTO_SINCRONIZACION_DIAGNOSTICO, actualizarSincronizacion);
      window.removeEventListener("storage", actualizarStorage);
      window.clearInterval(intervalo);
    };
  }, [revisarEntorno]);

  async function probarSupabase() {
    setProbando(true);
    setResultadoSupabase(null);
    const inicio = Date.now();
    try {
      if (!supabaseConfigOk) throw new Error("Variables de Supabase incompletas.");
      const { error } = await conTimeout(supabase.from("pedidos").select("id").limit(1));
      if (error) throw error;
      const texto = `Supabase respondió en ${Date.now() - inicio} ms.`;
      setResultadoSupabase({ ok: true, texto });
      setUltimaSincronizacion(registrarSincronizacionDiagnostico({ origen: "Supabase", detalle: texto }));
    } catch (error) {
      guardarErrorDiagnostico({ origen: "supabase", message: error?.message });
      setErrores(leerErroresDiagnostico());
      setResultadoSupabase({ ok: false, texto: error?.message || "No se pudo conectar con Supabase." });
    } finally {
      setProbando(false);
    }
  }

  function limpiarErrores() {
    limpiarErroresDiagnostico();
    setErrores([]);
    mostrarAviso({ tipo: "info", mensaje: "Se limpió el historial local de errores." });
  }

  async function copiarInforme() {
    const reporte = crearInformeTecnicoDiagnostico({
      ruta: window.location.href,
      versionActual: RAFIKI_BUILD.version,
      versionRemota: versionRemota?.version || "No disponible",
      online,
      supabaseConfig: supabaseConfigOk,
      supabase: resultadoSupabase?.texto || "No ejecutada",
      serviceWorker: `${serviceWorker.texto}${serviceWorker.detalle ? ` — ${serviceWorker.detalle}` : ""}`,
      caches: `${estadoCaches.texto}${estadoCaches.nombres.length ? ` — ${estadoCaches.nombres.join(", ")}` : ""}`,
      ultimaSincronizacion: ultimaSincronizacion
        ? `${formatearFechaDiagnostico(ultimaSincronizacion.fecha)} — ${ultimaSincronizacion.origen}: ${ultimaSincronizacion.detalle}`
        : "Sin registro",
      cargaInicial: ms(navegacion?.carga),
      domListo: ms(navegacion?.dom),
      red: navigator.connection?.effectiveType || "No reportada",
      memoria: navigator.deviceMemory ? `${navigator.deviceMemory} GB aprox.` : "No reportada",
      userAgent: navigator.userAgent,
      errores
    });
    try {
      await copiarTexto(reporte);
      mostrarAviso({ tipo: "success", mensaje: "Informe técnico copiado. Ya puedes compartirlo." });
    } catch (error) {
      guardarErrorDiagnostico({ origen: "copiar-informe", message: error?.message });
      mostrarAviso({ tipo: "error", mensaje: "No fue posible copiar el informe técnico." });
    }
  }

  const versionPublicada = versionRemota?.version || "No disponible";
  const hayActualizacion = Boolean(versionRemota?.version) && esVersionRemotaMasNueva(versionRemota.version, RAFIKI_BUILD.version);
  const ultimoError = errores.at(-1);

  return (
    <div className="soft-box diagnostico-rafiki">
      {avisosRafiki}
      <div className="admin-top-row diagnostico-encabezado">
        <div>
          <h3>🩺 Diagnóstico técnico reforzado</h3>
          <p className="muted">Revisa versión, conexión, Supabase, PWA, caché, sincronización y errores del dispositivo.</p>
        </div>
        <div className="diagnostico-acciones">
          <button type="button" className="button-secondary" onClick={copiarInforme}>Copiar informe</button>
          <button type="button" className="button-secondary" onClick={revisarEntorno} disabled={actualizando}>
            {actualizando ? "Revisando..." : "Actualizar diagnóstico"}
          </button>
          <button type="button" className="button" onClick={probarSupabase} disabled={probando || !online}>
            {probando ? "Probando..." : "Probar Supabase"}
          </button>
        </div>
      </div>

      <div className="admin-stats diagnostico-stats">
        <div className="stat-card"><span>Versión instalada</span><strong>{RAFIKI_BUILD.version.split("-")[0]}</strong><small>{RAFIKI_BUILD.phase}</small></div>
        <div className={`stat-card ${hayActualizacion ? "diagnostico-alerta-version" : ""}`}><span>Versión publicada</span><strong>{versionPublicada.split("-")[0]}</strong><small>{hayActualizacion ? "Actualización disponible" : errorVersion || "Aplicación al día"}</small></div>
        <div className="stat-card"><span>Internet</span><strong>{online ? "Online" : "Offline"}</strong><small>{navigator.connection?.effectiveType || "Red no reportada"}</small></div>
        <div className="stat-card"><span>Supabase</span><strong>{supabaseConfigOk ? "Configurado" : "Incompleto"}</strong><small>{resultadoSupabase?.texto || "Prueba manual pendiente"}</small></div>
        <div className="stat-card"><span>PWA / Service Worker</span><strong>{serviceWorker.texto}</strong><small>{serviceWorker.detalle || "—"}</small></div>
        <div className="stat-card"><span>Caché</span><strong>{estadoCaches.texto}</strong><small>{estadoCaches.nombres.slice(0, 2).join(", ") || "Sin nombres registrados"}</small></div>
        <div className="stat-card"><span>Última sincronización</span><strong>{formatearFechaDiagnostico(ultimaSincronizacion?.fecha)}</strong><small>{ultimaSincronizacion ? `${ultimaSincronizacion.origen}: ${ultimaSincronizacion.detalle}` : "Aún no existe registro local"}</small></div>
        <div className="stat-card"><span>Último error</span><strong>{ultimoError ? formatearFechaDiagnostico(ultimoError.fecha) : "Sin errores"}</strong><small>{ultimoError?.mensaje || "No hay errores recientes guardados"}</small></div>
      </div>

      {resultadoSupabase ? <div className={`alert ${resultadoSupabase.ok ? "alert-success" : "alert-error"}`}>{resultadoSupabase.texto}</div> : null}

      <div className="grid-2 diagnostico-grid">
        <div className="soft-box diagnostico-seccion">
          <h4>Rendimiento del dispositivo</h4>
          <dl className="diagnostico-lista">
            <div><dt>Fecha Colombia</dt><dd>{fechaISOColombia()}</dd></div>
            <div><dt>Carga inicial</dt><dd>{ms(navegacion?.carga)}</dd></div>
            <div><dt>DOM listo</dt><dd>{ms(navegacion?.dom)}</dd></div>
            <div><dt>Respuesta documento</dt><dd>{ms(navegacion?.respuesta)}</dd></div>
            <div><dt>Tipo de carga</dt><dd>{navegacion?.tipo || "—"}</dd></div>
            <div><dt>Recursos lentos</dt><dd>{recursos.lentos}/{recursos.total}</dd></div>
            <div><dt>Memoria aproximada</dt><dd>{navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "No reportada"}</dd></div>
          </dl>
        </div>

        <div className="soft-box diagnostico-seccion">
          <div className="admin-top-row">
            <div><h4>Últimos errores locales</h4><p className="muted diagnostico-ayuda">Se guardan máximo ocho errores en este dispositivo.</p></div>
            <button type="button" className="button-secondary" onClick={limpiarErrores} disabled={errores.length === 0}>Limpiar</button>
          </div>
          {errores.length === 0 ? <p className="muted">No hay errores recientes guardados.</p> : (
            <ul className="simple-list diagnostico-errores">
              {errores.slice().reverse().map((error, index) => (
                <li key={`${error.fecha}-${index}`}><strong>{error.origen}</strong> · {formatearFechaDiagnostico(error.fecha)}<small>{error.mensaje}</small></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
