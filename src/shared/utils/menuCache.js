import { menuFallback } from "../../data/menuAlmuerzos";
import { normalizarMenu } from "./pedidos";

export const MENU_CACHE_KEY = "rafikiMenuDiarioCache";

export function leerMenuCache() {
  try {
    const raw = window.localStorage.getItem(MENU_CACHE_KEY);
    return raw ? normalizarMenu(JSON.parse(raw)) : normalizarMenu(menuFallback);
  } catch (_error) {
    return normalizarMenu(menuFallback);
  }
}

export function guardarMenuCache(menuNormalizado) {
  try {
    window.localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(menuNormalizado));
  } catch (_error) {
    // No bloquear la app si el navegador no permite localStorage.
  }
}

export function hayMenuCacheValido() {
  try {
    const raw = window.localStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return false;
    const menuGuardado = normalizarMenu(JSON.parse(raw));
    return Boolean(
      menuGuardado?.id ||
      menuGuardado?.platos_detalle?.length ||
      menuGuardado?.acompanantes?.length
    );
  } catch (_error) {
    return false;
  }
}
