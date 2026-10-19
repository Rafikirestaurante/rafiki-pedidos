import { VALOR_PARA_LLEVAR_DESAYUNO } from "../../src/data/menuAlmuerzos.js";
import * as opciones from "../../src/data/menuCafeteria.js";
const normalizar = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export class ErrorKiara extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function crearCatalogo(rows) {
  const productos = [];
  for (const row of rows) {
    if (normalizar(row.linea) !== "cafeteria" || row.activo === false || row.agotado === true) continue;
    const categoria = normalizar(row.categoria);
    const comunes = { categoria: row.categoria, opciones: {} };
    const bebidas = {
      "batidos cremosos": [
        "Batido cremoso",
        opciones.CAFETERIA_BATIDOS_CREMOSOS_TAMANOS,
        opciones.CAFETERIA_BATIDOS_BASES
      ],
      "batidos refrescantes": ["Batido refrescante", opciones.CAFETERIA_BATIDOS_REFRESCANTES_TAMANOS, null],
      "jugos tradicionales": [
        "Jugo tradicional",
        opciones.CAFETERIA_BATIDOS_REFRESCANTES_TAMANOS,
        opciones.CAFETERIA_JUGOS_BASES
      ]
    }[categoria];
    if (bebidas) {
      for (const tamano of bebidas[1])
        productos.push({
          ...comunes,
          id: `${row.id}:${tamano.nombre}`,
          nombre: `${bebidas[0]} ${row.nombre} ${tamano.nombre}`,
          producto: `${row.nombre} ${tamano.nombre}`,
          tipo: bebidas[0],
          tamano: tamano.nombre,
          precio: tamano.precio,
          opciones: bebidas[2] ? { base: bebidas[2] } : {}
        });
      continue;
    }
    if (!Number.isFinite(Number(row.precio)) || Number(row.precio) <= 0) continue;
    const p = {
      ...comunes,
      id: String(row.id),
      nombre: row.nombre,
      producto: row.nombre,
      tipo: row.categoria,
      precio: Number(row.precio)
    };
    if (categoria === "parfait" || normalizar(row.nombre).startsWith("parfait ")) {
      p.tipo = "Parfait";
      p.tamano = row.nombre.match(/\d+\s*oz/i)?.[0] || "";
      p.opciones = { frutas: opciones.CAFETERIA_FRUTAS };
      p.extraTerceraFruta = 1000;
    }
    if (
      categoria === "desayunos" &&
      opciones.CAFETERIA_DESAYUNOS.some((d) => normalizar(d.nombre) === normalizar(row.nombre))
    ) {
      p.tipo = "Desayuno";
      p.opciones = {
        acompanante: opciones.CAFETERIA_ACOMPANANTES_DESAYUNO,
        bebida: opciones.CAFETERIA_BEBIDAS_DESAYUNO
      };
    }
    if (normalizar(p.tipo).includes("desayuno")) {
      p.empaque = VALOR_PARA_LLEVAR_DESAYUNO;
      p.precio += p.empaque;
    }
    productos.push(p);
  }
  if (!productos.length)
    throw new ErrorKiara("El menú no está disponible en este momento. Inténtalo de nuevo.", 503);
  return productos;
}
export function validarCarrito(carrito, catalogo) {
  if (!Array.isArray(carrito) || carrito.length > 30)
    throw new ErrorKiara("El pedido admite hasta 30 productos diferentes.");
  let unidades = 0;
  return carrito.map((linea) => {
    const p = catalogo.find((p) => p.id === linea.productoId);
    if (!p)
      throw new ErrorKiara("Uno de los productos ya no está disponible. Abre el menú para elegir otro.");
    if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1 || linea.cantidad > 20)
      throw new ErrorKiara("Selecciona una cantidad entre 1 y 20.");
    unidades += linea.cantidad;
    if (unidades > 60) throw new ErrorKiara("El pedido admite hasta 60 unidades.");
    const elegidas = {};
    for (const [campo, valores] of Object.entries(p.opciones)) {
      const valor = linea.opciones?.[campo];
      if (campo === "frutas") {
        if (
          !Array.isArray(valor) ||
          valor.length < 1 ||
          valor.length > 3 ||
          new Set(valor).size !== valor.length ||
          valor.some((v) => !valores.includes(v))
        )
          throw new ErrorKiara(`Para ${p.nombre}, elige de una a tres frutas del menú.`);
        elegidas[campo] = valor;
      } else {
        if (!valores.includes(valor))
          throw new ErrorKiara(`Para ${p.nombre}, elige ${campo}: ${valores.join(", ")}.`);
        elegidas[campo] = valor;
      }
    }
    const extraFrutas = elegidas.frutas?.length === 3 ? 1000 : 0;
    const detalle = Object.entries(elegidas)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join(" · ");
    return {
      productoId: p.id,
      cantidad: linea.cantidad,
      opciones: elegidas,
      nombre: p.nombre,
      detalle,
      precio: p.precio + extraFrutas,
      tipo: p.tipo,
      empaque: p.empaque || 0,
      producto: p.producto,
      tamano: p.tamano || "",
      extraFrutas
    };
  });
}
export function crearItems(carrito) {
  return carrito.map((l, i) => ({
    id: `kiara-${i}`,
    categoria: "cafeteria",
    area: "cafeteria",
    tipo: l.tipo,
    producto: l.producto,
    plato: l.producto,
    proteina: l.producto,
    precio: l.precio - l.empaque,
    precioPlato: l.precio - l.empaque,
    precioProteina: l.precio - l.empaque,
    cantidad: l.cantidad,
    tamano: l.tamano,
    ...l.opciones,
    extraFrutas: l.extraFrutas,
    acompanantes: [],
    observacionAcompanantes: "",
    paraLlevar: true,
    detalle_impresion: `${l.nombre}${l.detalle ? " - " + l.detalle : ""}`,
    origen: "Kiara"
  }));
}
export function validarCliente(c) {
  const limpio = (v, min, max, nombre) => {
    if (
      typeof v !== "string" ||
      v.trim().length < min ||
      v.trim().length > max ||
      Array.from(v).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    )
      throw new ErrorKiara(`Revisa ${nombre}.`);
    return v.trim();
  };
  const nombre = limpio(c?.nombre, 2, 80, "tu nombre");
  const telefono = limpio(c?.telefono, 7, 25, "tu teléfono");
  if (!/^\+?[\d ()-]{7,25}$/.test(telefono) || telefono.replace(/\D/g, "").length < 7)
    throw new ErrorKiara("Revisa tu teléfono.");
  if (!["Efectivo", "Transferencia"].includes(c?.pago)) throw new ErrorKiara("Selecciona la forma de pago.");
  // Primera versión: recogida en el local, sin prometer domicilios ni tarifas desconocidas.
  return {
    nombre,
    telefono,
    pago: c.pago,
    notas: c.notas ? limpio(c.notas, 1, 300, "las observaciones") : ""
  };
}
export const totalCarrito = (cart) => cart.reduce((s, l) => s + l.precio * l.cantidad, 0);
