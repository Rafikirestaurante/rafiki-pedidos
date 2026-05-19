import React, { useEffect } from 'react';
import { esRutaInternaPWA } from '../utils/pwa.js';
import { consultarVersionRemota, guardarVersionActual } from '../utils/pwaVersion.js';

/**
 * Fase 17C3:
 * Antes este componente bloqueaba /admin, /mesas y Rafa cuando detectaba una
 * diferencia de versión entre el bundle instalado y /rafiki-version.json.
 * En algunos navegadores/PWA el Service Worker puede seguir sirviendo un bundle
 * antiguo aunque el usuario presione "limpiar caché", creando un ciclo infinito.
 *
 * Por estabilidad operativa, el guard queda como verificación silenciosa:
 * - nunca bloquea la app,
 * - nunca muestra pantalla completa,
 * - solo intenta registrar la versión actual cuando la remota coincide.
 */
export default function PWAOldVersionGuard() {
  useEffect(() => {
    if (!esRutaInternaPWA()) return undefined;

    let activo = true;

    const revisarVersionSinBloquear = async () => {
      if (!activo || !navigator.onLine) return;

      try {
        await consultarVersionRemota();
        if (activo) guardarVersionActual();
      } catch {
        // La app debe seguir operando aunque no pueda revisar la versión.
      }
    };

    revisarVersionSinBloquear();

    return () => {
      activo = false;
    };
  }, []);

  return null;
}
