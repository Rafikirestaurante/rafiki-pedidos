import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const panel = read("src/modules/mesas/components/PanelMesas.jsx");
const pedidos = read("src/shared/utils/pedidos.js");
const resumen = read("src/shared/components/ResumenPedidoItem.jsx");
const admin = read("src/modules/pedidos/components/PedidosAdmin.jsx");
const css = read("src/styles/app.css");

const checks = [
  ["Panel Mesas importa el detector de adicionales", panel.includes("esAdicionalAlmuerzo")],
  ["Los adicionales se separan de los almuerzos", panel.includes("!esAdicionalAlmuerzo(item)")],
  ["La sección solo aparece cuando hay un almuerzo", panel.includes("hayAlmuerzoSeleccionadoMesa && restauranteAdicionalesAlmuerzo.length > 0")],
  ["La sección se llama Adicionales", panel.includes(">Adicionales</span>")],
  ["La lista queda plegada con aria-expanded", panel.includes("aria-expanded={adicionalesRestauranteAbiertos}")],
  ["Cada adicional admite cantidad independiente", panel.includes("cambiarCantidadAdicionalRestaurante(adicional, cantidad - 1)") && panel.includes("cambiarCantidadAdicionalRestaurante(adicional, cantidad + 1)")],
  ["La cantidad puede volver a cero y eliminar el adicional", panel.includes("if (cantidad === 0)")],
  ["Los adicionales se guardan como items separados", panel.includes('tipo: "adicional_almuerzo"') && panel.includes('categoria: "Adicionales almuerzo"')],
  ["Se eliminan adicionales si ya no queda almuerzo", panel.includes("actual.filter((item) => !esAdicionalAlmuerzo(item))")],
  ["La implementación vieja por almuerzo fue retirada", !panel.includes("adicionalesAlmuerzoAbiertos") && !panel.includes("alternarAdicionalAlmuerzoMesa")],
  ["Existe detector compartido", pedidos.includes("export function esAdicionalAlmuerzo")],
  ["No se cobra empaque por cada adicional", pedidos.includes("if (esAdicionalAlmuerzo(item)) return 0")],
  ["El texto del pedido no agrega empaque al adicional", pedidos.includes("item.paraLlevar && !adicionalAlmuerzo")],
  ["El resumen no muestra sopa o acompañantes en adicionales", resumen.includes("!itemEsAdicionalAlmuerzo")],
  ["Pedidos Hoy evita texto de empaque en adicionales", admin.includes("!esAdicionalAlmuerzo(item) && textoParaLlevarItem(item)")],
  ["La sección tiene estilos discretos", css.includes(".mesa-adicionales-restaurante") && css.includes(".mesa-adicionales-toggle")],
  ["Las cantidades tienen controles compactos", css.includes(".mesa-adicional-cantidad button")],
  ["La versión conserva el catálogo administrable", panel.includes("restauranteAdicionalesAlmuerzo.map((adicional)")],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}

console.log(`\n${ok}/${checks.length} controles Fase 37D aprobados.`);
if (ok !== checks.length) process.exit(1);
