import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const panel = read("src/modules/mesas/components/PanelMesas.jsx");
const compacto = read("src/modules/mesas/components/PanelMesasCompacto.jsx");
const selector = read("src/modules/mesas/components/SelectorVistaMesas.jsx");
const resumenNormal = read("src/modules/mesas/components/ResumenMesaNormal.jsx");
const css = read("src/styles/app.css");
const app = read("src/App.jsx");

const checks = [
  ["La vista Normal es la opción predeterminada", panel.includes('useState("normal")')],
  ["El selector se integra únicamente dentro del panel oficial de Mesas", panel.includes("<SelectorVistaMesas") && !app.includes("<SelectorVistaMesas")],
  ["El selector ofrece Normal y Compacta", selector.includes('onChange?.("normal")') && selector.includes('onChange?.("compacta")')],
  ["Normal y Compacta se alternan sin desmontar el motor de pedido", panel.includes('vistaMesas === "normal" ? (') && panel.includes("<PanelMesasCompacto")],
  ["La vista Compacta no crea un estado de pedido paralelo", !compacto.includes("itemsMesaCompacta") && !compacto.includes("setItemsMesa")],
  ["Ambas vistas reciben los mismos grupos reales del resumen", panel.includes("gruposResumenMesa={gruposResumenMesa}")],
  ["La Compacta reutiliza mesa y modo llevar oficiales", panel.includes("mesaLocal={mesaLocal}") && panel.includes("modoLlevar={modoLlevar}")],
  ["La Compacta reutiliza mesero y pago oficiales", panel.includes("meseroLocal={meseroLocal}") && panel.includes("tipoPagoMesa={tipoPagoMesa}")],
  ["DatosMesa usa la función oficial de envío en ambas vistas", panel.includes("onEnviarPedido: enviarPedidoMesa") && compacto.includes("<DatosMesa {...datosMesaProps} />") && resumenNormal.includes("<DatosMesa {...datosMesaProps} />")],
  ["La función oficial sigue guardando por onEnviar", panel.includes("const pedidoGuardado = await onEnviar(payloadMesa)")],
  ["La edición administrativa conserva su flujo oficial", panel.includes("onGuardarEdicion?.(pedidoEditando.id, payloadMesa)") && panel.includes("modoEdicionAdmin={modoEdicionAdmin}")],
  ["La confirmación oficial sigue siendo única", panel.includes("<ConfirmacionPedidoMesa")],
  ["La Compacta selecciona proteínas reales", compacto.includes("onCambiarPlato?.(itemActivo?.id, plato)") && panel.includes("onCambiarPlato={cambiarPlatoMesa}")],
  ["La Compacta selecciona acompañantes reales", compacto.includes("onCambiarAcompanante?.(itemActivo.id, acompanante)") && panel.includes("onCambiarAcompanante={cambiarAcompananteMesa}")],
  ["Cantidad y edición usan las funciones reales del resumen", panel.includes("onCambiarCantidad={actualizarCantidadGrupoMesa}") && panel.includes("onEditarProteina={setGrupoEditandoProteinaMesa}") && panel.includes("onEditarAcompanantes={setGrupoEditandoAcompanantesMesa}")],
  ["El pedido se conserva al abrir Cafetería desde Compacta", compacto.includes('onAbrirNormalCategoria?.("cafeteria")') && panel.includes("setVistaMesas(\"normal\")")],
  ["El pedido se conserva al abrir Adicionales desde Compacta", compacto.includes('onAbrirNormalCategoria?.("almuerzos")') && panel.includes("setAdicionalesRestauranteAbiertos(true)")],
  ["No se usa PanelMesasBeta como motor operativo", !panel.includes("PanelMesasBeta") && !compacto.includes("PanelMesasBeta")],
  ["La cabecera compacta muestra únicamente Mesas", compacto.includes("<h2>Mesas</h2>")],
  ["La interfaz no muestra etiquetas de prueba ni textos operativos", !compacto.includes("Prueba operativa") && !compacto.includes("Vista compacta") && !compacto.includes("Los pedidos se guardan") && !compacto.includes("Crea almuerzos reales") && !selector.includes("Prueba")],
  ["La vista Compacta mantiene tres pasos", compacto.includes('id: "proteina"') && compacto.includes('id: "acompanantes"') && compacto.includes('id: "datos"')],
  ["El selector y la vista tienen estilos compactos", css.includes(".mesas-vista-selector") && css.includes(".mesas-compacta-operativa")],
  ["La adaptación móvil mantiene el selector compacto", css.includes("@media (max-width: 700px)") && css.includes(".mesas-vista-selector-opciones button")],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}

console.log(`\n${ok}/${checks.length} controles Fase 37E aprobados.`);
if (ok !== checks.length) process.exit(1);
