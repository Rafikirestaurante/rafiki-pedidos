import fs from "node:fs";
import path from "node:path";
import { ROOT, obtenerVersionBuild, versionRafikiEsAlMenos } from "./validation-utils.mjs";

const errores = [];
const controles = [];

function controlar(nombre, condicion, detalle = "") {
  const correcto = Boolean(condicion);
  controles.push({ nombre, correcto, detalle });
  if (!correcto) errores.push(`${nombre}${detalle ? `: ${detalle}` : ""}`);
}

function existe(ruta) {
  return fs.existsSync(path.join(ROOT, ruta));
}

function leer(ruta) {
  return fs.readFileSync(path.join(ROOT, ruta), "utf8");
}

function tamanoKb(ruta) {
  return fs.statSync(path.join(ROOT, ruta)).size / 1024;
}

const version = obtenerVersionBuild();
const app = leer("src/App.jsx");
const lazyModules = leer("src/app/lazyModules.js");
const cartera = leer("src/modules/cartera/components/CarteraClientesCredito.jsx");
const packageJson = JSON.parse(leer("package.json"));

controlar("Versión 127.6 o posterior", versionRafikiEsAlMenos(version, "127.6"), version);
controlar("Registro de módulos diferidos separado", existe("src/app/lazyModules.js"));
controlar(
  "App consume el registro diferido",
  app.includes('from "./app/lazyModules"') && !app.includes("lazyConReintento("),
);
controlar(
  "Registro conserva los módulos críticos",
  ["PedidoCliente", "AdminPedidosSection", "GeneradorMenu", "PanelMesasPOS", "CajaAdmin"].every((nombre) =>
    lazyModules.includes(`export const ${nombre}`),
  ),
);

for (const ruta of [
  "src/modules/cartera/utils/carteraViewUtils.js",
  "src/modules/catalogo/utils/generadorMenuViewUtils.js",
  "src/modules/mesas/utils/catalogoMesas.js",
]) {
  controlar(`Utilidades separadas: ${path.basename(ruta)}`, existe(ruta));
}

controlar(
  "Modales de Cartera separados",
  existe("src/modules/cartera/components/CarteraModals.jsx") &&
    cartera.includes("<CarteraModals") &&
    !cartera.includes("<RafikiModal"),
);

const estilosSeparados = [
  ["src/modules/cartera/components/CarteraClientesCredito.jsx", "src/modules/cartera/styles/carteraClientesCredito.css"],
  ["src/modules/catalogo/components/GeneradorMenu.jsx", "src/modules/catalogo/styles/generadorMenu.css"],
  ["src/modules/gastos/components/GastosDiarios.jsx", "src/modules/gastos/styles/gastosDiarios.css"],
  ["src/modules/inventario/components/InventarioAdmin.jsx", "src/modules/inventario/styles/inventarioAdmin.css"],
];

for (const [componente, css] of estilosSeparados) {
  const codigo = leer(componente);
  controlar(
    `Estilos separados: ${path.basename(componente)}`,
    existe(css) && codigo.includes(path.basename(css)) && !codigo.includes("<style>{`"),
  );
}

const limites = [
  ["src/App.jsx", 50],
  ["src/modules/cartera/components/CarteraClientesCredito.jsx", 60],
  ["src/modules/catalogo/components/GeneradorMenu.jsx", 58],
  ["src/modules/mesas/components/PanelMesas.jsx", 60],
];
for (const [ruta, limite] of limites) {
  const kb = tamanoKb(ruta);
  controlar(`${path.basename(ruta)} bajo ${limite} KB`, kb <= limite, `${kb.toFixed(1)} KB`);
}

for (const ruta of [
  "src/modules/cartera/utils/__tests__/carteraViewUtils.test.js",
  "src/modules/catalogo/utils/__tests__/generadorMenuViewUtils.test.js",
  "src/modules/mesas/utils/__tests__/catalogoMesas.test.js",
]) {
  controlar(`Prueba de módulo: ${path.basename(ruta)}`, existe(ruta));
}

controlar(
  "Existe comando modularization:check",
  packageJson.scripts?.["modularization:check"] === "node scripts/validate-modularizacion-progresiva.mjs",
);

for (const control of controles) {
  console.log(`${control.correcto ? "✓" : "✗"} ${control.nombre}${control.detalle ? ` — ${control.detalle}` : ""}`);
}

if (errores.length) {
  console.error(`\nValidación de modularización FALLÓ: ${errores.length} problema(s).`);
  process.exit(1);
}

console.log("\nValidación de modularización progresiva OK.");
