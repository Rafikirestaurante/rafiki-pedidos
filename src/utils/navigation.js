import { obtenerSesionActiva } from "./pedidos";

export function obtenerVistaInicial() {
  const ruta = window.location.pathname.replace(/\/$/, "") || "/";
  const adminActivo = obtenerSesionActiva("rafikiAdminActivo");

  if (ruta === "/admin") {
    return adminActivo ? "admin" : "adminLogin";
  }

  if (ruta === "/pedido" || ruta === "/cliente") {
    return "cliente";
  }

  if (ruta === "/mesas") {
    return "mesas";
  }

  return "inicio";
}

export function actualizarRuta(ruta) {
  if (window.location.pathname !== ruta) {
    window.history.pushState({}, "", ruta);
  }
}
