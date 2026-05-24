import {
  CAFETERIA_BATIDOS_CREMOSOS_SABORES,
  CAFETERIA_BATIDOS_REFRESCANTES_SABORES,
  CAFETERIA_BEBIDAS_CALIENTES,
  CAFETERIA_DESAYUNOS,
  CAFETERIA_JUGOS_TRADICIONALES_SABORES,
  CAFETERIA_POSTRES,
  CAFETERIA_SANDWICHES
} from "./menuCafeteria";

function normalizarId(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function crearProductoCatalogo(nombre, categoria, precio = "", linea = "Cafetería", orden = 0) {
  return {
    id: `${normalizarId(linea)}-${normalizarId(categoria)}-${normalizarId(nombre)}`,
    catalogoId: null,
    linea,
    categoria,
    nombre,
    precio: precio === "" || precio == null ? "" : Number(precio),
    activo: true,
    orden,
    origenCatalogo: "local"
  };
}

export const PRODUCTOS_CATALOGO_FALLBACK = [
  crearProductoCatalogo("Parfait 12 oz", "Parfait", 12500, "Cafetería", 1),
  crearProductoCatalogo("Parfait 16 oz", "Parfait", 16000, "Cafetería", 2),
  crearProductoCatalogo("Parfait 22 oz", "Parfait", 19000, "Cafetería", 3),
  ...CAFETERIA_DESAYUNOS.map((p, index) => crearProductoCatalogo(p.nombre, "Desayunos", p.precio, "Cafetería", 10 + index)),
  ...CAFETERIA_SANDWICHES.map((p, index) => crearProductoCatalogo(p.nombre, "Sándwiches y fritos", p.precio, "Cafetería", 30 + index)),
  ...CAFETERIA_POSTRES.map((p, index) => crearProductoCatalogo(p.nombre, "Postres y ensaladas", p.precio, "Cafetería", 50 + index)),
  ...CAFETERIA_BEBIDAS_CALIENTES.map((p, index) => crearProductoCatalogo(p.nombre, "Bebidas", p.precio, "Cafetería", 70 + index)),
  ...CAFETERIA_BATIDOS_CREMOSOS_SABORES.map((nombre, index) => crearProductoCatalogo(nombre, "Batidos cremosos", "", "Cafetería", 90 + index)),
  ...CAFETERIA_BATIDOS_REFRESCANTES_SABORES.map((nombre, index) => crearProductoCatalogo(nombre, "Batidos refrescantes", "", "Cafetería", 120 + index)),
  ...CAFETERIA_JUGOS_TRADICIONALES_SABORES.map((nombre, index) => crearProductoCatalogo(nombre, "Jugos tradicionales", "", "Cafetería", 150 + index)),
  crearProductoCatalogo("Pechuga asada sin salsa", "Platos", 16000, "Restaurante", 200),
  crearProductoCatalogo("Cerdo asado sin salsa", "Platos", 16000, "Restaurante", 201),
  crearProductoCatalogo("Sopas medianas sin arroz", "Sopas", 7000, "Restaurante", 210),
  crearProductoCatalogo("Sopas medianas con arroz", "Sopas", 9000, "Restaurante", 211),
  crearProductoCatalogo("Sancocho de pollo con arroz", "Sopas", 15000, "Restaurante", 212),
  crearProductoCatalogo("Papas Fritas", "Adicionales almuerzo", 5000, "Restaurante", 220),
  crearProductoCatalogo("Porción de Pechuga o cerdo", "Adicionales almuerzo", 7000, "Restaurante", 221)
];
