import { supabase, supabaseConfigOk } from "../supabaseClient";
import { asegurarClienteCredito, normalizarNombreClienteCredito } from "./clientesCreditoService";

export const SELECT_CARTERA_MOVIMIENTOS = [
  "id",
  "created_at",
  "cliente_credito_id",
  "pedido_id",
  "numero_pedido",
  "cliente_nombre",
  "tipo_movimiento",
  "concepto",
  "valor",
  "saldo_movimiento",
  "estado",
  "fecha_movimiento",
  "observaciones"
].join(", ");

function normalizarNumero(valor) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) ? numero : 0;
}

function esPagoCredito(tipoPago) {
  return String(tipoPago || "").trim().toLowerCase() === "crédito" || String(tipoPago || "").trim().toLowerCase() === "credito";
}

export async function registrarCarteraPedidoCredito(pedido = {}) {
  if (!supabaseConfigOk || !pedido?.id || !esPagoCredito(pedido.tipo_pago)) return null;

  const clienteNombre = normalizarNombreClienteCredito(pedido.cliente_nombre || pedido.cliente || "");
  const total = normalizarNumero(pedido.total);
  if (!clienteNombre || total <= 0) return null;

  const cliente = await asegurarClienteCredito(clienteNombre);
  if (!cliente?.id) return null;

  const { data: existente, error: errorExistente } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedido.id))
    .eq("tipo_movimiento", "pedido_credito")
    .maybeSingle();

  if (errorExistente) {
    console.warn("No se pudo verificar cartera del pedido:", errorExistente.message);
  }

  if (existente?.id) return existente;

  const fechaPedido = pedido.created_at || new Date().toISOString();
  const movimientoPayload = {
    cliente_credito_id: cliente.id,
    pedido_id: String(pedido.id),
    numero_pedido: pedido.numero_pedido || null,
    cliente_nombre: clienteNombre,
    tipo_movimiento: "pedido_credito",
    concepto: `Pedido #${pedido.numero_pedido || pedido.id}`,
    valor: total,
    saldo_movimiento: total,
    estado: "pendiente",
    fecha_movimiento: fechaPedido,
    observaciones: pedido.observaciones || null,
  };

  const { data, error } = await supabase
    .from("cartera_movimientos")
    .insert(movimientoPayload)
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .single();

  if (error) {
    console.warn("No se pudo registrar cartera automática:", error.message);
    throw error;
  }

  const { data: clienteActualizado, error: errorCliente } = await supabase
    .from("clientes_credito")
    .select("id,total_pedidos,saldo_pendiente,fecha_ultimo_pedido")
    .eq("id", cliente.id)
    .maybeSingle();

  if (!errorCliente && clienteActualizado?.id) {
    const totalPedidos = normalizarNumero(clienteActualizado.total_pedidos) + 1;
    const saldoPendiente = normalizarNumero(clienteActualizado.saldo_pendiente) + total;

    const { error: errorUpdateCliente } = await supabase
      .from("clientes_credito")
      .update({
        total_pedidos: totalPedidos,
        saldo_pendiente: saldoPendiente,
        fecha_ultimo_pedido: fechaPedido,
      })
      .eq("id", cliente.id);

    if (errorUpdateCliente) {
      console.warn("No se pudo actualizar saldo del cliente crédito:", errorUpdateCliente.message);
    }
  }

  return data;
}

export async function listarMovimientosCartera({ clienteId = null, estado = "pendiente", limite = 300 } = {}) {
  if (!supabaseConfigOk) return [];

  let consulta = supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .order("fecha_movimiento", { ascending: false })
    .limit(limite);

  if (clienteId) consulta = consulta.eq("cliente_credito_id", clienteId);
  if (estado && estado !== "todos") consulta = consulta.eq("estado", estado);

  const { data, error } = await consulta;

  if (error) {
    console.warn("No se pudieron cargar movimientos de cartera:", error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}
