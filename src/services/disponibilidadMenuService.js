import { supabase } from "../supabaseClient";
import { obtenerEstadoPedido, obtenerItemsPedido, esItemCafeteria } from "../shared/utils/pedidos";

export const clavePlato = (nombre) => String(nombre || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export function rangoDiaColombia(fecha) {
  const dia = String(fecha || "").slice(0, 10);
  const inicio = new Date(`${dia}T00:00:00-05:00`);
  const fin = new Date(inicio.getTime() + 86400000);
  return [inicio.toISOString(), fin.toISOString()];
}

export function contarPlatosVendidos(pedidos, platos = []) {
  const nombres = new Map(platos.map((plato) => [clavePlato(plato.nombre), plato.nombre]));
  const ventas = {};
  for (const pedido of pedidos || []) {
    if (obtenerEstadoPedido(pedido) === "Borrado") continue;
    for (const item of obtenerItemsPedido(pedido)) {
      if (esItemCafeteria(item)) continue;
      const clave = clavePlato(item?.plato || item?.proteina || item?.nombre || item?.producto);
      const nombre = nombres.get(clave);
      if (!nombre) continue;
      const cantidad = Number(item.cantidad ?? 1);
      if (Number.isFinite(cantidad) && cantidad > 0) ventas[nombre] = (ventas[nombre] || 0) + cantidad;
    }
  }
  return ventas;
}

export async function consultarDisponibilidadMenu(fecha, platos) {
  const [inicio, fin] = rangoDiaColombia(fecha);
  const limites = await supabase.from("menu_cantidades_diarias").select("plato, cantidad_estimada, agotado").eq("fecha", fecha);
  if (limites.error) throw limites.error;
  const pedidos = [];
  for (let desde = 0; ; desde += 500) {
    const respuesta = await supabase.from("pedidos").select("id, estado, items").gte("created_at", inicio).lt("created_at", fin).order("id", { ascending: true }).range(desde, desde + 499);
    if (respuesta.error) throw respuesta.error;
    pedidos.push(...(respuesta.data || []));
    if ((respuesta.data || []).length < 500) break;
  }
  return { limites: Object.fromEntries((limites.data || []).map((item) => [clavePlato(item.plato), item])), ventas: contarPlatosVendidos(pedidos, platos) };
}

export async function guardarCantidadMenu(fecha, plato, cantidad, agotado = false) {
  if (cantidad === "" || cantidad == null) {
    const resultado = await supabase.from("menu_cantidades_diarias").delete().eq("fecha", fecha).eq("plato", plato);
    if (resultado.error) throw resultado.error;
    return;
  }
  const n = Number(cantidad);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("Ingresa una cantidad entera mayor o igual a cero.");
  const resultado = await supabase.from("menu_cantidades_diarias").upsert({ fecha, plato, cantidad_estimada: n, agotado }, { onConflict: "fecha,plato" });
  if (resultado.error) throw resultado.error;
}

export function estadoDisponibilidad(limite, vendidas) {
  if (!limite || limite.cantidad_estimada == null) return null;
  if (limite.agotado || vendidas >= limite.cantidad_estimada) return "rojo";
  if (limite.cantidad_estimada - vendidas <= Math.max(2, Math.ceil(limite.cantidad_estimada * 0.2))) return "amarillo";
  return "verde";
}
