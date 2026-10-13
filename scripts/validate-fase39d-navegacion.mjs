import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const build = read("src/config/rafikiBuild.js");
const admin = read("src/modules/admin/components/layout/AdminHeaderTabs.jsx");
const gerencia = read("src/modules/gerencia/components/GerenciaPanel.jsx");
const solicitud = read("src/modules/catalogo/components/SolicitudProductos.jsx");
const auth = read("src/shared/hooks/useAuthAdmin.js");
const app = read("src/App.jsx");
const nav = read("src/shared/components/NavegacionInterna.jsx");

const labelsAdmin = [
  "Pedidos hoy",
  "Editar menú diario",
  "Solicitud de insumos",
  "Insumos Pendientes",
  "Generador de menú",
  "Historial de menú",
];
const posicionesAdmin = labelsAdmin.map((label) => admin.indexOf(label));
const ordenAdminCorrecto = posicionesAdmin.every((pos, i) => pos >= 0 && (i === 0 || pos > posicionesAdmin[i - 1]));

const labelsGerencia = ["Informes", "Caja", "Gastos", "Cartera", "Inventario", "Ajustes"];
const posicionesGerencia = labelsGerencia.map((label) => gerencia.indexOf(`label: "${label}"`));
const ordenGerenciaCorrecto = posicionesGerencia.every((pos, i) => pos >= 0 && (i === 0 || pos > posicionesGerencia[i - 1]));

const bloqueTabsValidas = auth.slice(auth.indexOf("export const ADMIN_TABS_VALIDAS"), auth.indexOf("export function leerAdminTabGuardada"));

const checks = [
  ["Conserva Fase 39D en 128.4 o versión posterior", (build.includes("128.4-FASE39D") && build.includes("Fase 39D")) || build.includes("128.5-FASE39E") || (build.includes("128.6-FASE39F") || (build.includes("128.7-FASE39G") || (build.includes("128.8-FASE39H") || build.includes("128.9-FASE39H1"))))],
  ["Navegación principal conserva Mesas, Pedidos hoy, Admin y Gerencia", ["Mesas", "Pedidos hoy", "Admin", "Gerencia"].every((label) => nav.includes(`label: "${label}"`))],
  ["Admin muestra exactamente el orden operativo acordado", ordenAdminCorrecto],
  ["Admin ya no muestra Catálogo, Inventario, Caja ni Rafa", !admin.includes(">Catálogo<") && !admin.includes(">Inventario<") && !admin.includes(">Caja<") && !admin.includes(">Rafa<")],
  ["Insumos Pendientes es una pestaña Admin válida", auth.includes('"insumosPendientes"') && admin.includes('setAdminTab("insumosPendientes")')],
  ["Insumos Pendientes reutiliza permiso productos", auth.includes('adminTab === "insumosPendientes" ? "productos"')],
  ["Solicitud e Insumos Pendientes reutilizan el mismo componente", app.includes('<SolicitudProductos vistaInicial="solicitar" mostrarNavegacionInterna={false} />') && app.includes('<SolicitudProductos vistaInicial="pendientes" mostrarNavegacionInterna={false} />')],
  ["SolicitudProductos acepta apertura directa y oculta navegación interna", solicitud.includes('vistaInicial = "solicitar"') && solicitud.includes('mostrarNavegacionInterna = true') && solicitud.includes("{mostrarNavegacionInterna && (")],
  ["Gerencia muestra el orden acordado", ordenGerenciaCorrecto],
  ["Gerencia elimina Inicio y abre Informes", !gerencia.includes('{ id: "inicio"') && gerencia.includes('useState("informes")') && !gerencia.includes("tarjetasInicio")],
  ["Rutas principales no se modificaron", app.includes('vista === "admin"') && app.includes('vista === "gerencia"') && nav.includes('ruta: "/mesas"') && nav.includes('ruta: "/pedidos"') && nav.includes('ruta: "/admin"') && nav.includes('ruta: "/gerencia"')],
  ["Tabs antiguas de Admin no permanecen válidas", !bloqueTabsValidas.includes('"catalogo"') && !bloqueTabsValidas.includes('"inventario"') && !bloqueTabsValidas.includes('"caja"') && !bloqueTabsValidas.includes('"rafa"')],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}
console.log(`\n${ok}/${checks.length} controles Fase 39D aprobados.`);
if (ok !== checks.length) process.exit(1);
