import { useMemo } from "react";
import {
  consolidarPedidos,
  obtenerCliente,
  obtenerCodigoPedido,
  obtenerEstadoPedido,
} from "../../../utils/pedidos";

export function useAdminPedidos({
  pedidos,
  busquedaDebounced,
  filtroPedidos,
  fechaSeleccionada,
}) {
  const pedidosOrdenados = useMemo(() => {
    return [...pedidos].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const q = busquedaDebounced.trim().toLowerCase();

    if (!q) return pedidosOrdenados;

    return pedidosOrdenados.filter((pedido) => {
      const codigo = String(obtenerCodigoPedido(pedido) || "");
      const id = String(pedido?.id || "");
      const textoBusqueda = [
        codigo,
        id,
        `#${codigo}`,
        obtenerCliente(pedido),
        pedido?.telefono,
        pedido?.ubicacion,
        pedido?.mesa,
        pedido?.mesero,
        pedido?.tipo_pago,
        pedido?.pedido_texto,
        obtenerEstadoPedido(pedido),
      ].filter(Boolean).join(" ").toLowerCase();

      return textoBusqueda.includes(q);
    });
  }, [pedidosOrdenados, busquedaDebounced]);

  const pedidosPendientes = useMemo(() => {
    return pedidosFiltrados.filter((pedido) => obtenerEstadoPedido(pedido) === "Pendiente");
  }, [pedidosFiltrados]);

  const pedidosFinalizados = useMemo(() => {
    return pedidosFiltrados.filter((pedido) => obtenerEstadoPedido(pedido) === "Finalizado");
  }, [pedidosFiltrados]);

  const pedidosBorrados = useMemo(() => {
    return pedidosFiltrados.filter((pedido) => obtenerEstadoPedido(pedido) === "Borrado");
  }, [pedidosFiltrados]);

  const pedidosActivos = useMemo(() => {
    return pedidosFiltrados.filter((pedido) => obtenerEstadoPedido(pedido) !== "Borrado");
  }, [pedidosFiltrados]);

  const consolidado = useMemo(() => consolidarPedidos(pedidosActivos), [pedidosActivos]);

  const tituloPedidos = useMemo(() => {
    if (filtroPedidos === "dia") return `Pedidos del ${fechaSeleccionada}`;
    return "Pedidos de hoy";
  }, [filtroPedidos, fechaSeleccionada]);

  return {
    pedidosFiltrados,
    pedidosPendientes,
    pedidosFinalizados,
    pedidosBorrados,
    pedidosActivos,
    consolidado,
    tituloPedidos,
  };
}
