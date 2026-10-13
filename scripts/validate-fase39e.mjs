import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const build = read("src/config/rafikiBuild.js");
const compacta = read("src/modules/mesas/components/PanelMesasCompacto.jsx");
const panelMesas = read("src/modules/mesas/components/PanelMesas.jsx");
const cartera = read("src/modules/cartera/components/CarteraModals.jsx");
const pedidos = read("src/modules/admin/components/pedidos/AdminPedidosSection.jsx");
const css = read("src/styles/app.css");

const posTabs = pedidos.indexOf('className="pedidos-hoy-tabs pedidos-hoy-tabs-superiores"');
const posFiltros = pedidos.indexOf('{mostrarFiltrosPedidos ? (');

const checks = [
  ["Versión 128.5 / Fase 39E", (build.includes("128.5-FASE39E-COMPACTA-ABONOS-PEDIDOS-HOY") || (build.includes("128.6-FASE39F") || (build.includes("128.7-FASE39G") || (build.includes("128.8-FASE39H") || build.includes("128.9-FASE39H1")))))],
  ["Compacta conserva Restaurante y Cafetería al mismo nivel", compacta.includes('setLineaActiva("restaurante")') && compacta.includes('setLineaActiva("cafeteria")')],
  ["Cafetería compacta usa selector propio de categorías", compacta.includes("mesas-compacta-cafeteria-categorias") && compacta.includes("abrirCategoriaCafeteria")],
  ["Detalle de Cafetería abre en modal compacto", compacta.includes("mesas-compacta-cafeteria-modal") && compacta.includes('title={`☕ Cafetería · ${categoriaCafeteriaActiva.titulo}`}')],
  ["PanelMesas comparte estado de subcategoría con Compacta", panelMesas.includes("subcategoriaCafeteria={subcategoriaCafeteria}") && panelMesas.includes("onSeleccionarSubcategoriaCafeteria")],
  ["Registrar abono acepta solo dígitos sin type number", cartera.includes('inputMode="numeric"') && cartera.includes('placeholder="Ej. 100500"') && !cartera.includes('step="100"')],
  ["Editar abono aplica la misma entrada exacta", (cartera.match(/inputMode="numeric"/g) || []).length >= 2 && (cartera.match(/replace\(\/\\D\/g, ""\)/g) || []).length >= 2],
  ["Pedidos/Mesas/Borrados están antes de filtros", posTabs >= 0 && posFiltros >= 0 && posTabs < posFiltros],
  ["Tabs de Pedidos Hoy tienen estilo superior sticky", css.includes(".pedidos-hoy-tabs-superiores") && css.includes("position: sticky")],
  ["No cambia rutas ni requiere SQL para Fase 39E", !build.toLowerCase().includes("sql")],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}
console.log(`\n${ok}/${checks.length} controles Fase 39E aprobados.`);
if (ok !== checks.length) process.exit(1);
