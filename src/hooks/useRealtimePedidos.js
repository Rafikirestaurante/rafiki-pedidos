import { useEffect, useRef, useState } from "react";
import { supabase, supabaseConfigOk } from "../supabaseClient";
import { fechaISOColombia, pedidoEsDeHoy } from "../utils/pedidos";

const ESTADO_REALTIME_INACTIVO = {
  estado: "inactivo",
  texto: "Realtime inactivo",
  detalle: "Abre el panel administrativo para activar la conexión en vivo."
};

export function useRealtimePedidos({
  activo,
  filtroPedidos,
  fechaSeleccionada,
  setPedidos,
  setRecargaPedidos,
  mostrarAlertaPedidoNuevo,
  pollingMs = 20000
}) {
  const [estadoRealtimePedidos, setEstadoRealtimePedidos] = useState(ESTADO_REALTIME_INACTIVO);

  const filtroPedidosRef = useRef(filtroPedidos);
  const fechaSeleccionadaRef = useRef(fechaSeleccionada);
  const activoRef = useRef(activo);
  const instanciaRealtimeRef = useRef(
    `rafiki-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  useEffect(() => {
    filtroPedidosRef.current = filtroPedidos;
  }, [filtroPedidos]);

  useEffect(() => {
    fechaSeleccionadaRef.current = fechaSeleccionada;
  }, [fechaSeleccionada]);

  useEffect(() => {
    activoRef.current = activo;
  }, [activo]);

  function pedidoCoincideConFiltroActual(pedido) {
    const filtroActual = filtroPedidosRef.current;
    const fechaActual = fechaSeleccionadaRef.current;

    if (filtroActual === "hoy") return pedidoEsDeHoy(pedido);
    if (filtroActual === "dia") {
      return fechaISOColombia(new Date(pedido?.created_at || Date.now())) === fechaActual;
    }

    return true;
  }

  useEffect(() => {
    if (!supabaseConfigOk || !activo) {
      setEstadoRealtimePedidos(ESTADO_REALTIME_INACTIVO);
      return undefined;
    }

    let canalActivo = true;
    const nombreCanal = `${instanciaRealtimeRef.current}-pedidos`;

    setEstadoRealtimePedidos({
      estado: "conectando",
      texto: "Conectando Realtime...",
      detalle: "Preparando actualización automática de pedidos."
    });

    const canal = supabase
      .channel(nombreCanal)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        (payload) => {
          const tipoEvento = payload.eventType;
          const pedidoNuevo = payload.new;
          const pedidoAnterior = payload.old;
          const pedidoId = pedidoNuevo?.id || pedidoAnterior?.id;

          if (!pedidoId) return;

          if (tipoEvento === "DELETE") {
            setPedidos((actual) => actual.filter((pedido) => pedido.id !== pedidoId));
            setEstadoRealtimePedidos((actual) => ({
              ...actual,
              estado: "conectado",
              texto: "Realtime conectado",
              detalle: "Pedido eliminado recibido en vivo."
            }));
            return;
          }

          if (!pedidoNuevo?.id) return;

          const coincideConFiltro = pedidoCoincideConFiltroActual(pedidoNuevo);

          setPedidos((actual) => {
            const existe = actual.some((pedido) => pedido.id === pedidoNuevo.id);

            if (!coincideConFiltro) {
              return existe ? actual.filter((pedido) => pedido.id !== pedidoNuevo.id) : actual;
            }

            if (existe) {
              return actual.map((pedido) => (pedido.id === pedidoNuevo.id ? pedidoNuevo : pedido));
            }

            return [...actual, pedidoNuevo];
          });

          setEstadoRealtimePedidos((actual) => ({
            ...actual,
            estado: "conectado",
            texto: "Realtime conectado",
            detalle: tipoEvento === "INSERT" ? "Pedido nuevo recibido en vivo." : "Pedido actualizado en vivo."
          }));

          if (tipoEvento === "INSERT" && pedidoEsDeHoy(pedidoNuevo)) {
            mostrarAlertaPedidoNuevo(pedidoNuevo);
          }
        }
      )
      .subscribe((estado) => {
        if (!canalActivo) return;

        if (estado === "SUBSCRIBED") {
          setEstadoRealtimePedidos({
            estado: "conectado",
            texto: "Realtime conectado",
            detalle: "Los pedidos deberían aparecer automáticamente."
          });
          setRecargaPedidos((actual) => actual + 1);
          return;
        }

        if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT" || estado === "CLOSED") {
          setEstadoRealtimePedidos({
            estado: "reconectando",
            texto: "Realtime reconectando",
            detalle: "Si entra un pedido durante la reconexión, el sistema hará una recarga automática."
          });
          setRecargaPedidos((actual) => actual + 1);
          return;
        }

        setEstadoRealtimePedidos({
          estado: "conectando",
          texto: "Conectando Realtime...",
          detalle: `Estado técnico: ${estado}`
        });
      });

    const recargaAlVolver = () => {
      if (document.visibilityState === "visible" && activoRef.current) {
        setRecargaPedidos((actual) => actual + 1);
      }
    };

    const recargaAlRecuperarInternet = () => {
      setEstadoRealtimePedidos({
        estado: "reconectando",
        texto: "Internet recuperado",
        detalle: "Recargando pedidos y revalidando conexión en vivo."
      });
      setRecargaPedidos((actual) => actual + 1);
    };

    const respaldoAutomatico = window.setInterval(() => {
      if (activoRef.current && document.visibilityState === "visible") {
        setRecargaPedidos((actual) => actual + 1);
      }
    }, pollingMs);

    window.addEventListener("online", recargaAlRecuperarInternet);
    document.addEventListener("visibilitychange", recargaAlVolver);

    return () => {
      canalActivo = false;
      window.clearInterval(respaldoAutomatico);
      window.removeEventListener("online", recargaAlRecuperarInternet);
      document.removeEventListener("visibilitychange", recargaAlVolver);
      supabase.removeChannel(canal);
    };
  }, [activo, mostrarAlertaPedidoNuevo, pollingMs, setPedidos, setRecargaPedidos]);

  return {
    estadoRealtimePedidos,
    pedidoCoincideConFiltroActual,
    instanciaRealtimeRef
  };
}
