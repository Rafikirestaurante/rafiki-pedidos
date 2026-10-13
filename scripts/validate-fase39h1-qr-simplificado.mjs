import fs from "node:fs";

const checks = [];
const ok = (name, cond) => checks.push({ name, ok: Boolean(cond) });
const build = fs.readFileSync("src/config/rafikiBuild.js", "utf8");
const pedidos = fs.readFileSync("src/shared/hooks/usePedidos.js", "utf8");
const cliente = fs.readFileSync("src/modules/cliente/components/PedidoCliente.jsx", "utf8");
const confirmacion = fs.readFileSync("src/modules/cliente/components/ConfirmacionPedidoCliente.jsx", "utf8");
const app = fs.readFileSync("src/App.jsx", "utf8");

ok("Versión 128.9 / Fase 39H.1", build.includes("128.9-FASE39H1-QR-SIN-PAGO-TELEFONO-WHATSAPP"));
ok("QR no exige teléfono", pedidos.includes('if (!pedidoMesaQr && !telefono.trim())'));
ok("QR no exige forma de pago", pedidos.includes('if (!pedidoMesaQr && !tipoPago)'));
ok("QR guarda teléfono vacío", pedidos.includes('const telefonoLimpio = pedidoMesaQr ? ""'));
ok("QR identifica pago en mesa", pedidos.includes('pedidoMesaQr ? "Pago en mesa" : tipoPago'));
ok("Formulario oculta teléfono en QR", cliente.includes('{!mesaClienteQr ? (') && cliente.includes('etiqueta="📞 Teléfono"'));
ok("Formulario oculta tipo de pago en QR", cliente.includes('<span>💳 Tipo de pago</span>') && cliente.includes('{!mesaClienteQr ? ('));
ok("Confirmación recibe modo QR", app.includes('esPedidoMesaQr={Boolean(mesaClienteQr)}'));
ok("Confirmación oculta teléfono y pago", confirmacion.includes('{!esPedidoMesaQr ? (') && confirmacion.includes('<span>Teléfono</span>') && confirmacion.includes('<span>Pago</span>'));
ok("Confirmación WhatsApp desactivada en QR", confirmacion.includes('!esPedidoMesaQr ? (') && confirmacion.includes('BOTONES.CONFIRMAR_WHATSAPP'));
ok("Confirmación muestra mesa", confirmacion.includes('esPedidoMesaQr ? "Mesa" : "Ubicación"'));

const failed = checks.filter((c) => !c.ok);
checks.forEach((c) => console.log(`${c.ok ? "✓" : "✗"} ${c.name}`));
if (failed.length) process.exit(1);
console.log(`\nFase 39H.1: ${checks.length}/${checks.length} controles aprobados.`);
