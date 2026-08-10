import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const node = process.execPath;

const pasos = [
  { nombre: "Metadatos y lock", comando: node, args: ["scripts/validate-project-metadata.mjs"] },
  { nombre: "ESLint sin advertencias", comando: npm, args: ["run", "lint"] },
  { nombre: "Pruebas automáticas", comando: npm, args: ["test"] },
  { nombre: "Flujos financieros críticos", comando: npm, args: ["run", "financial-flows:check"] },
  { nombre: "Modales y mensajes uniformes", comando: npm, args: ["run", "feedback:check"] },
  { nombre: "Compilación de producción", comando: npm, args: ["run", "build"] },
  { nombre: "Rendimiento y división del paquete", comando: npm, args: ["run", "performance:check"] },
  { nombre: "Modularización progresiva", comando: npm, args: ["run", "modularization:check"] },
  { nombre: "Diagnóstico técnico y resumen Cafetería", comando: npm, args: ["run", "diagnostic:check"] },
  { nombre: "Resumen y comandas Cafetería", comando: npm, args: ["run", "cafeteria-summary:check"] },
  { nombre: "PWA", comando: npm, args: ["run", "pwa:check"] },
  { nombre: "Dashboard ventas y gastos", comando: npm, args: ["run", "dashboard-ventas:check"] },
  { nombre: "Dashboard barras", comando: npm, args: ["run", "dashboard-barras:check"] },
  { nombre: "Dashboard calendario móvil con zoom", comando: npm, args: ["run", "dashboard-mobile-zoom:check"] },
  { nombre: "Filtros de insumos y llave de transferencia", comando: npm, args: ["run", "fase37c:check"] },
  { nombre: "Adicionales con cantidades en Mesas", comando: npm, args: ["run", "fase37d:check"] },
  { nombre: "Selector Normal y Compacta operativa en Mesas", comando: npm, args: ["run", "fase37e:check"] },
  { nombre: "Flujo compacto con Datos y envío debajo del resumen", comando: npm, args: ["run", "fase37e2:check"] },
  { nombre: "Control de insumos por jornada AM/PM", comando: npm, args: ["run", "fase37f:check"] },
  { nombre: "Clientes especiales", comando: npm, args: ["run", "clientes-especiales:check"] },
  { nombre: "Registro de clientes", comando: npm, args: ["run", "registro-clientes:check"] },
  { nombre: "Cliente para llevar", comando: npm, args: ["run", "cliente-para-llevar:check"] },
  { nombre: "Térmico reportes", comando: npm, args: ["run", "thermal-reports:check"] },
  { nombre: "Térmico Pedidos Hoy", comando: npm, args: ["run", "thermal-pedidos-hoy:check"] },
  { nombre: "Térmico Caja", comando: npm, args: ["run", "thermal-caja:check"] },
  { nombre: "Térmico Gastos y Cartera", comando: npm, args: ["run", "thermal-gastos-cartera:check"] },
  { nombre: "Selector térmico", comando: npm, args: ["run", "thermal-selector:check"] },
  { nombre: "Tablas térmicas", comando: npm, args: ["run", "thermal-tabla:check"] },
  { nombre: "Cierre térmico", comando: npm, args: ["run", "thermal-cierre:check"] },
  { nombre: "Ahorro de papel", comando: npm, args: ["run", "thermal-ahorro:check"] },
  { nombre: "Contraste térmico", comando: npm, args: ["run", "thermal-contraste:check"] }
];

const resultados = [];

console.log("\n=== Verificación integral Rafiki Pedidos ===\n");

for (const [indice, paso] of pasos.entries()) {
  console.log(`\n[${indice + 1}/${pasos.length}] ${paso.nombre}`);
  const resultado = spawnSync(paso.comando, paso.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  });

  const correcto = resultado.status === 0;
  resultados.push({ nombre: paso.nombre, correcto });
  console.log(correcto ? `✓ ${paso.nombre}` : `✗ ${paso.nombre}`);
}

const fallidos = resultados.filter((resultado) => !resultado.correcto);

console.log("\n=== Resultado ===");
console.log(`${resultados.length - fallidos.length}/${resultados.length} verificaciones aprobadas.`);

if (fallidos.length) {
  console.error("Fallaron:");
  fallidos.forEach((resultado) => console.error(`- ${resultado.nombre}`));
  process.exit(1);
}

console.log("Verificación integral completada sin errores.");
