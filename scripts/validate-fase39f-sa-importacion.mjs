import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const util = read("src/shared/utils/generadorMenu.js");
const hook = read("src/shared/hooks/useMenuDiario.js");
const tab = read("src/modules/admin/tabs/MenuDiarioTab.jsx");
const build = read("src/config/rafikiBuild.js");

const checks = [
  ["Versión 128.6 / Fase 39F", (build.includes("128.6-FASE39F-SA-AUTOMATICO-ARROCES-PASTAS") || (build.includes("128.7-FASE39G") || (build.includes("128.8-FASE39H") || build.includes("128.9-FASE39H1"))))],
  ["Existe transformación SA dedicada", util.includes("aplicarSaAutomaticoArrocesPastas")],
  ["Detecta Pasta/Pastas", util.includes("/^pastas?\\b/")],
  ["Detecta Arroz/Arroces", util.includes("/^arro(?:z|ces)\\b/")],
  ["No duplica SA existente", util.includes("yaTieneSa")],
  ["La importación ejecuta el SA automático", hook.includes("aplicarSaAutomaticoArrocesPastas(ultimoTexto.platosTexto)")],
  ["La importación devuelve el listado afectado", hook.includes("return {\n      platosConSa")],
  ["Editar menú usa RafikiModal", tab.includes("<RafikiModal") && tab.includes('title="SA aplicado automáticamente"')],
  ["Modal lista platos marcados", tab.includes("platosSaAutomatico.map")],
  ["Modal explica que SA no es visible", tab.includes("no se muestra al cliente ni en las impresiones")]
];

let ok = 0;
for (const [label, passed] of checks) {
  if (passed) {
    ok += 1;
    console.log(`✅ ${label}`);
  } else {
    console.error(`❌ ${label}`);
  }
}
console.log(`\n${ok}/${checks.length} controles Fase 39F aprobados.`);
if (ok !== checks.length) process.exit(1);
