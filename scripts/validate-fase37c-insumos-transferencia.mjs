import { readFileSync } from "node:fs";

const archivos = {
  solicitud: readFileSync("src/modules/catalogo/components/SolicitudProductos.jsx", "utf8"),
  utilidad: readFileSync("src/shared/utils/solicitudProductos.js", "utf8"),
  cliente: readFileSync("src/modules/cliente/components/PedidoCliente.jsx", "utf8"),
  clienteBeta: readFileSync("src/modules/cliente/components/PanelClienteBeta.jsx", "utf8"),
  transferencia: readFileSync("src/shared/components/TransferenciaPagoInfo.jsx", "utf8"),
  estilos: readFileSync("src/styles/app.css", "utf8"),
  build: readFileSync("src/config/rafikiBuild.js", "utf8")
};

const versionDetectada = archivos.build.match(/version:\s*"127\.(\d+)-/)?.[1];
const versionCompatible = Number(versionDetectada || 0) >= 13;

const controles = [
  ["Filtro Todo", archivos.utilidad.includes('TODO: "todo"')],
  ["Filtro AM", archivos.utilidad.includes('AM: "am"')],
  ["Filtro PM", archivos.utilidad.includes('PM: "pm"')],
  ["Filtro combinado", archivos.utilidad.includes('PM_ANTERIOR_AM_ACTUAL: "pm-anterior-am-actual"')],
  ["Cálculo día anterior", archivos.utilidad.includes("desplazarFechaISOColombia(fechaActual, -1)")],
  ["Combinación PM anterior y AM actual", archivos.utilidad.includes('fechaSolicitud === fechaAnterior && jornada === "PM"') && archivos.utilidad.includes('fechaSolicitud === fechaActual && jornada === "AM"')],
  ["Consulta Supabase de dos fechas", archivos.solicitud.includes('.in("fecha_solicitud", [desplazarFechaISOColombia(fecha, -1), fecha])')],
  ["Botón AM", archivos.solicitud.includes('[FILTROS_JORNADA_INSUMOS.AM, "AM"]')],
  ["Botón PM", archivos.solicitud.includes('[FILTROS_JORNADA_INSUMOS.PM, "PM"]')],
  ["Botón combinado", archivos.solicitud.includes('"PM anterior + AM actual"')],
  ["Resumen del filtro", archivos.solicitud.includes("descripcionFiltroPendientes")],
  ["Llave exacta", archivos.transferencia.includes('"0090381033"')],
  ["Botón copiar", archivos.transferencia.includes("Copiar llave") && archivos.transferencia.includes("clipboard.writeText")],
  ["Llave en cliente oficial", archivos.cliente.includes('tipoPago === "Transferencia" ? <TransferenciaPagoInfo />')],
  ["Llave en cliente beta", archivos.clienteBeta.includes('tipoPago === "Transferencia" ? <TransferenciaPagoInfo />')],
  ["Estilos filtros", archivos.estilos.includes(".insumos-filtros-jornada") && archivos.estilos.includes(".insumos-filtro-jornada.active")],
  ["Estilos transferencia", archivos.estilos.includes(".cliente-transferencia-info") && archivos.estilos.includes(".cliente-transferencia-boton")],
  ["Versión 127.13 o posterior", versionCompatible]
];

let fallos = 0;
for (const [nombre, correcto] of controles) {
  console.log(`${correcto ? "✓" : "✗"} ${nombre}`);
  if (!correcto) fallos += 1;
}

console.log(`\n${controles.length - fallos}/${controles.length} controles aprobados.`);
if (fallos) process.exit(1);
