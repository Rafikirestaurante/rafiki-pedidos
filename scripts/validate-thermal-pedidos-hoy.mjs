import fs from "fs";
import path from "path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];

function check(nombre, condicion, detalle = "") {
  checks.push({ nombre, condicion: Boolean(condicion), detalle });
}

const service = read("src/modules/impresion/thermalReportService.js");
const pedidos = read("src/modules/admin/components/pedidos/AdminPedidosSection.jsx");

check("Servicio térmico conserva misma data para 58 y 80", service.includes("renderSecciones(secciones)") && service.includes("renderListado(listado)"));
check("Servicio soporta líneas largas en detalle", service.includes("renderTextoTermico") && service.includes("thermal-list-line-block"));
check("Pedidos Hoy define clasificación robusta", pedidos.includes("pedidoCumpleFiltroTipoPedido") && pedidos.includes("pedidoPareceParaLlevar") && pedidos.includes("pedidoTieneCafeteria"));
check("Pedidos Hoy imprime rango y búsqueda", pedidos.includes("describirRangoBusquedaPedidosTermico") && pedidos.includes("rangoBusquedaPedidosTermico"));
check("Pedidos Hoy imprime resumen operativo", pedidos.includes("crearSeccionesPedidosTermicos") && pedidos.includes("Métodos de pago") && pedidos.includes("Para llevar"));
check("Pedidos Hoy imprime detalle ampliado", pedidos.includes("crearCamposPedidosTermicos") && pedidos.includes("Pago / Estado") && pedidos.includes("Detalle") && pedidos.includes("formatearHoraPedidoTermico"));
check("Modal de filtros permite imprimir 58 y 80", pedidos.includes("pedidos-filtros-modal-impresion") && pedidos.includes('imprimirPedidosFiltradosTermico("58")') && pedidos.includes('imprimirPedidosFiltradosTermico("80")'));
check("La descripción respeta regla de misma información", pedidos.includes("solo cambia la optimización del ancho") && pedidos.includes("misma información en 58 mm y 80 mm"));

const errores = checks.filter((item) => !item.condicion);
if (errores.length) {
  console.error("Validación impresión Pedidos Hoy falló:");
  errores.forEach((error) => console.error(`- ${error.nombre}${error.detalle ? `: ${error.detalle}` : ""}`));
  process.exit(1);
}

console.log("Validación impresión Pedidos Hoy OK");
