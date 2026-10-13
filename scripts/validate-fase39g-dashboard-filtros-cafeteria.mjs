import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const build = read("src/config/rafikiBuild.js");
const compacta = read("src/modules/mesas/components/PanelMesasCompacto.jsx");
const panelMesas = read("src/modules/mesas/components/PanelMesas.jsx");
const dashboard = read("src/modules/dashboard/components/VentasMensualesDashboard.jsx");
const filtros = read("src/modules/dashboard/components/VentasMensualesFiltros.jsx");
const util = read("src/modules/dashboard/utils/ventasMensuales.js");
const css = read("src/styles/app.css");

const checks = [
  ["Versión 128.7 / Fase 39G", (build.includes("128.7-FASE39G") || (build.includes("128.8-FASE39H") || build.includes("128.9-FASE39H1")))],
  ["Modal Cafetería Compacta deja dos acciones finales", compacta.includes("Agregar otro producto") && compacta.includes("Agregar y ver resumen")],
  ["Se eliminan acciones redundantes del footer compacto", !compacta.includes(">Volver a categorías</button>") && !compacta.includes(">Ver resumen</button>")],
  ["Cafetería Compacta usa acción genérica validada", compacta.includes("onAgregarCafeteriaActual") && panelMesas.includes("function agregarCafeteriaActual")],
  ["Acceso único a resumen muestra cantidad", compacta.includes("🛒 Ver resumen ({cantidadProductosResumen})")],
  ["Dashboard ofrece filtro por categoría", filtros.includes("Todas las categorías") && dashboard.includes("categoriaFiltro")],
  ["Dashboard permite múltiples productos", filtros.includes("productosSeleccionados.map") && dashboard.includes("alternarProductoFiltro")],
  ["Productos se pueden buscar y limpiar", filtros.includes('type="search"') && filtros.includes("Limpiar filtros")],
  ["Calendario se recalcula con filtros", dashboard.includes("crearResumenVentasMensuales(pedidos, gastos, mes, filtrosVentas)")],
  ["Vista filtrada usa unidades en lugar de prorratear gastos", dashboard.includes('etiqueta="Unidades vendidas"') && dashboard.includes("Los gastos no se prorratean")],
  ["Existe comparación por varios productos", dashboard.includes("crearComparacionProductosMensual") && filtros.includes("Comparación por producto")],
  ["Parfait se consolida por tamaño y no por frutas", util.includes('return `Parfait ${textoLimpio(item.tamano)}`')],
  ["Filtros derivan categorías/productos de items reales", util.includes("obtenerCatalogoFiltrosVentas") && util.includes("obtenerCategoriaProductoVenta")],
  ["CSS oculta botones internos redundantes solo en modal compacto", css.includes(".mesas-compacta-cafeteria-modal-contenido .cafeteria-panel > .button.add-meal")],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}
console.log(`\n${ok}/${checks.length} controles Fase 39G aprobados.`);
if (ok !== checks.length) process.exit(1);
