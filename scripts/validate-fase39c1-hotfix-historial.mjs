import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const app = read("src/App.jsx");
const admin = read("src/modules/admin/components/layout/AdminHeaderTabs.jsx");
const auth = read("src/shared/hooks/useAuthAdmin.js");
const build = read("src/config/rafikiBuild.js");

const checks = [
  ["Build conserva hotfix 128.3 o una versión posterior", build.includes("128.3-FASE39C1-HOTFIX-HISTORIAL-MENU-ADMIN") || build.includes("128.4-FASE39D") || build.includes("128.5-FASE39E") || (build.includes("128.6-FASE39F") || (build.includes("128.7-FASE39G") || (build.includes("128.8-FASE39H") || build.includes("128.9-FASE39H1"))))],
  ["Botón Historial cambia a historialMenu", admin.includes('setAdminTab("historialMenu")')],
  ["historialMenu está en ADMIN_TABS_VALIDAS", auth.includes('"historialMenu"')],
  ["Historial reutiliza permiso generador", auth.includes('adminTab === "historialMenu" ? "generador"')],
  ["App renderiza Historial independiente", app.includes('adminTab === "historialMenu"') && app.includes('pestanaInicial="historial"')],
  ["Generador conserva su pestaña propia", app.includes('adminTab === "generador"') && app.includes('pestanaInicial="generador"')],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}
console.log(`\n${ok}/${checks.length} controles hotfix Historial aprobados.`);
if (ok !== checks.length) process.exit(1);
