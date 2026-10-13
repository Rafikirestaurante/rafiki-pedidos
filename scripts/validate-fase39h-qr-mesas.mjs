import fs from "node:fs";

const checks = [];
const ok = (name, cond) => checks.push({ name, ok: Boolean(cond) });
const mesasQr = fs.readFileSync("src/shared/utils/mesasQr.js", "utf8");
const app = fs.readFileSync("src/App.jsx", "utf8");
const pedidos = fs.readFileSync("src/shared/hooks/usePedidos.js", "utf8");
const cliente = fs.readFileSync("src/modules/cliente/components/PedidoCliente.jsx", "utf8");
const ajustes = fs.readFileSync("src/modules/ajustes/components/AjustesRafiki.jsx", "utf8");
const nav = fs.readFileSync("src/shared/utils/navigation.js", "utf8");

for (const mesa of ["1A","1B","2A","2B","3A","3B","4A","4B","5B"]) ok(`token ${mesa}`, mesasQr.includes(`"${mesa}"`));
ok("tokens opacos", mesasQr.includes("rfk1_") && !mesasQr.includes("?mesa="));
ok("App detecta QR", app.includes("obtenerMesaQrDesdeUrl") && app.includes("mesaClienteQr"));
ok("QR fuerza pedido mesa", pedidos.includes('pedidoMesaQr ? mesaClienteQr') && pedidos.includes('"Cliente QR"'));
ok("cliente muestra mesa", cliente.includes("Pedido para Mesa {mesaClienteQr}"));
ok("mesa bloqueada en formulario", cliente.includes("El pedido se enviará a cocina identificado con esta mesa"));
ok("Ajustes expone Mesas QR", ajustes.includes("Mesas / QR") && ajustes.includes("MesasQrAjustes"));
ok("PWA respeta enlace QR", nav.includes("accesoMesaQr"));

const failed = checks.filter((c) => !c.ok);
checks.forEach((c) => console.log(`${c.ok ? "✓" : "✗"} ${c.name}`));
if (failed.length) process.exit(1);
console.log(`\nFase 39H: ${checks.length}/${checks.length} controles aprobados.`);
