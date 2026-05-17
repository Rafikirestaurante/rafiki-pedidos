const ROL_POR_DEFECTO = "usuario";

export const ROLES_ADMIN = {
  ADMIN: "admin",
  USUARIO: "usuario",
};

export const NOMBRES_ROLES = {
  admin: "Administrador",
  usuario: "Usuario",
};

const PERMISOS_POR_ROL = {
  admin: ["pedidos", "menu", "productos", "generador", "rafa", "eliminar_pedido", "cambiar_estado", "finalizar_pendientes"],
  usuario: ["pedidos", "menu", "productos", "generador", "cambiar_estado", "finalizar_pendientes"],
};

function limpiarRol(valor) {
  return String(valor || "").trim().toLowerCase();
}

export function obtenerRolUsuario(usuario) {
  const metadata = usuario?.user_metadata || {};
  const appMetadata = usuario?.app_metadata || {};
  const rol = limpiarRol(metadata.rol || metadata.role || appMetadata.rol || appMetadata.role);
  return PERMISOS_POR_ROL[rol] ? rol : ROL_POR_DEFECTO;
}

export function nombreRol(rol) {
  return NOMBRES_ROLES[rol] || NOMBRES_ROLES[ROL_POR_DEFECTO];
}

export function usuarioPuede(rol, permiso) {
  return Boolean(PERMISOS_POR_ROL[rol]?.includes(permiso));
}

export function primeraPestanaPermitida(rol) {
  const orden = ["pedidos", "menu", "productos", "generador", "rafa"];
  return orden.find((permiso) => usuarioPuede(rol, permiso)) || "pedidos";
}

export function describirActor(usuario, respaldo = "Clave local") {
  if (usuario?.email) return usuario.email;
  return respaldo;
}
