import { readFileSync } from "node:fs";

const archivos = {
  solicitud: readFileSync("src/modules/catalogo/components/SolicitudProductos.jsx", "utf8"),
  utilidad: readFileSync("src/shared/utils/solicitudInsumosJornadas.js", "utf8"),
  utilidadGeneral: readFileSync("src/shared/utils/solicitudProductos.js", "utf8"),
  comunes: readFileSync("src/shared/components/common.jsx", "utf8"),
  pruebas: readFileSync("src/shared/utils/__tests__/solicitudProductosJornadas.test.js", "utf8"),
  build: readFileSync("src/config/rafikiBuild.js", "utf8")
};

const controles = [
  ["Clasificador exportado", archivos.utilidad.includes("export function clasificarProductosSolicitudPorJornada")],
  ["Comparación por jornada", archivos.utilidad.includes("jornadasPrevias.has(jornadaNormalizada)")],
  ["Jornada contraria", archivos.utilidad.includes('jornadaNormalizada === "AM" ? "PM" : "AM"')],
  ["Repetidos misma jornada", archivos.utilidad.includes("repetidosMismaJornada.push(producto)")],
  ["Repetidos jornada contraria", archivos.utilidad.includes("repetidosOtraJornada.push(producto)")],
  ["Productos permitidos", archivos.utilidad.includes("productosPermitidos.push(producto)")],
  ["Consulta solicitudes del día", archivos.solicitud.includes('.eq("fecha_solicitud", hoy)')],
  ["Consulta incluye insumos", archivos.solicitud.includes('.select("id, fecha_solicitud, insumos")')],
  ["Alerta misma jornada", archivos.solicitud.includes("Insumos repetidos en la")],
  ["Modal de una sola acción", archivos.solicitud.includes("mostrarCancelar: false")],
  ["Botón Continuar en repetidos", archivos.solicitud.includes('textoConfirmar: "Continuar"')],
  ["Confirmación jornada contraria", archivos.solicitud.includes("Confirmar segunda solicitud de insumos")],
  ["Botón Cancelar disponible", archivos.solicitud.includes('textoCancelar: "Cancelar"')],
  ["Omisión si todos están repetidos", archivos.solicitud.includes("No hay productos nuevos para guardar ni enviar por WhatsApp")],
  ["Mensaje WhatsApp filtrado", archivos.solicitud.includes("const mensajeFiltrado = crearMensajeSolicitudProductos")],
  ["Inserción filtrada", archivos.solicitud.includes(".insert(solicitudFiltrada)")],
  ["Máximo AM y PM visible", archivos.solicitud.includes("máximo una vez en AM y una vez en PM")],
  ["Modal reutilizable sin Cancelar", archivos.comunes.includes("mostrarCancelar = true") && archivos.comunes.includes("mostrarCancelar ?")],
  ["Pruebas AM/PM", archivos.pruebas.includes("omite productos repetidos dentro de la misma jornada") && archivos.pruebas.includes("permite una segunda solicitud en la jornada contraria")],
  ["Versión 127.18", archivos.build.includes("127.18-FASE37F-CONTROL-INSUMOS-AM-PM-2026-08-05")]
];

let fallos = 0;
for (const [nombre, correcto] of controles) {
  console.log(`${correcto ? "✓" : "✗"} ${nombre}`);
  if (!correcto) fallos += 1;
}

console.log(`\n${controles.length - fallos}/${controles.length} controles aprobados.`);
if (fallos) process.exit(1);
