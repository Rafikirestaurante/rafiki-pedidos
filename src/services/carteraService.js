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

export async function corregirClienteCreditoDePedido(pedido = {}, nombreDestino = "") {
  if (!supabaseConfigOk || !pedido?.id) return null;

  const nombreLimpio = normalizarNombreClienteCredito(nombreDestino);
  if (!nombreLimpio) throw new Error("Escribe el nombre correcto del cliente crédito.");

  const total = normalizarNumero(pedido.total);
  const fechaPedido = pedido.created_at || new Date().toISOString();
  const clienteDestino = await asegurarClienteCredito(nombreLimpio);
  if (!clienteDestino?.id) throw new Error("No se pudo crear o encontrar el cliente crédito.");

  const { data: movimientosActuales, error: errorMovimientosActuales } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedido.id))
    .eq("tipo_movimiento", "pedido_credito");

  if (errorMovimientosActuales) throw errorMovimientosActuales;

  const movimientos = Array.isArray(movimientosActuales) ? movimientosActuales : [];
  const idsClientesAnteriores = Array.from(new Set(
    movimientos
      .map((movimiento) => movimiento.cliente_credito_id)
      .filter((id) => id && id !== clienteDestino.id)
  ));

  if (movimientos.length === 0 && total > 0) {
    const { error: errorInsert } = await supabase
      .from("cartera_movimientos")
      .insert({
        cliente_credito_id: clienteDestino.id,
        pedido_id: String(pedido.id),
        numero_pedido: pedido.numero_pedido || null,
        cliente_nombre: nombreLimpio,
        tipo_movimiento: "pedido_credito",
        concepto: `Pedido #${pedido.numero_pedido || pedido.id}`,
        valor: total,
        saldo_movimiento: total,
        estado: "pendiente",
        fecha_movimiento: fechaPedido,
        observaciones: pedido.observaciones || "Corrección desde Pedidos Hoy",
      });

    if (errorInsert) throw errorInsert;
  } else if (movimientos.length > 0) {
    const { error: errorUpdateMovimientos } = await supabase
      .from("cartera_movimientos")
      .update({
        cliente_credito_id: clienteDestino.id,
        cliente_nombre: nombreLimpio,
      })
      .eq("pedido_id", String(pedido.id))
      .eq("tipo_movimiento", "pedido_credito");

    if (errorUpdateMovimientos) throw errorUpdateMovimientos;
  }

  const idsParaRecalcular = Array.from(new Set([...idsClientesAnteriores, clienteDestino.id].filter(Boolean)));
  await Promise.all(idsParaRecalcular.map((clienteId) => recalcularResumenClienteCredito(clienteId)));

  const { data: movimientosCorregidos, error: errorMovimientosCorregidos } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedido.id))
    .eq("tipo_movimiento", "pedido_credito");

  if (errorMovimientosCorregidos) throw errorMovimientosCorregidos;

  return {
    cliente: clienteDestino,
    movimientos: Array.isArray(movimientosCorregidos) ? movimientosCorregidos : [],
  };
}

export async function recalcularResumenClienteCredito(clienteId) {
  if (!supabaseConfigOk || !clienteId) return null;

  const { data: movimientos, error } = await supabase
    .from("cartera_movimientos")
    .select("id,valor,saldo_movimiento,estado,fecha_movimiento,tipo_movimiento")
    .eq("cliente_credito_id", clienteId)
    .eq("tipo_movimiento", "pedido_credito");

  if (error) {
    console.warn("No se pudo recalcular cliente crédito:", error.message);
    return null;
  }

  const lista = Array.isArray(movimientos) ? movimientos : [];
  const pedidos = lista.length;
  const saldo = lista.reduce((total, movimiento) => {
    if (String(movimiento.estado || "").toLowerCase() === "pagado") return total;
    return total + normalizarNumero(movimiento.saldo_movimiento ?? movimiento.valor);
  }, 0);
  const ultimaFecha = lista
    .map((movimiento) => movimiento.fecha_movimiento)
    .filter(Boolean)
    .sort()
    .pop() || null;

  const { data, error: errorUpdate } = await supabase
    .from("clientes_credito")
    .update({
      total_pedidos: pedidos,
      saldo_pendiente: saldo,
      fecha_ultimo_pedido: ultimaFecha,
    })
    .eq("id", clienteId)
    .select("id,nombre,total_pedidos,saldo_pendiente,fecha_ultimo_pedido")
    .maybeSingle();

  if (errorUpdate) {
    console.warn("No se pudo actualizar resumen del cliente crédito:", errorUpdate.message);
    return null;
  }

  return data || null;
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
