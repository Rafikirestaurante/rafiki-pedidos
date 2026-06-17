import { obtenerSesionActiva } from "./pedidos";

function estaEnModoPWAInstalada() {
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      window.navigator.standalone
  );
}

function rutaSeguraPWA(ruta) {
  if (!estaEnModoPWAInstalada()) return ruta;
  if (ruta === "/cliente" || ruta === "/pedido" || ruta === "/") return "/admin";
  return ruta;
}

export function obtenerVistaInicial() {
  let ruta = window.location.pathname.replace(/\/$/, "") || "/";
  const rutaOriginal = ruta;
  ruta = rutaSeguraPWA(ruta);
  if (ruta !== rutaOriginal) {
    window.history.replaceState({}, "", ruta);
  }
  if (ruta === "/gastos") {
    ruta = "/gerencia";
    window.history.replaceState({}, "", ruta);
  }

  const adminActivo = obtenerSesionActiva("rafikiAdminActivo");

  if (ruta === "/admin") {
    return adminActivo ? "admin" : "adminLogin";
  }

  if (ruta === "/gerencia" || ruta === "/rafa") {
    return adminActivo ? "gerencia" : "adminLogin";
  }

  if (ruta === "/pedidos") {
    return adminActivo ? "pedidos" : "adminLogin";
  }

  if (ruta === "/inventario") {
    return adminActivo ? "inventario" : "adminLogin";
  }

  if (ruta === "/pedido" || ruta === "/cliente") {
    return "cliente";
  }

  if (ruta === "/mesas") {
    return "mesas";
  }


  if (estaEnModoPWAInstalada()) {
    window.history.replaceState({}, "", "/admin");
    return adminActivo ? "admin" : "adminLogin";
  }

  return "inicio";
}

export function actualizarRuta(ruta) {
  const rutaFinal = rutaSeguraPWA(ruta);
  if (window.location.pathname !== rutaFinal) {
    window.history.pushState({}, "", rutaFinal);
  }
}
