import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const build = read("src/config/rafikiBuild.js");
const app = read("src/App.jsx");
const admin = read("src/modules/admin/components/layout/AdminHeaderTabs.jsx");
const generador = read("src/modules/catalogo/components/GeneradorMenu.jsx");
const generadorUtils = read("src/modules/catalogo/utils/generadorMenuViewUtils.js");
const adicionales = read("src/modules/mesas/components/AdicionalesMesas.jsx");
const mesas = read("src/modules/mesas/components/PanelMesas.jsx");
const authAdmin = read("src/shared/hooks/useAuthAdmin.js");

const indiceGenerador = admin.indexOf('setAdminTab("generador")');
const indiceHistorial = admin.indexOf('setAdminTab("historialMenu")');

const checks = [
  ["La revisión conserva Fase 39C o su hotfix", (build.includes("128.3-FASE39C1") || build.includes("128.4-FASE39D") || build.includes("128.5-FASE39E") || (build.includes("128.6-FASE39F") || (build.includes("128.7-FASE39G") || (build.includes("128.8-FASE39H") || build.includes("128.9-FASE39H1")))))],
  ["Adicionales Restaurante usa RafikiModal", adicionales.includes('title="🍟 Adicionales Restaurante"') && adicionales.includes("<RafikiModal")],
  ["Adicionales Cafetería usa RafikiModal", adicionales.includes('title="➕ Adicionales Cafetería"') && adicionales.includes("abrirAutomaticamente")],
  ["Restaurante abre el listado modal cerrado por defecto", mesas.includes("setAdicionalesRestauranteAbiertos] = useState(false)")],
  ["Historial de menú está registrado como pestaña Admin válida", authAdmin.includes('"historialMenu"') && authAdmin.includes('ADMIN_TABS_VALIDAS')],
  ["Historial de menú hereda el permiso del Generador", authAdmin.includes('adminTab === "historialMenu" ? "generador" : adminTab')],
  ["Generador e Historial son pestañas Admin hermanas", indiceGenerador >= 0 && indiceHistorial > indiceGenerador && admin.includes("Historial de menú")],
  ["El Generador ya no tiene subtabs internas", !generador.includes("generador-subtabs") && !generador.includes("setPestanaGenerador")],
  ["Historial puede enviar un registro al Generador superior", generador.includes("abrirRegistroEnGenerador") && generador.includes("onIrGenerador?.()") && app.includes('onIrGenerador={() => setAdminTab("generador")}')],
  ["Rotación usa una única ventana de 5 días", generador.includes("const DIAS_RECIENTES = 5") && !generador.includes('dias: 10')],
  ["El último uso se calcula con todo el historial", generador.includes("crearMapaUltimoUsoMenu(historial)") && generadorUtils.includes("crearMapaUltimoUsoMenu")],
  ["No usados se ordenan por antigüedad", generador.includes("ordenarProductosPorUltimoUso") && generadorUtils.includes("if (!fechaA && fechaB) return -1") && generadorUtils.includes("fechaA.localeCompare(fechaB)")],
  ["Usados recientemente y no usados usan la misma regla de 5 días", generador.includes("fechaDentroDeRangoMenu(ultimoUso, DIAS_RECIENTES)") && generador.includes("!fechaDentroDeRangoMenu(ultimoUso, DIAS_RECIENTES)")],
  ["Los productos nunca usados quedan primero", generadorUtils.includes("Nunca usados primero")],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}

console.log(`\n${ok}/${checks.length} controles Fase 39C aprobados.`);
if (ok !== checks.length) process.exit(1);
