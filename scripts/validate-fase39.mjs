import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const build = read("src/config/rafikiBuild.js");
const gerencia = read("src/modules/gerencia/components/GerenciaPanel.jsx");
const ajustes = read("src/modules/ajustes/components/AjustesRafiki.jsx");
const meseros = read("src/modules/ajustes/components/MeserosAjustes.jsx");
const meserosService = read("src/services/meserosService.js");
const mesas = read("src/modules/mesas/components/PanelMesas.jsx");
const datos = read("src/modules/mesas/components/DatosMesa.jsx");
const adicionalesUI = read("src/modules/mesas/components/AdicionalesMesas.jsx");
const compacto = read("src/modules/mesas/components/PanelMesasCompacto.jsx");
const cartera = read("src/modules/cartera/components/CarteraClientesCredito.jsx");
const carteraService = read("src/services/carteraService.js");
const carteraUtils = read("src/modules/cartera/utils/carteraViewUtils.js");
const sql = read("supabase/2026-09-15-fase39-abonos-editables-meseros.sql");

const indiceCliente = datos.indexOf("Cliente {tipoPagoMesa");
const indicePago = datos.indexOf("💳 Forma de pago");
const indiceMesero = datos.indexOf("👤 Mesero");

const checks = [
  ["La línea de versión continúa en 128.x Fase 39", /128\.\d+-FASE39/.test(build)],
  ["Gerencia renombra Catálogo a Ajustes", gerencia.includes('{ id: "catalogo", label: "Ajustes" }') && gerencia.includes("<AjustesRafiki")],
  ["Ajustes conserva Catálogo y agrega Meseros", ajustes.includes("Catálogo") && ajustes.includes("Meseros") && ajustes.includes("<MeserosAjustes")],
  ["Meseros permite crear y editar", meseros.includes("crearMesero") && meseros.includes("actualizarMesero") && meseros.includes("Agregar mesero")],
  ["Meseros permite activar y desactivar sin borrar historial", meseros.includes("Desactivar") && meseros.includes("Activar") && meseros.includes("históricos")],
  ["Meseros se guardan en Supabase", meserosService.includes('.from("meseros")') && sql.includes("create table if not exists public.meseros")],
  ["Mesas carga meseros administrables", mesas.includes("listarMeserosActivos") && datos.includes("meserosDisponibles.map")],
  ["Datos de Mesas siguen Cliente -> Forma de pago -> Mesero", indiceCliente >= 0 && indicePago > indiceCliente && indiceMesero > indicePago],
  ["Adicionales Restaurante quedan siempre disponibles", mesas.includes("<AdicionalesRestauranteMesas") && adicionalesUI.includes("Adicionales Restaurante") && !mesas.includes("if (!hayAlmuerzoSeleccionadoMesa) return;")],
  ["Cafetería tiene sección propia de adicionales", mesas.includes('"Adicionales cafetería"') && mesas.includes('subcategoriaCafeteria === "adicionales"')],
  ["Compacta conserva adicionales de Restaurante y Cafetería", compacto.includes("contenidoAdicionalesRestaurante") && compacto.includes("contenidoCafeteria") && mesas.includes('subcategoriaCafeteria === "adicionales"')],
  ["Cartera muestra Editar y Eliminar sobre pagos", cartera.includes("abrirEdicionAbono") && cartera.includes("abrirAnulacionAbono")],
  ["El servicio usa RPCs seguros para editar/anular", carteraService.includes('rpc("editar_abono_cliente_credito"') && carteraService.includes('rpc("anular_abono_cliente_credito"')],
  ["Los abonos se agrupan por pago_id", carteraUtils.includes("abono.pago_id") && carteraUtils.includes("pagoId")],
  ["SQL introduce pago lógico y aplicaciones vigentes", sql.includes("public.cartera_pagos") && sql.includes("pago_id uuid") && sql.includes("vigente boolean")],
  ["SQL recalcula FIFO transaccionalmente", sql.includes("recalcular_aplicaciones_cartera_cliente") && sql.includes("order by fecha_movimiento asc, created_at asc, id asc")],
  ["SQL conserva auditoría de cambios", sql.includes("cartera_pagos_auditoria") && sql.includes("auditar_cartera_pago")],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}

console.log(`\n${ok}/${checks.length} controles Fase 39 aprobados.`);
if (ok !== checks.length) process.exit(1);
