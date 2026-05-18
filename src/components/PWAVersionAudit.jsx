import React, { useEffect, useState } from 'react';
import { esRutaInternaPWA } from '../utils/pwa.js';
import { RAFIKI_APP_VERSION, consultarVersionRemota, limpiarCachesYRecargar } from '../utils/pwaVersion.js';
import { contarPedidosPendientesOffline } from '../utils/offlinePedidos.js';
import { obtenerPermisoNotificaciones, notificacionesActivadas, soporteNotificacionesPWA } from '../utils/pwaNotifications.js';

async function obtenerInfoCache() {
  if (!('caches' in window)) return [];
  const nombres = await window.caches.keys();
  return nombres.filter((nombre) => /rafiki|workbox|vite|pwa|precache|runtime/i.test(nombre));
}

export default function PWAVersionAudit() {
  const [abierto, setAbierto] = useState(false);
  const [info, setInfo] = useState({ caches: [], versionRemota: '', error: '', revisando: false, pendientes: 0 });
  const [limpiando, setLimpiando] = useState(false);

  const revisar = async () => {
    setInfo((actual) => ({ ...actual, revisando: true, error: '' }));
    try {
      const [cachesLocales, version] = await Promise.all([
        obtenerInfoCache(),
        consultarVersionRemota().catch((error) => ({ version: '', error: error?.message || 'No disponible' }))
      ]);

      setInfo({
        caches: cachesLocales,
        versionRemota: version?.version || '',
        error: version?.error || '',
        revisando: false,
        pendientes: contarPedidosPendientesOffline()
      });
    } catch (error) {
      setInfo((actual) => ({
        ...actual,
        revisando: false,
        error: error?.message || 'No se pudo revisar la PWA.',
        pendientes: contarPedidosPendientesOffline()
      }));
    }
  };

  useEffect(() => {
    if (!abierto || !esRutaInternaPWA()) return;
    revisar();
  }, [abierto]);

  if (!esRutaInternaPWA()) return null;

  const limpiar = async () => {
    const confirmar = window.confirm('¿Limpiar caché y recargar Rafiki? Hazlo solo cuando no estés tomando un pedido.');
    if (!confirmar) return;
    setLimpiando(true);
    await limpiarCachesYRecargar();
  };

  const versionOk = info.versionRemota ? info.versionRemota === RAFIKI_APP_VERSION : true;
  const permiso = obtenerPermisoNotificaciones();

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        title="Auditoría PWA"
        style={{
          position: 'fixed',
          left: 14,
          bottom: 26,
          zIndex: 10001,
          border: 'none',
          borderRadius: 999,
          padding: '9px 12px',
          background: versionOk ? '#1f2937' : '#b45309',
          color: 'white',
          boxShadow: '0 10px 24px rgba(0,0,0,.22)',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 900,
          fontSize: 12
        }}
      >
        🛡️ PWA
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Auditoría de versiones PWA"
          style={{
            position: 'fixed',
            left: 14,
            bottom: 72,
            zIndex: 10002,
            width: 'min(390px, calc(100vw - 28px))',
            maxHeight: '70vh',
            overflow: 'auto',
            background: 'white',
            color: '#1f2937',
            borderRadius: 18,
            padding: 14,
            boxShadow: '0 18px 42px rgba(0,0,0,.28)',
            fontFamily: 'Arial, sans-serif',
            border: '1px solid #cbd5e1'
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Auditoría PWA</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Versión, caché, badge y notificaciones.</div>
            </div>
            <button type="button" onClick={() => setAbierto(false)} style={{ border: 'none', background: '#f3f4f6', borderRadius: 999, padding: '7px 10px', fontWeight: 900 }}>
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
            <div><strong>Versión instalada:</strong> {RAFIKI_APP_VERSION}</div>
            <div><strong>Versión remota:</strong> {info.versionRemota || 'No consultada'}</div>
            <div><strong>Estado versión:</strong> {versionOk ? 'OK' : 'Actualizar recomendada'}</div>
            <div><strong>Pedidos offline pendientes:</strong> {info.pendientes}</div>
            <div><strong>Badge:</strong> {'setAppBadge' in navigator ? 'Soportado' : 'No soportado en este dispositivo'}</div>
            <div><strong>Notificaciones:</strong> {soporteNotificacionesPWA() ? `${permiso}${notificacionesActivadas() ? ' · activas' : ''}` : 'No soportadas'}</div>
            <div><strong>Cachés Rafiki:</strong> {info.caches.length || 0}</div>
          </div>

          {info.caches.length > 0 && (
            <details style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
              <summary style={{ fontWeight: 900 }}>Ver cachés</summary>
              {info.caches.map((nombre) => (
                <div key={nombre} style={{ wordBreak: 'break-all', marginTop: 4 }}>{nombre}</div>
              ))}
            </details>
          )}

          {info.error && <div style={{ marginTop: 10, background: '#fff7ed', color: '#9a3412', borderRadius: 12, padding: 9, fontSize: 12 }}>{info.error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={revisar} disabled={info.revisando} style={{ border: 'none', background: '#2563eb', color: 'white', borderRadius: 12, padding: '10px 8px', fontWeight: 900 }}>
              {info.revisando ? 'Revisando...' : 'Revisar'}
            </button>
            <button type="button" onClick={limpiar} disabled={limpiando} style={{ border: 'none', background: '#f97316', color: 'white', borderRadius: 12, padding: '10px 8px', fontWeight: 900 }}>
              {limpiando ? 'Limpiando...' : 'Limpiar caché'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
