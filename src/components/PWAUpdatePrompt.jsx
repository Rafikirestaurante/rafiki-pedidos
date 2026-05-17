import React, { useEffect, useState } from 'react';
import { activarNuevaVersion } from '../registerSW.js';

export default function PWAUpdatePrompt() {
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const manejarNuevaVersion = (event) => {
      setRegistration(event.detail?.registration || null);
    };

    window.addEventListener('rafiki:nueva-version-disponible', manejarNuevaVersion);
    return () => {
      window.removeEventListener('rafiki:nueva-version-disponible', manejarNuevaVersion);
    };
  }, []);

  if (!registration) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 10000,
        maxWidth: 520,
        margin: '0 auto',
        background: '#111827',
        color: 'white',
        borderRadius: 18,
        padding: 16,
        boxShadow: '0 18px 40px rgba(0,0,0,.28)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div>
        <div style={{ fontWeight: 800, marginBottom: 3 }}>Nueva versión disponible</div>
        <div style={{ fontSize: 13, opacity: .88 }}>Actualiza cuando termines el pedido actual.</div>
      </div>
      <button
        type="button"
        onClick={() => activarNuevaVersion(registration)}
        style={{
          border: 'none',
          borderRadius: 999,
          padding: '10px 14px',
          background: '#f97316',
          color: 'white',
          fontWeight: 800,
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        Actualizar
      </button>
    </div>
  );
}
