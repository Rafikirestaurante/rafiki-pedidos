import fs from "fs";
import path from "path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const service = read("src/modules/impresion/thermalReportService.js");
const pkg = JSON.parse(read("package.json"));
const checks = [];

function check(nombre, condicion) {
  checks.push({ nombre, condicion: Boolean(condicion) });
}

check("Usa fuente monoespaciada tipo térmica", service.includes('font-family: "Courier New", "Lucida Console", monospace'));
check("No fuerza negrita en impresión térmica", service.includes("strong, b { font-weight: 400; }") && service.includes("font-weight: 400"));
check("Evita bordes y separadores largos", service.includes("border: 0") && !service.includes("border-top: 1px dashed") && !service.includes("border-bottom: 1px dotted"));
check("Reduce márgenes y padding para ahorro de papel", service.includes('bodyPadding: "1px 0 2px"'));
check("Mantiene letra normal 1x1 equivalente en 58 mm", service.includes('fontSize: "12px"') && service.includes('tableFontSize: "12px"') && service.includes("thermal-pre-table"));
check("Mantiene la misma información para 58 y 80 mm", service.includes('pageSize: "58mm auto"') && service.includes('pageSize: "80mm auto"') && service.includes("renderListadoTabla") && service.includes("tableChars"));
check("package.json expone validador ahorro térmico", pkg.scripts?.["thermal-ahorro:check"] === "node scripts/validate-thermal-ahorro-papel.mjs");

const errores = checks.filter((item) => !item.condicion);
if (errores.length) {
  console.error("Validación ahorro térmico falló:");
  errores.forEach((error) => console.error(`- ${error.nombre}`));
  process.exit(1);
}

console.log("Validación ahorro térmico OK");
