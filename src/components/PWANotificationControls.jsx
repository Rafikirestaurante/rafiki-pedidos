import React, { useEffect, useState } from 'react';
import { esRutaInternaPWA } from '../utils/pwa.js';
import {
  guardarNotificacionesActivadas,
  notificacionesActivadas,
  obtenerPermisoNotificaciones,
  solicitarPermisoNotificaciones,
  soporteNotificacionesPWA
} from '../utils/pwaNotifications.js';

export default function PWANotificationControls() {
  const [visible, setVisible] = useState(false);
  const [permiso, setPermiso] = useState(() => obtenerPermisoNotificaciones());
  const [activas, setActivas] = useState(() => notificacionesActivadas());
  const [mensaje, setMensaje] = useState('');
  const [solicitando, setSolicitando] = useState(false);

  useEffect(() => {
    if (!esRutaInternaPWA()) return undefined;
    const actualizar = () => {
      setPermiso(obtenerPermisoNotificaciones());
      setActivas(notificacionesActivadas());
    };
    actualizar();
    window.addEventListener('focus', actualizar);
    return () => window.removeEventListener('focus', actualizar);
  }, []);

  if (!esRutaInternaPWA()) return null;
  if (!soporteNotificacionesPWA()) return null;

  const activar = async () => {
    setSolicitando(true);
    setMensaje('');
    try {
      const resultado = await solicitarPermisoNotificaciones();
      setPermiso(resultado.permiso);
      setActivas(resultado.ok);
      setMensaje(resultado.mensaje);
    } catch (error) {
      setMensaje(error?.message || 'No se pudieron activar las notificaciones.');
    } finally {
      setSolicitando(false);
    }
  };

  const desactivar = () => {
    guardarNotificacionesActivadas(false);
    setActivas(false);
    setMensaje('Notificaciones desactivadas en Rafiki.');
  };

  const textoEstado = permiso === 'granted' && activas ? 'Notificaciones activas' : permiso === 'denied' ? 'Bloqueadas por navegador' : 'Notificaciones inactivas';

  return (
    <>
      <button
        type="button"
        onClick={() => setVisible((valor) => !valor)}
        title="Notificaciones PWA"
        style={{
          position: 'fixed',
          left: 14,
          bottom: 82,
          zIndex: 10001,
          border: 'none',
          borderRadius: 999,
          padding: '9px 12px',
          background: permiso === 'granted' && activas ? '#166534' : '#44403c',
          color: 'white',
          boxShadow: '0 10px 24px rgba(0,0,0,.22)',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 900,
          fontSize: 12
        }}
      >
        🔔 {permiso === 'granted' && activas ? 'Activas' : 'Alertas'}
      </button>

      {visible && (
        <div
          role="dialog"
          aria-label="Notificaciones PWA Rafiki"
          style={{
            position: 'fixed',
            left: 14,
            bottom: 128,
            zIndex: 10002,
            width: 'min(360px, calc(100vw - 28px))',
            background: 'white',
            color: '#1f2937',
            borderRadius: 18,
            padding: 14,
            boxShadow: '0 18px 42px rgba(0,0,0,.28)',
            fontFamily: 'Arial, sans-serif',
            border: '1px solid #bbf7d0'
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Notificaciones internas</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{textoEstado}</div>
            </div>
            <button type="button" onClick={() => setVisible(false)} style={{ border: 'none', background: '#f3f4f6', borderRadius: 999, padding: '7px 10px', fontWeight: 900 }}>
              ×
            </button>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#4b5563', lineHeight: 1.4 }}>
            Sirven para avisar nuevos pedidos en el panel administrativo cuando el navegador y Android lo permitan.
          </p>

          {mensaje && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 9, fontSize: 12, marginBottom: 10 }}>{mensaje}</div>}

          {permiso === 'denied' ? (
            <div style={{ background: '#fef2f2', color: '#991b1b', borderRadius: 12, padding: 10, fontSize: 12 }}>
              El navegador las bloqueó. Debes habilitarlas manualmente en permisos del sitio.
            </div>
          ) : (
            <button
              type="button"
              onClick={activas ? desactivar : activar}
              disabled={solicitando}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 12,
                padding: '11px 12px',
                background: activas ? '#7f1d1d' : '#16a34a',
                color: 'white',
                fontWeight: 900
              }}
            >
              {solicitando ? 'Solicitando permiso...' : activas ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            </button>
          )}
        </div>
      )}
    </>
  );
}
