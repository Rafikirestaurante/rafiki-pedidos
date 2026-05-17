const STORAGE_KEY = 'rafikiPedidosPendientesOffline';
const EVENTO_CAMBIO = 'rafiki:pedidos-offline-cambio';

function crearIdTemporal() {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function esRutaMesasInterna() {
  return window.location.pathname.replace(/\/$/, '') === '/mesas';
}

export function leerPedidosPendientesOffline() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function guardarLista(lista) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  actualizarBadgePedidosPendientes(lista.length);
  window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO, { detail: { total: lista.length } }));
}

export function contarPedidosPendientesOffline() {
  return leerPedidosPendientesOffline().length;
}

export function guardarPedidoPendienteOffline(pedido, metadata = {}) {
  const pendientes = leerPedidosPendientesOffline();
  const registro = {
    id_temporal: crearIdTemporal(),
    creado_en: new Date().toISOString(),
    intentos: 0,
    ultimo_error: '',
    origen: metadata.origen || 'mesas',
    pedido
  };

  guardarLista([...pendientes, registro]);
  return registro;
}

export function eliminarPedidoPendienteOffline(idTemporal) {
  const restantes = leerPedidosPendientesOffline().filter((registro) => registro.id_temporal !== idTemporal);
  guardarLista(restantes);
}

export function actualizarPedidoPendienteOffline(idTemporal, cambios) {
  const actualizados = leerPedidosPendientesOffline().map((registro) =>
    registro.id_temporal === idTemporal ? { ...registro, ...cambios } : registro
  );
  guardarLista(actualizados);
}

export function esErrorDeConexion(error) {
  const mensaje = String(error?.message || error || '').toLowerCase();
  return (
    !window.navigator.onLine ||
    mensaje.includes('failed to fetch') ||
    mensaje.includes('network') ||
    mensaje.includes('fetch') ||
    mensaje.includes('load failed') ||
    mensaje.includes('timeout')
  );
}

export async function sincronizarPedidosPendientesOffline({ supabase, onPedidoSincronizado, onError } = {}) {
  if (!window.navigator.onLine) {
    return { enviados: 0, pendientes: contarPedidosPendientesOffline(), error: 'Sin conexión.' };
  }

  const pendientes = leerPedidosPendientesOffline();
  let enviados = 0;

  for (const registro of pendientes) {
    try {
      const { data, error } = await supabase.from('pedidos').insert(registro.pedido).select().single();

      if (error) throw error;

      eliminarPedidoPendienteOffline(registro.id_temporal);
      enviados += 1;
      if (typeof onPedidoSincronizado === 'function') {
        onPedidoSincronizado(data, registro);
      }
    } catch (error) {
      actualizarPedidoPendienteOffline(registro.id_temporal, {
        intentos: Number(registro.intentos || 0) + 1,
        ultimo_error: error?.message || 'No se pudo reenviar el pedido.',
        ultimo_intento_en: new Date().toISOString()
      });

      if (typeof onError === 'function') onError(error, registro);

      // Si el primer reenvío falla, detenemos el proceso para evitar bucles o duplicados.
      break;
    }
  }

  return { enviados, pendientes: contarPedidosPendientesOffline() };
}

export async function actualizarBadgePedidosPendientes(total = contarPedidosPendientesOffline()) {
  try {
    if ('setAppBadge' in navigator && total > 0) {
      await navigator.setAppBadge(total);
      return;
    }

    if ('clearAppBadge' in navigator && total <= 0) {
      await navigator.clearAppBadge();
    }
  } catch {
    // El badge no está soportado en todos los navegadores. No debe romper la app.
  }
}

export function suscribirCambiosPedidosOffline(callback) {
  const handler = () => callback(contarPedidosPendientesOffline());
  window.addEventListener(EVENTO_CAMBIO, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, handler);
    window.removeEventListener('storage', handler);
  };
}
