import React, { useEffect, useState } from 'react';
import { esRutaInternaPWA } from '../utils/pwa.js';
import {
  RAFIKI_APP_VERSION,
  consultarVersionRemota,
  esVersionRemotaMasNueva,
  guardarVersionActual,
  limpiarCachesYRecargar
} from '../utils/pwaVersion.js';

const INTERVALO_REVISION_MS = 5 * 60 * 1000;

export default function PWAOldVersionGuard() {
  const [estado, setEstado] = useState({ visible: false, revisando: false, error: '', versionRemota: '' });
  const [limpiando, setLimpiando] = useState(false);

  useEffect(() => {
    if (!esRutaInternaPWA()) return undefined;

    let activo = true;

    const revisarVersion = async () => {
      if (!activo || !navigator.onLine) return;

      setEstado((actual) => ({ ...actual, revisando: true, error: '' }));

      try {
        const info = await consultarVersionRemota();
        if (!activo) return;

        if (esVersionRemotaMasNueva(info?.version)) {
          setEstado({
            visible: true,
            revisando: false,
            error: '',
            versionRemota: info.version
          });
          return;
        }

        guardarVersionActual();
        setEstado({ visible: false, revisando: false, error: '', versionRemota: '' });
      } catch (error) {
        if (!activo) return;
        setEstado((actual) => ({
          ...actual,
          revisando: false,
          error: error?.message || 'No se pudo verificar la versión actual.'
        }));
      }
    };

    revisarVersion();
    const intervalo = window.setInterval(revisarVersion, INTERVALO_REVISION_MS);
    window.addEventListener('focus', revisarVersion);
    window.addEventListener('online', revisarVersion);

    return () => {
      activo = false;
      window.clearInterval(intervalo);
      window.removeEventListener('focus', revisarVersion);
      window.removeEventListener('online', revisarVersion);
    };
  }, []);

  if (!esRutaInternaPWA()) return null;
  if (!estado.visible) return null;

  const limpiar = async () => {
    setLimpiando(true);
    try {
      await limpiarCachesYRecargar();
    } catch (error) {
      setEstado((actual) => ({
        ...actual,
        error: error?.message || 'No se pudo limpiar la caché automáticamente.'
      }));
      setLimpiando(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        background: 'rgba(17,24,39,.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#fff7ed',
          border: '2px solid #fb923c',
          borderRadius: 22,
          padding: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,.35)'
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
        <h2 style={{ margin: '0 0 8px', color: '#9a3412', fontSize: 22 }}>Estás usando una versión anterior</h2>
        <p style={{ margin: '0 0 12px', color: '#431407', lineHeight: 1.45 }}>
          Para evitar errores de pedidos, mesas o panel administrativo, actualiza antes de seguir operando.
        </p>

        <div
          style={{
            background: 'white',
            border: '1px solid #fed7aa',
            borderRadius: 14,
            padding: 12,
            color: '#44403c',
            fontSize: 13,
            lineHeight: 1.45,
            marginBottom: 14
          }}
        >
          <div>
            Versión instalada: <strong>{RAFIKI_APP_VERSION}</strong>
          </div>
          <div>
            Versión disponible: <strong>{estado.versionRemota || 'Nueva versión'}</strong>
          </div>
          <div style={{ marginTop: 6 }}>Esta pantalla solo aparece en rutas internas: mesas, admin y panel Rafa.</div>
        </div>

        {estado.error && (
          <div style={{ color: '#991b1b', background: '#fee2e2', borderRadius: 12, padding: 10, marginBottom: 12, fontSize: 13 }}>
            {estado.error}
          </div>
        )}

        <button
          type="button"
          onClick={limpiar}
          disabled={limpiando}
          style={{
            width: '100%',
            border: 'none',
            borderRadius: 999,
            padding: '14px 18px',
            background: limpiando ? '#9ca3af' : '#f97316',
            color: 'white',
            fontWeight: 900,
            fontSize: 16,
            cursor: limpiando ? 'wait' : 'pointer'
          }}
        >
          {limpiando ? 'Limpiando caché y recargando...' : 'Limpiar caché y actualizar ahora'}
        </button>
      </div>
    </div>
  );
}
