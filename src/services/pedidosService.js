import { supabase } from "../supabaseClient";

export const SELECT_PEDIDOS_ADMIN = [
  "id",
  "created_at",
  "numero_pedido",
  "estado",
  "cliente",
  "cliente_nombre",
  "telefono",
  "ubicacion",
  "mesa",
  "mesero",
  "tipo_pedido",
  "tipo_pago",
  "pedido_texto",
  "observaciones",
  "items",
  "total",
  "enviado_whatsapp"
].join(", ");

export async function crearPedido(pedido) {
  return supabase.from("pedidos").insert(pedido).select(SELECT_PEDIDOS_ADMIN).single();
}

export async function registrarAuditoriaPedido(payload) {
  return supabase.from("auditoria_pedidos").insert(payload);
}

export async function actualizarEstadoPedido(id, estado) {
  return supabase
    .from("pedidos")
    .update({ estado })
    .eq("id", id)
    .select(SELECT_PEDIDOS_ADMIN)
    .single();
}

export async function finalizarPedidosPorIds(ids = []) {
  return supabase
    .from("pedidos")
    .update({ estado: "Finalizado" })
    .in("id", ids)
    .select(SELECT_PEDIDOS_ADMIN);
}

export async function marcarPedidoBorrado(id) {
  return supabase
    .from("pedidos")
    .update({ estado: "Borrado" })
    .eq("id", id)
    .select(SELECT_PEDIDOS_ADMIN)
    .single();
}

export async function actualizarPedido(id, payload) {
  return supabase
    .from("pedidos")
    .update(payload)
    .eq("id", id)
    .select(SELECT_PEDIDOS_ADMIN)
    .single();
}

export async function cargarPedidosRango(inicio, fin, opciones = {}) {
  const { ascendente = true } = opciones;
  return supabase
    .from("pedidos")
    .select(SELECT_PEDIDOS_ADMIN)
    .gte("created_at", inicio)
    .lt("created_at", fin)
    .order("created_at", { ascending: ascendente });
}

export function crearCanalPedidosRealtime(nombreCanal, onCambio, onEstado) {
  return supabase
    .channel(nombreCanal)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pedidos" },
      onCambio
    )
    .subscribe(onEstado);
}

export function removerCanalSupabase(canal) {
  if (!canal) return;
  supabase.removeChannel(canal);
}
