import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const build = read("src/config/rafikiBuild.js");
const app = read("src/App.jsx");
const nav = read("src/shared/components/NavegacionInterna.jsx");
const compacto = read("src/modules/mesas/components/PanelMesasCompacto.jsx");
const mesas = read("src/modules/mesas/components/PanelMesas.jsx");
const admin = read("src/modules/admin/components/layout/AdminHeaderTabs.jsx");
const gerencia = read("src/modules/gerencia/components/GerenciaPanel.jsx");
const css = read("src/styles/app.css");

const ordenNav = ["Mesas", "Pedidos hoy", "Admin", "Gerencia"];
const indicesNav = ordenNav.map((texto) => nav.indexOf(`label: "${texto}"`));
const ordenCorrecto = indicesNav.every((indice, i) => indice >= 0 && (i === 0 || indice > indicesNav[i - 1]));

const checks = [
  ["La línea 128 conserva las mejoras de Fase 39B", /128\.\d+-FASE39/.test(build)],
  ["Compacta abre Restaurante por defecto", compacto.includes('useState("restaurante")')],
  ["Restaurante y Cafetería están al mismo nivel", compacto.includes('className="mesas-compacta-lineas"') && compacto.includes("<strong>Restaurante</strong>") && compacto.includes("<strong>Cafetería</strong>")],
  ["Cafetería se mantiene dentro de la vista Compacta", compacto.includes("contenidoCafeteria") && mesas.includes("contenidoCafeteria={contenidoCafeteriaMesa}") && !compacto.includes("onAbrirNormalCategoria")],
  ["Adicionales Restaurante siguen dentro de Compacta", compacto.includes("contenidoAdicionalesRestaurante") && mesas.includes("contenidoAdicionalesRestaurante={contenidoAdicionalesRestauranteMesa}")],
  ["La navegación interna tiene orden fijo Mesas, Pedidos hoy, Admin, Gerencia", ordenCorrecto],
  ["La barra interna se monta una sola vez desde App", app.includes("<NavegacionInterna") && app.includes("VISTAS_NAVEGACION_INTERNA")],
  ["La barra se aplica a Mesas, Pedidos, Admin, Gerencia e Inventario", app.includes('["mesas", "pedidos", "admin", "gerencia", "inventario"]')],
  ["Gerencia permanece visible pero respeta permiso", nav.includes("habilitada: puedeVerGerencia") && nav.includes("disabled={!opcion.habilitada}")],
  ["Admin ya no duplica navegación principal", !admin.includes('navegar("/mesas"') && !admin.includes('navegar("/pedidos"')],
  ["Gerencia ya no duplica navegación principal", !gerencia.includes('navegar("/mesas"') && !gerencia.includes('navegar("/pedidos"')],
  ["Los estilos igualan las dos líneas Compactas", css.includes(".mesas-compacta-lineas") && css.includes("grid-template-columns: repeat(2")],
  ["La navegación uniforme tiene estilo propio y estado activo", css.includes(".navegacion-interna") && css.includes(".nav button.active")],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}
console.log(`\n${ok}/${checks.length} controles Fase 39B aprobados.`);
if (ok !== checks.length) process.exit(1);
