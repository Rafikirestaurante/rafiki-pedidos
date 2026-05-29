import React, { useState } from 'react';
import { limpiarCachesYRecargar } from '../utils/pwaVersion.js';

export default function PWAClearCacheButton({ className = '', compact = false }) {
  const [limpiando, setLimpiando] = useState(false);

  const manejarClick = async () => {
    if (limpiando) return;

    const confirmar = window.confirm(
      '¿Limpiar caché y actualizar Rafiki? Hazlo cuando no estés registrando un pedido.'
    );

    if (!confirmar) return;

    setLimpiando(true);
    try {
      await limpiarCachesYRecargar();
    } catch (error) {
      console.warn('No se pudo limpiar caché completamente:', error);
      window.location.reload();
    }
  };

  return (
    <button
      type="button"
      onClick={manejarClick}
      disabled={limpiando}
      className={`rafiki-clear-cache-button ${className}`.trim()}
      title="Limpiar caché y cargar la última versión"
      style={compact ? { padding: '8px 10px', fontSize: 12 } : undefined}
    >
      {limpiando ? 'Actualizando...' : 'Limpiar caché'}
    </button>
  );
}
