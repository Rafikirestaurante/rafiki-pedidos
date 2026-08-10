import fs from "node:fs";
import path from "node:path";
import { ROOT, obtenerVersionBuild, versionRafikiEsAlMenos } from "./validation-utils.mjs";
import {
  nombreCafeteriaResumen,
  obtenerNombreCafeteria
} from "../src/shared/utils/resumenPedidoDisplay.js";

const errores = [];
const controles = [];

function check(nombre, condicion, detalle = "") {
  const correcto = Boolean(condicion);
  controles.push({ nombre, correcto, detalle });
  if (!correcto) errores.push(`${nombre}${detalle ? `: ${detalle}` : ""}`);
}

function leer(ruta) {
  return fs.readFileSync(path.join(ROOT, ruta), "utf8");
}

const version = obtenerVersionBuild();
const resumenItem = leer("src/shared/components/ResumenPedidoItem.jsx");
const pedidos = leer("src/shared/utils/pedidos.js");
const admin = leer("src/modules/pedidos/components/PedidosAdmin.jsx");
const cartera = leer("src/modules/cartera/utils/carteraViewUtils.js");
const mesas = leer("src/modules/mesas/components/PanelMesas.jsx");

const parfait = {
  categoria: "cafeteria",
  area: "cafeteria",
  tipo: "Parfait",
  producto: "Parfait Parfait 12 oz - Frutas: Banano, Arándanos, Uva",
  tamano: "12 oz",
  frutas: ["Banano", "Arándanos", "Uva"]
};
const parfaitCatalogoMesas = {
  categoria: "cafeteria",
  area: "cafeteria",
  tipo: "Parfait",
  producto: "Parfait Parfait 12 oz - Frutas: Fresa, Banano",
  tamano: "Parfait 12 oz",
  frutas: ["Fresa", "Banano"]
};
const parfaitCategoriaCliente = {
  categoria: "Parfait",
  tipo: "Parfait",
  producto: "Parfait 12 oz - Frutas: Fresa, Banano",
  tamano: "Parfait 12 oz",
  frutas: ["Fresa", "Banano"]
};
const jugo = {
  categoria: "cafeteria",
  area: "cafeteria",
  tipo: "Jugo tradicional",
  producto: "Fresa 12 oz",
  tamano: "12 oz",
  base: "Agua"
};
const cremoso = {
  categoria: "cafeteria",
  area: "cafeteria",
  tipo: "Batido cremoso",
  producto: "Batido cremoso Milo 12 oz",
  tamano: "12 oz",
  base: "Helado"
};

check("Versión 127.10 o posterior", versionRafikiEsAlMenos(version, "127.10"), version);
check("Parfait heredado no duplica nombre", obtenerNombreCafeteria(parfait) === "Parfait 12 oz · Banano, Arándanos, Uva", obtenerNombreCafeteria(parfait));
check("Parfait de /mesas limpia tamaño proveniente del catálogo", obtenerNombreCafeteria(parfaitCatalogoMesas) === "Parfait 12 oz · Fresa, Banano", obtenerNombreCafeteria(parfaitCatalogoMesas));
check("Parfait de /cliente se reconoce aunque categoría sea Parfait", obtenerNombreCafeteria(parfaitCategoriaCliente) === "Parfait 12 oz · Fresa, Banano", obtenerNombreCafeteria(parfaitCategoriaCliente));
check("Jugo tradicional integra base en una línea", obtenerNombreCafeteria(jugo) === "Fresa 12 oz · Agua", obtenerNombreCafeteria(jugo));
check("Batido cremoso elimina tipo genérico", obtenerNombreCafeteria(cremoso) === "Milo 12 oz", obtenerNombreCafeteria(cremoso));
check("Jugo está cubierto por regla especial", nombreCafeteriaResumen(jugo) === "Fresa 12 oz · Agua");
check("Resumen visual usa nombre canónico", resumenItem.includes("obtenerNombreCafeteria(item)") && resumenItem.includes("esJugoTradicionalResumen"));
check("/mesas normaliza el tamaño del Parfait antes de crear el item", mesas.includes("tamanoParfaitLimpio") && mesas.includes("producto: descripcionParfait") && mesas.includes("tamano: tamanoParfaitLimpio"));
check("Factory de Cafetería limpia Parfait antes de guardar", pedidos.includes("productoNormalizado") && pedidos.includes("replace(/^(?:parfait\\s+){2,}/i, \"Parfait \")") && pedidos.includes("extraNormalizado.tamano"));
check("Texto persistido usa nombre canónico", pedidos.includes("const nombreProducto = obtenerNombreCafeteria(item)") && !pedidos.includes("Cafetería: ${item.tipo}"));
check("Comanda térmica usa nombre canónico", pedidos.includes("const nombreCafeteria = textoMayusculasTicket(obtenerNombreCafeteria(item))") && pedidos.includes("productos.push(`${cantidad} ${nombreCafeteria}`)"));
check("Comanda no repite base del jugo", pedidos.includes("if (!jugoTradicional && item.base)"));
check("Pedidos Hoy usa nombre canónico", admin.includes("return obtenerNombreCafeteria(item)") && admin.includes("return `${cantidad} x ${nombre}${precioTexto}`"));
check("Cartera usa nombre canónico", cartera.includes("obtenerNombreCafeteria(item)"));

for (const control of controles) {
  console.log(`${control.correcto ? "✓" : "✗"} ${control.nombre}${control.detalle ? ` — ${control.detalle}` : ""}`);
}

if (errores.length) {
  console.error(`\nValidación resumen/comandas Cafetería FALLÓ: ${errores.length} problema(s).`);
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("\nValidación resumen/comandas Cafetería OK.");
