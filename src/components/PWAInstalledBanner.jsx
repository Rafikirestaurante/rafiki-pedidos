import React, { useEffect, useState } from 'react';
import { esRutaInternaPWA, estaEnModoInstalado } from '../utils/pwa.js';

const STORAGE_KEY = 'rafikiPwaInstalledBannerClosed';

export default function PWAInstalledBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cerrado = window.sessionStorage.getItem(STORAGE_KEY) === '1';
    setVisible(esRutaInternaPWA() && estaEnModoInstalado() && !cerrado);
  }, []);

  const cerrar = () => {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 14,
        right: 14,
        bottom: 14,
        zIndex: 9998,
        maxWidth: 520,
        margin: '0 auto',
        background: '#14532d',
        color: 'white',
        borderRadius: 18,
        padding: 14,
        boxShadow: '0 16px 34px rgba(0,0,0,.25)',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 22 }}>✅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900 }}>Estás usando Rafiki como app instalada</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Modo interno activo para mesas y administración.</div>
        </div>
        <button
          type="button"
          onClick={cerrar}
          style={{
            border: '1px solid rgba(255,255,255,.45)',
            background: 'transparent',
            color: 'white',
            borderRadius: 999,
            width: 30,
            height: 30,
            fontWeight: 900,
            cursor: 'pointer'
          }}
          aria-label="Cerrar aviso de app instalada"
        >
          ×
        </button>
      </div>
    </div>
  );
}
