import React, { useEffect, useState } from 'react';
import { activarNuevaVersion } from '../registerSW.js';
import { esRutaInternaPWA } from '../utils/pwa.js';

export default function PWAUpdatePrompt() {
  const [actualizar, setActualizar] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const manejarNuevaVersion = (event) => {
      if (!esRutaInternaPWA()) return;
      setActualizar(() => event.detail?.actualizar || null);
      setVisible(true);
    };

    window.addEventListener('rafiki:nueva-version-disponible', manejarNuevaVersion);
    return () => {
      window.removeEventListener('rafiki:nueva-version-disponible', manejarNuevaVersion);
    };
  }, []);

  if (!esRutaInternaPWA()) return null;
  if (!actualizar || !visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 10000,
        maxWidth: 540,
        margin: '0 auto',
        background: '#111827',
        color: 'white',
        borderRadius: 18,
        padding: 16,
        boxShadow: '0 18px 40px rgba(0,0,0,.28)',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>Nueva versión disponible</div>
          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.35 }}>
            Actualiza cuando termines el pedido actual. No se recargará sola.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setVisible(false)}
            style={{
              border: '1px solid rgba(255,255,255,.32)',
              borderRadius: 999,
              padding: '10px 12px',
              background: 'transparent',
              color: 'white',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Luego
          </button>
          <button
            type="button"
            onClick={() => activarNuevaVersion(actualizar)}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '10px 14px',
              background: '#f97316',
              color: 'white',
              fontWeight: 900,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}
