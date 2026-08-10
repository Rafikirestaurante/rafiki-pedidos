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
function existe(ruta) { return fs.existsSync(path.join(ROOT, ruta)); }
function leer(ruta) { return fs.readFileSync(path.join(ROOT, ruta), "utf8"); }

const version = obtenerVersionBuild();
const diagnostico = leer("src/modules/dashboard/components/DiagnosticoRafiki.jsx");
const utilDiagnostico = leer("src/shared/utils/diagnosticoRafiki.js");
const resumen = leer("src/shared/utils/resumenPedidoDisplay.js");
const resumenItem = leer("src/shared/components/ResumenPedidoItem.jsx");
const app = leer("src/App.jsx");
const packageJson = JSON.parse(leer("package.json"));

controlar("Versión 127.7 o posterior", versionRafikiEsAlMenos(version, "127.7"), version);
controlar("Utilidad de diagnóstico separada", existe("src/shared/utils/diagnosticoRafiki.js"));
controlar("Estilos de diagnóstico separados", existe("src/modules/dashboard/styles/diagnosticoRafiki.css"));
controlar("Diagnóstico muestra versión instalada y publicada", diagnostico.includes("RAFIKI_BUILD.version") && diagnostico.includes("consultarVersionRemota"));
controlar("Diagnóstico revisa PWA, caché y Supabase", diagnostico.includes("getRegistration") && diagnostico.includes("window.caches.keys") && diagnostico.includes('supabase.from("pedidos")'));
controlar("Diagnóstico muestra sincronización y errores", diagnostico.includes("Última sincronización") && diagnostico.includes("Último error") && diagnostico.includes("leerUltimaSincronizacionDiagnostico"));
controlar("Diagnóstico permite copiar informe técnico", diagnostico.includes("Copiar informe") && diagnostico.includes("crearInformeTecnicoDiagnostico") && utilDiagnostico.includes("RAFIKI PEDIDOS — INFORME TÉCNICO"));
controlar("App registra sincronización de pedidos", app.includes("registrarSincronizacionDiagnostico") && app.includes('origen: "Pedidos"'));
controlar("Resumen unifica Parfait, Batidos y Jugos tradicionales", resumen.includes("esParfaitResumen") && resumen.includes("esBatidoResumen") && resumen.includes("esJugoTradicionalResumen"));
controlar("Batidos no repiten el tipo genérico", resumen.includes("productoSinTipo") && resumen.includes("batido refrescante") && resumen.includes("batido cremoso"));
controlar("Resumen compartido usa el nombre canónico", resumenItem.includes("obtenerNombreCafeteria") && resumenItem.includes("esJugoTradicionalResumen"));
controlar("Pruebas de diagnóstico", existe("src/shared/utils/__tests__/diagnosticoRafiki.test.js"));
controlar("Pruebas del resumen", existe("src/shared/utils/__tests__/resumenPedidoDisplay.test.js"));
controlar("Existe comando diagnostic:check", packageJson.scripts?.["diagnostic:check"] === "node scripts/validate-diagnostico-resumen.mjs");

for (const control of controles) console.log(`${control.correcto ? "✓" : "✗"} ${control.nombre}${control.detalle ? ` — ${control.detalle}` : ""}`);
if (errores.length) {
  console.error(`\nValidación de diagnóstico y resumen FALLÓ: ${errores.length} problema(s).`);
  process.exit(1);
}
console.log("\nValidación de diagnóstico técnico y resumen de Cafetería OK.");
