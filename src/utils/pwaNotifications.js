const NOTIFICACIONES_STORAGE_KEY = 'rafikiPwaNotificacionesActivas';

export function soporteNotificacionesPWA() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function obtenerPermisoNotificaciones() {
  if (!soporteNotificacionesPWA()) return 'unsupported';
  return Notification.permission;
}

export function notificacionesActivadas() {
  try {
    return window.localStorage.getItem(NOTIFICACIONES_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function guardarNotificacionesActivadas(activo) {
  try {
    window.localStorage.setItem(NOTIFICACIONES_STORAGE_KEY, activo ? '1' : '0');
  } catch {
    // No debe romper la aplicación si localStorage no está disponible.
  }
}

export async function solicitarPermisoNotificaciones() {
  if (!soporteNotificacionesPWA()) {
    return { ok: false, permiso: 'unsupported', mensaje: 'Este navegador no soporta notificaciones.' };
  }

  if (Notification.permission === 'granted') {
    guardarNotificacionesActivadas(true);
    return { ok: true, permiso: 'granted', mensaje: 'Notificaciones activadas.' };
  }

  if (Notification.permission === 'denied') {
    guardarNotificacionesActivadas(false);
    return {
      ok: false,
      permiso: 'denied',
      mensaje: 'Las notificaciones están bloqueadas en el navegador. Debes habilitarlas desde configuración del sitio.'
    };
  }

  const permiso = await Notification.requestPermission();
  const ok = permiso === 'granted';
  guardarNotificacionesActivadas(ok);
  return {
    ok,
    permiso,
    mensaje: ok ? 'Notificaciones activadas.' : 'No se activaron las notificaciones.'
  };
}

function construirTextoPedido(pedido = {}) {
  const clienteOMesa = pedido.mesa || pedido.cliente || pedido.nombre_cliente || 'Nuevo pedido';
  const total = Number(pedido.total || 0);
  const totalTexto = total > 0 ? ` · Total: ${total.toLocaleString('es-CO')}` : '';
  return `${clienteOMesa}${totalTexto}`;
}

export async function mostrarNotificacionNuevoPedido(pedido = {}) {
  if (!notificacionesActivadas() || obtenerPermisoNotificaciones() !== 'granted') return false;

  const title = 'Nuevo pedido Rafiki';
  const options = {
    body: construirTextoPedido(pedido),
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `rafiki-pedido-${pedido.id || Date.now()}`,
    renotify: true,
    requireInteraction: false,
    data: {
      url: '/admin?source=notification',
      pedidoId: pedido.id || null
    }
  };

  try {
    const registro = await navigator.serviceWorker?.ready;
    if (registro?.showNotification) {
      await registro.showNotification(title, options);
      return true;
    }
  } catch {
    // Si el service worker no está listo, se intenta notificación normal.
  }

  try {
    const notificacion = new Notification(title, options);
    notificacion.onclick = () => {
      window.focus();
      notificacion.close();
    };
    return true;
  } catch {
    return false;
  }
}
