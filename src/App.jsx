import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import SolicitudProductos from "./components/SolicitudProductos";
import GeneradorMenu from "./components/GeneradorMenu";
import PanelMesasPOS from "./components/PanelMesas";
import PanelRafaPrivado from "./components/PanelRafaPrivado";
import { CampoTexto } from "./components/common";
import { PedidoCocina, TablaPedidosCompacta } from "./components/PedidosAdmin";
import { estadosPedido, menuFallback } from "./data/menuAlmuerzos";
import {
  acompanantesATexto,
  agruparPlatosPorCategoria,
  calcularTotalItems,
  crearItemNuevo,
  crearLinkWhatsApp,
  crearMensajeWhatsAppPedido,
  crearTextoPedido,
  dinero,
  esDispositivoMovil,
  fechaISOColombia,
  formatearFechaHora,
  guardarPedidosRevisadosLocal,
  guardarSesionTemporal,
  limpiarAcompanantesCliente,
  limpiarAcompanantesMenu,
  limpiarTelefono,
  limpiarTelefonoWhatsApp,
  limpiarTexto,
  normalizarMenu,
  obtenerCliente,
  obtenerEstadoPedido,
  obtenerRangoPedidos,
  obtenerSesionActiva,
  pedidoEsDeHoy,
  platosATexto,
  textoAPlatosDetalle,
  cargarPedidosRevisadosLocal
} from "./utils/pedidos";

const WHATSAPP_RAFIKI = import.meta.env.VITE_WHATSAPP_RAFIKI || "";
const CLAVE_ADMIN = import.meta.env.VITE_CLAVE_ADMIN || "";
const CLAVE_RAFA = import.meta.env.VITE_CLAVE_RAFA || "";

function obtenerVistaInicial() {
  const ruta = window.location.pathname.replace(/\/$/, "") || "/";
  const adminActivo = obtenerSesionActiva("rafikiAdminActivo");

  if (ruta === "/admin") {
    return adminActivo ? "admin" : "adminLogin";
  }

  if (ruta === "/pedido" || ruta === "/cliente") {
    return "cliente";
  }

  if (ruta === "/mesas") {
    return "mesas";
  }

  return "inicio";
}

function actualizarRuta(ruta) {
  if (window.location.pathname !== ruta) {
    window.history.pushState({}, "", ruta);
  }
}

export default function App() {
  const [vista, setVista] = useState(obtenerVistaInicial);
  const [adminTab, setAdminTab] = useState("pedidos");
  const [adminAutenticado, setAdminAutenticado] = useState(() => obtenerSesionActiva("rafikiAdminActivo"));
  const [claveAdmin, setClaveAdmin] = useState("");
  const [errorClaveAdmin, setErrorClaveAdmin] = useState("");
  const [rafaAutenticado, setRafaAutenticado] = useState(() => obtenerSesionActiva("rafikiRafaActivo"));
  const [claveRafa, setClaveRafa] = useState("");
  const [errorClaveRafa, setErrorClaveRafa] = useState("");
  const [menu, setMenu] = useState(normalizarMenu(menuFallback));
  const [pedidos, setPedidos] = useState([]);
  const [itemsPedido, setItemsPedido] = useState([crearItemNuevo()]);
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [tipoPago, setTipoPago] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [mesa, setMesa] = useState("Mesa 1");
  const [mesero, setMesero] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [filtroPedidos, setFiltroPedidos] = useState("hoy");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaISOColombia());
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "info" });
  const [mensajeMenu, setMensajeMenu] = useState({ texto: "", tipo: "info" });
  const [errorDatosPedido, setErrorDatosPedido] = useState("");
  const [pedidoFinalizado, setPedidoFinalizado] = useState(null);
  const [cargandoMenu, setCargandoMenu] = useState(true);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [guardandoMenu, setGuardandoMenu] = useState(false);
  const [guardandoEstadoPedidoId, setGuardandoEstadoPedidoId] = useState(null);
  const [recargaPedidos, setRecargaPedidos] = useState(0);
  const [pedidosRevisados, setPedidosRevisados] = useState(cargarPedidosRevisadosLocal);
  const [alertaPedidoNuevo, setAlertaPedidoNuevo] = useState(null);
  const [sonidoActivado, setSonidoActivado] = useState(false);
  const [platosTexto, setPlatosTexto] = useState("");
  const [acompanantesTexto, setAcompanantesTexto] = useState("");
  const mensajeTimer = useRef(null);
  const mensajeMenuTimer = useRef(null);
  const menuHashRef = useRef("");
  const pedidosRevisadosRef = useRef(pedidosRevisados);
  const audioCtxRef = useRef(null);
  const alertaPedidoTimer = useRef(null);

  function navegar(ruta, nuevaVista) {
    actualizarRuta(ruta);
    setVista(nuevaVista);
  }

  function mostrarMensaje(texto, tipo = "info") {
    if (mensajeTimer.current) {
      clearTimeout(mensajeTimer.current);
    }

    setMensaje({ texto, tipo });

    mensajeTimer.current = setTimeout(() => {
      setMensaje({ texto: "", tipo: "info" });
    }, 5000);
  }

  function mostrarMensajeMenu(texto, tipo = "info") {
    if (mensajeMenuTimer.current) {
      clearTimeout(mensajeMenuTimer.current);
    }

    setMensajeMenu({ texto, tipo });

    mensajeMenuTimer.current = setTimeout(() => {
      setMensajeMenu({ texto: "", tipo: "info" });
    }, 6000);
  }

  function irAElemento(id) {
    setTimeout(() => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 160);
  }

  useEffect(() => {
    pedidosRevisadosRef.current = pedidosRevisados;
    guardarPedidosRevisadosLocal(pedidosRevisados);
  }, [pedidosRevisados]);

  useEffect(() => {
    return () => {
      if (mensajeTimer.current) {
        clearTimeout(mensajeTimer.current);
      }

      if (mensajeMenuTimer.current) {
        clearTimeout(mensajeMenuTimer.current);
      }

      if (alertaPedidoTimer.current) {
        clearTimeout(alertaPedidoTimer.current);
      }
    };
  }, []);

  function activarSonidoPedidos() {
    setSonidoActivado(true);
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext && !audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      reproducirSonidoPedido();
      mostrarMensaje("Sonido de nuevos pedidos activado.", "success");
    } catch {
      mostrarMensaje("El navegador bloqueó el sonido. Toca de nuevo el botón de activar sonido.", "warning");
    }
  }

  function reproducirSonidoPedido() {
    if (!sonidoActivado) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const tiempos = [0, 0.18, 0.36];
      tiempos.forEach((inicio, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(index === 1 ? 880 : 660, ctx.currentTime + inicio);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + inicio);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + inicio + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + inicio);
        osc.stop(ctx.currentTime + inicio + 0.16);
      });
    } catch {
      // El aviso visual sigue funcionando aunque el sonido sea bloqueado.
    }
  }

  function mostrarAlertaPedidoNuevo(pedido) {
    setAlertaPedidoNuevo(pedido);
    if (alertaPedidoTimer.current) {
      clearTimeout(alertaPedidoTimer.current);
    }
    alertaPedidoTimer.current = setTimeout(() => setAlertaPedidoNuevo(null), 12000);
  }

  function marcarPedidoRevisado(id) {
    setPedidosRevisados((actual) => Array.from(new Set([...actual, String(id)])));
  }

  function marcarTodosPedidosRevisados() {
    const ids = pedidosFiltrados.map((pedido) => String(pedido.id));
    setPedidosRevisados((actual) => Array.from(new Set([...actual, ...ids])));
    setAlertaPedidoNuevo(null);
  }

  useEffect(() => {
    function manejarCambioRuta() {
      const vistaRuta = obtenerVistaInicial();
      setVista((vistaActual) => {
        if (vistaRuta === "adminLogin" && adminAutenticado && vistaActual === "admin") {
          return "admin";
        }

        return vistaRuta;
      });
    }

    window.addEventListener("popstate", manejarCambioRuta);
    return () => window.removeEventListener("popstate", manejarCambioRuta);
  }, [adminAutenticado]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda);
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const cargando = cargandoMenu || cargandoPedidos;

  const totalPedido = useMemo(() => calcularTotalItems(itemsPedido), [itemsPedido]);

  const hayProductoSeleccionado = useMemo(() => {
    return itemsPedido.some((item) => item.plato || item.proteina);
  }, [itemsPedido]);

  const pedidosOrdenados = useMemo(() => {
    return [...pedidos].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const q = busquedaDebounced.trim().toLowerCase();

    if (!q) return pedidosOrdenados;

    return pedidosOrdenados.filter((pedido) =>
      `${obtenerCliente(pedido)} ${pedido.telefono} ${pedido.ubicacion} ${pedido.tipo_pago} ${pedido.pedido_texto} ${obtenerEstadoPedido(pedido)}`
        .toLowerCase()
        .includes(q)
    );
  }, [pedidosOrdenados, busquedaDebounced]);

  const pedidosPendientes = useMemo(() => {
    return pedidosFiltrados.filter((pedido) => obtenerEstadoPedido(pedido) !== "Finalizado");
  }, [pedidosFiltrados]);

  const pedidosFinalizados = useMemo(() => {
    return pedidosFiltrados.filter((pedido) => obtenerEstadoPedido(pedido) === "Finalizado");
  }, [pedidosFiltrados]);

  const pedidosSinRevisar = useMemo(() => {
    const revisados = new Set(pedidosRevisados.map(String));
    return pedidosFiltrados.filter((pedido) => !revisados.has(String(pedido.id)));
  }, [pedidosFiltrados, pedidosRevisados]);

  const consolidado = useMemo(() => consolidarPedidos(pedidosFiltrados), [pedidosFiltrados]);

  const totalVendido = useMemo(() => {
    return pedidosFiltrados.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0);
  }, [pedidosFiltrados]);


  const platosAgrupados = useMemo(
    () => agruparPlatosPorCategoria(menu.platos_detalle),
    [menu.platos_detalle]
  );

  const tituloPedidos = useMemo(() => {
    if (filtroPedidos === "dia") return `Pedidos del ${fechaSeleccionada}`;
    return "Pedidos de hoy";
  }, [filtroPedidos, fechaSeleccionada]);

  const hayBusquedaPedidos = busqueda.trim().length > 0;

  const mensajeWhatsAppFinal = pedidoFinalizado ? crearMensajeWhatsAppPedido(pedidoFinalizado) : "";

  const linkWhatsAppFinal = pedidoFinalizado
    ? crearLinkWhatsApp(WHATSAPP_RAFIKI, mensajeWhatsAppFinal)
    : "#";

  useEffect(() => {
    let cancelado = false;

    async function cargarMenuSeguro() {
      setCargandoMenu(true);

      try {
        const { data: menuData, error: menuError } = await supabase
          .from("menu_diario")
          .select("*")
          .eq("activo", true)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelado) return;

        if (menuError) {
          mostrarMensaje(`Error cargando menú: ${menuError.message}`, "error");
          return;
        }

        if (menuData) {
          const menuNormalizado = normalizarMenu(menuData);
          const nuevoHash = JSON.stringify({
            id: menuNormalizado.id,
            fecha: menuNormalizado.fecha,
            titulo: menuNormalizado.titulo,
            descripcion: menuNormalizado.descripcion,
            platos_detalle: menuNormalizado.platos_detalle,
            acompanantes: menuNormalizado.acompanantes
          });

          if (menuHashRef.current !== nuevoHash) {
            menuHashRef.current = nuevoHash;
            setMenu(menuNormalizado);
            setPlatosTexto(platosATexto(menuNormalizado.platos_detalle));
            setAcompanantesTexto(acompanantesATexto(menuNormalizado.acompanantes));

            setItemsPedido((actual) => {
              const hayPedidoEnCurso = actual.some((item) => item.plato || item.proteina);
              return hayPedidoEnCurso ? actual : [crearItemNuevo()];
            });
          }
        } else {
          setPlatosTexto("");
          setAcompanantesTexto("");
        }
      } catch (error) {
        if (!cancelado) {
          mostrarMensaje(
            `No se pudo cargar el menú. Revisa la conexión e intenta recargar la página. ${error.message || ""}`.trim(),
            "error"
          );
        }
      } finally {
        if (!cancelado) {
          setCargandoMenu(false);
        }
      }
    }

    cargarMenuSeguro();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function cargarPedidosSeguro() {
      setCargandoPedidos(true);

      try {
        const rango = obtenerRangoPedidos(filtroPedidos, fechaSeleccionada);

        const { data: pedidosData, error: pedidosError } = await supabase
          .from("pedidos")
          .select("*")
          .gte("created_at", rango.inicio)
          .lt("created_at", rango.fin)
          .order("created_at", { ascending: true });

        if (cancelado) return;

        if (pedidosError) {
          mostrarMensaje(`Error cargando pedidos: ${pedidosError.message}`, "error");
          setPedidos([]);
          return;
        }

        setPedidos(pedidosData || []);
      } catch (error) {
        if (!cancelado) {
          mostrarMensaje(
            `No se pudieron cargar los pedidos. Revisa la conexión y usa el botón Actualizar pedidos. ${error.message || ""}`.trim(),
            "error"
          );
          setPedidos([]);
        }
      } finally {
        if (!cancelado) {
          setCargandoPedidos(false);
        }
      }
    }

    cargarPedidosSeguro();

    return () => {
      cancelado = true;
    };
  }, [filtroPedidos, fechaSeleccionada, recargaPedidos]);

  useEffect(() => {
    if (!adminAutenticado) return undefined;

    const canal = supabase
      .channel("rafiki-pedidos-tiempo-real")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos" },
        (payload) => {
          const nuevoPedido = payload.new;
          if (!nuevoPedido?.id) return;

          const hoy = pedidoEsDeHoy(nuevoPedido);
          const coincideConVista =
            filtroPedidos === "hoy"
              ? hoy
              : filtroPedidos === "dia"
                ? fechaISOColombia(new Date(nuevoPedido.created_at || Date.now())) === fechaSeleccionada
                : true;

          if (coincideConVista) {
            setPedidos((actual) => {
              if (actual.some((pedido) => pedido.id === nuevoPedido.id)) return actual;
              return [...actual, nuevoPedido];
            });
          }

          if (hoy && !pedidosRevisadosRef.current.map(String).includes(String(nuevoPedido.id))) {
            reproducirSonidoPedido();
            mostrarAlertaPedidoNuevo(nuevoPedido);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [adminAutenticado, filtroPedidos, fechaSeleccionada, sonidoActivado]);

  function actualizarItem(id, cambios) {
    setItemsPedido((actual) =>
      actual.map((item) => (item.id === id ? { ...item, ...cambios } : item))
    );
  }

  function cambiarPlatoItem(id, platoSeleccionado) {
    setItemsPedido((actual) =>
      actual.map((item) => {
        if (item.id !== id) return item;

        const esSopa = esCategoriaSopa(platoSeleccionado.categoria);

        return {
          ...item,
          categoria: platoSeleccionado.categoria || "",
          plato: platoSeleccionado.nombre || "",
          proteina: platoSeleccionado.nombre || "",
          precioPlato: Number(platoSeleccionado.precio) || 0,
          precioProteina: Number(platoSeleccionado.precio) || 0,
          acompanantes: esSopa ? [] : item.acompanantes || [],
          observacionAcompanantes: esSopa ? "" : item.observacionAcompanantes || ""
        };
      })
    );

    const esSopa = esCategoriaSopa(platoSeleccionado.categoria);

    if (esSopa) {
      irAElemento(`paso-cantidad-${id}`);
    } else {
      irAElemento(`paso-acompanantes-${id}`);
    }
  }

  function cambiarAcompananteItem(id, acompanante) {
    setItemsPedido((actual) =>
      actual.map((item) => {
        if (item.id !== id) return item;

        if (esCategoriaSopa(item.categoria)) {
          return {
            ...item,
            acompanantes: []
          };
        }

        const acompanantesActuales = Array.isArray(item.acompanantes) ? item.acompanantes : [];
        const seleccionado = acompanantesActuales.includes(acompanante);

        if (seleccionado) {
          return {
            ...item,
            acompanantes: acompanantesActuales.filter((x) => x !== acompanante)
          };
        }

        if (acompanantesActuales.length >= MAX_ACOMPANANTES_CLIENTE) {
          mostrarMensaje(
            `Solo puedes escoger ${MAX_ACOMPANANTES_CLIENTE} acompañantes por producto. La sopa y la bebida ya están incluidas.`,
            "warning"
          );
          return item;
        }

        const nuevosAcompanantes = [...acompanantesActuales, acompanante];

        if (nuevosAcompanantes.length === MAX_ACOMPANANTES_CLIENTE) {
          irAElemento(`paso-cantidad-${id}`);
        }

        return {
          ...item,
          acompanantes: nuevosAcompanantes
        };
      })
    );
  }

  function agregarAlmuerzo() {
    const nuevoItem = crearItemNuevo();

    setItemsPedido((actual) => [...actual, nuevoItem]);

    setTimeout(() => {
      const elemento = document.getElementById(`producto-${nuevoItem.id}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 160);
  }

  function eliminarAlmuerzo(id) {
    setItemsPedido((actual) =>
      actual.length === 1 ? actual : actual.filter((item) => item.id !== id)
    );
  }

  function reiniciarPedido() {
    setItemsPedido([crearItemNuevo()]);
    setCliente("");
    setTelefono("");
    setUbicacion("");
    setTipoPago("Efectivo");
    setObservaciones("");
    setPedidoFinalizado(null);
    setErrorDatosPedido("");
    setMensaje({ texto: "", tipo: "info" });
    irAElemento("inicio-pedido-cliente");
  }

  async function registrarPedido() {
    if (guardandoPedido) return;

    const itemsValidos = itemsPedido
      .filter((item) => item.plato || item.proteina)
      .map((item) => {
        const esSopa = esCategoriaSopa(item.categoria);

        return {
          ...item,
          acompanantes: esSopa ? [] : limpiarAcompanantesCliente(item.acompanantes || []),
          observacionAcompanantes: esSopa ? "" : (item.observacionAcompanantes || "").trim()
        };
      });

    if (itemsValidos.length === 0) {
      mostrarMensaje("Debes escoger al menos un producto.", "warning");
      return;
    }

    const camposFaltantes = [];

    if (!cliente.trim()) camposFaltantes.push("nombre");
    if (!telefono.trim()) camposFaltantes.push("teléfono");
    if (!ubicacion.trim()) camposFaltantes.push("ubicación");

    if (camposFaltantes.length > 0) {
      const textoError = `Falta ingresar: ${camposFaltantes.join(", ")}.`;
      const posicionActual = window.scrollY;

      setErrorDatosPedido(textoError);

      requestAnimationFrame(() => {
        window.scrollTo({ top: posicionActual, behavior: "auto" });
      });

      return;
    }

    setErrorDatosPedido("");

    const clienteNombre = limpiarTexto(cliente, 120);
    const telefonoLimpio = limpiarTelefono(telefono);
    const ubicacionLimpia = limpiarTexto(ubicacion, 200);
    const observacionesLimpias = limpiarTexto(observaciones, 500);

    if (!clienteNombre || !telefonoLimpio || !ubicacionLimpia) {
      setErrorDatosPedido("Revisa nombre, teléfono y ubicación. Hay datos inválidos o incompletos.");
      return;
    }

    const pedidoTexto = crearTextoPedido(itemsValidos, observacionesLimpias);
    const total = calcularTotalItems(itemsValidos);

    const nuevoPedido = {
      cliente: clienteNombre,
      cliente_nombre: clienteNombre,
      telefono: telefonoLimpio,
      ubicacion: ubicacionLimpia || "Ubicación pendiente",
      tipo_pago: tipoPago,
      observaciones: observacionesLimpias,
      items: itemsValidos,
      pedido_texto: pedidoTexto,
      total,
      estado: "Pendiente",
      enviado_whatsapp: false
    };

    setGuardandoPedido(true);

    try {
      const { data, error } = await supabase.from("pedidos").insert(nuevoPedido).select().single();

      if (error) {
        mostrarMensaje(`Error guardando pedido: ${error.message}`, "error");
        return;
      }

      if (filtroPedidos === "hoy" || filtroPedidos === "dia") {
        setPedidos((actual) => [...actual, data]);
      }

      setPedidoFinalizado(data);
      setMensaje({ texto: "", tipo: "info" });
      setVista("confirmacion");
    } finally {
      setGuardandoPedido(false);
    }
  }

  async function registrarPedidoMesa({ items, acompanantes, mesa, mesero, observaciones: obsMesa }) {
    if (guardandoPedido) return false;

    const itemsValidos = (Array.isArray(items) ? items : [])
      .filter((item) => item.plato || item.proteina || item.producto)
      .map((item) => {
        if (item.categoria === "cafeteria") {
          return {
            ...item,
            paraLlevar: false
          };
        }

        return {
          ...item,
          acompanantes: limpiarAcompanantesMenu(
            Array.isArray(item.acompanantes) && item.acompanantes.length > 0
              ? item.acompanantes
              : acompanantes || []
          ),
          observacionAcompanantes: "",
          paraLlevar: false
        };
      });

    if (itemsValidos.length === 0) {
      mostrarMensaje("Agrega al menos un producto al pedido de mesa.", "warning");
      return false;
    }

    const mesaLimpia = limpiarTexto(mesa, 40) || "Mesa 1";
    const meseroLimpio = limpiarTexto(mesero, 80) || "Mesero";
    const observacionesLimpias = limpiarTexto(obsMesa, 500);
    const pedidoTexto = crearTextoPedido(itemsValidos, observacionesLimpias);
    const total = calcularTotalItems(itemsValidos);

    const nuevoPedido = {
      cliente: mesaLimpia,
      cliente_nombre: mesaLimpia,
      telefono: "",
      ubicacion: mesaLimpia,
      tipo_pago: "Mesa",
      tipo_pedido: "mesa",
      mesa: mesaLimpia,
      mesero: meseroLimpio,
      observaciones: observacionesLimpias,
      items: itemsValidos,
      pedido_texto: pedidoTexto,
      total,
      estado: "Pendiente",
      enviado_whatsapp: false
    };

    setGuardandoPedido(true);

    try {
      const { data, error } = await supabase.from("pedidos").insert(nuevoPedido).select().single();

      if (error) {
        mostrarMensaje(`Error guardando pedido de mesa: ${error.message}`, "error");
        return false;
      }

      if (filtroPedidos === "hoy" || filtroPedidos === "dia") {
        setPedidos((actual) => [...actual, data]);
      }

      mostrarMensaje(`Pedido enviado a cocina para ${mesaLimpia}.`, "success");
      return true;
    } finally {
      setGuardandoPedido(false);
    }
  }

  async function guardarMenu() {
    if (guardandoMenu) return;

    setMensajeMenu({ texto: "", tipo: "info" });

    const resultadoPlatos = textoAPlatosDetalle(platosTexto, { estricto: true });
    const acompanantes = limpiarAcompanantesMenu(listaPorLineas(acompanantesTexto));

    if (resultadoPlatos.errores.length > 0) {
      mostrarMensajeMenu(
        `No se puede guardar el menú. Corrige:\n${resultadoPlatos.errores.slice(0, 5).join("\n")}`,
        "error"
      );
      return;
    }

    if (resultadoPlatos.platos.length === 0) {
      mostrarMensajeMenu(
        "Debes agregar al menos un plato del día con el formato Categoría | Plato:Precio.",
        "warning"
      );
      return;
    }

    const menuActualizado = {
      fecha: menu.fecha,
      titulo: menu.titulo,
      descripcion: menu.descripcion,
      precio: Number(resultadoPlatos.platos[0]?.precio) || 0,
      proteinas: resultadoPlatos.platos.map((item) => item.nombre),
      proteinas_detalle: resultadoPlatos.platos.map((item) => ({
        nombre: item.nombre,
        precio: item.precio
      })),
      platos_detalle: resultadoPlatos.platos,
      acompanantes,
      activo: true
    };

    setGuardandoMenu(true);

    try {
      let data;

      if (menu.id) {
        const respuesta = await supabase
          .from("menu_diario")
          .update(menuActualizado)
          .eq("id", menu.id)
          .select()
          .single();

        if (respuesta.error) {
          mostrarMensajeMenu(`Error guardando menú: ${respuesta.error.message}`, "error");
          return;
        }

        data = respuesta.data;
      } else {
        const respuesta = await supabase
          .from("menu_diario")
          .insert(menuActualizado)
          .select()
          .single();

        if (respuesta.error) {
          mostrarMensajeMenu(`Error creando menú: ${respuesta.error.message}`, "error");
          return;
        }

        data = respuesta.data;
      }

      const { error: errorDesactivar } = await supabase
        .from("menu_diario")
        .update({ activo: false })
        .eq("activo", true)
        .neq("id", data.id);

      if (errorDesactivar) {
        mostrarMensajeMenu(`El menú se guardó, pero no se pudieron desactivar menús anteriores: ${errorDesactivar.message}`, "warning");
      }

      const nuevoMenu = normalizarMenu(data);
      setMenu(nuevoMenu);
      setItemsPedido([crearItemNuevo()]);
      setPlatosTexto(platosATexto(nuevoMenu.platos_detalle));
      setAcompanantesTexto(acompanantesATexto(nuevoMenu.acompanantes));
      mostrarMensajeMenu(menu.id ? "Menú actualizado correctamente." : "Menú creado correctamente.", "success");
    } finally {
      setGuardandoMenu(false);
    }
  }

  async function cambiarEstadoPedido(id, estado) {
    if (guardandoEstadoPedidoId) return;

    const estadoNuevo = estado === "Finalizado" ? "Finalizado" : "Pendiente";
    const pedidoActual = pedidos.find((pedido) => pedido.id === id);
    const estadoActual = obtenerEstadoPedido(pedidoActual || {});

    if (estadoNuevo === estadoActual) return;

    if (estadoNuevo === "Finalizado") {
      const codigoPedido = pedidoActual ? obtenerCodigoPedido(pedidoActual) : "";
      const confirmar = window.confirm(
        `¿Marcar el pedido #${codigoPedido} como finalizado?`
      );

      if (!confirmar) return;
    }

    setGuardandoEstadoPedidoId(id);

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .update({ estado: estadoNuevo })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        mostrarMensaje(`Error cambiando estado: ${error.message}`, "error");
        return;
      }

      setPedidos((actual) => actual.map((pedido) => (pedido.id === id ? data : pedido)));
      mostrarMensaje(`Pedido #${obtenerCodigoPedido(data)} marcado como ${estadoNuevo}.`, "success");
    } finally {
      setGuardandoEstadoPedidoId(null);
    }
  }

  function abrirPanelAdmin() {
    setErrorClaveAdmin("");
    setRafaAutenticado(false);
    setClaveRafa("");
    setErrorClaveRafa("");

    if (adminAutenticado) {
      navegar("/admin", "admin");
      return;
    }

    navegar("/admin", "adminLogin");
  }

  function validarClaveAdmin(e) {
    e.preventDefault();

    if (!CLAVE_ADMIN) {
      setErrorClaveAdmin("Falta configurar VITE_CLAVE_ADMIN en las variables de entorno.");
      return;
    }

    if (claveAdmin.trim() === CLAVE_ADMIN) {
      guardarSesionTemporal("rafikiAdminActivo");
      setAdminAutenticado(true);
      setClaveAdmin("");
      setErrorClaveAdmin("");
      navegar("/admin", "admin");
      return;
    }

    setErrorClaveAdmin("Clave incorrecta. Inténtalo nuevamente.");
  }

  function validarClaveRafa(e) {
    e.preventDefault();

    if (!CLAVE_RAFA) {
      setErrorClaveRafa("Falta configurar VITE_CLAVE_RAFA en las variables de entorno.");
      return;
    }

    if (claveRafa.trim() === CLAVE_RAFA) {
      guardarSesionTemporal("rafikiRafaActivo");
      setRafaAutenticado(true);
      setClaveRafa("");
      setErrorClaveRafa("");
      return;
    }

    setErrorClaveRafa("Clave incorrecta. Inténtalo nuevamente.");
  }

  function cerrarPanelRafa() {
    localStorage.removeItem("rafikiRafaActivo");
    setRafaAutenticado(false);
    setClaveRafa("");
    setErrorClaveRafa("");
  }

  function cerrarPanelAdmin() {
    localStorage.removeItem("rafikiAdminActivo");
    localStorage.removeItem("rafikiRafaActivo");
    setAdminAutenticado(false);
    setClaveAdmin("");
    setErrorClaveAdmin("");
    navegar("/admin", "adminLogin");
  }

  function nuevoPedidoCliente() {
    reiniciarPedido();
    navegar("/", "cliente");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Nunito', Arial, sans-serif; background: #fff7ed; color: #292524; }
        button, input, textarea, select { font-family: inherit; }
        button { cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; }
        button:active:not(:disabled) { transform: scale(0.97); }
        button:disabled { cursor: not-allowed; opacity: 0.6; }
        .app { min-height: 100vh; background: radial-gradient(ellipse at top left, #fed7aa 0, transparent 40%), radial-gradient(ellipse at bottom right, #fde68a 0, transparent 35%), linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%); padding: 24px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
        .brand { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg,#f97316,#f59e0b); color: white; padding: 8px 16px; border-radius: 999px; font-weight: 900; margin-bottom: 10px; font-size: 15px; box-shadow: 0 4px 12px rgba(249,115,22,0.3); }
        h1 { margin: 0; font-family: 'Fraunces', serif; font-size: clamp(30px, 5vw, 52px); line-height: 1; letter-spacing: -1.5px; }
        h2, h3, h4, h5, p { margin-top: 0; }
        .muted { color: #78716c; }
        .small { font-size: 13px; }
        .nav { display: flex; gap: 6px; background: #ffffff; border: 1px solid #fed7aa; padding: 6px; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
        .nav button { border: 0; padding: 12px 18px; border-radius: 14px; font-weight: 900; background: transparent; color: #57534e; }
        .nav button.active { background: #f97316; color: #fff; box-shadow: 0 4px 10px rgba(249,115,22,0.3); }
        .alert { white-space: pre-line; padding: 14px 18px; border-radius: 18px; margin-bottom: 18px; font-weight: 700; border: 1px solid transparent; animation: fadeInUp 0.3s ease; }
        .alert-info { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .alert-success { background: #ecfdf5; color: #166534; border-color: #bbf7d0; }
        .alert-warning { background: #fffbeb; color: #92400e; border-color: #fde68a; }
        .alert-error { background: #fef2f2; color: #991b1b; border-color: #991b1b; }
        .menu-action-message { margin-top: 14px; margin-bottom: 0; }
        .card { background: #ffffff; border: 1px solid #fed7aa; border-radius: 32px; box-shadow: 0 18px 40px rgba(0,0,0,0.08); overflow: hidden; }
        .card-pad { padding: 24px; }
        .welcome { max-width: 820px; margin: 0 auto; text-align: center; }
        .welcome-card { background: linear-gradient(145deg, #ea580c, #f97316 40%, #f59e0b); color: white; border-radius: 36px; padding: 48px 32px 40px; box-shadow: 0 32px 80px rgba(249,115,22,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset; position: relative; overflow: hidden; }
        .welcome-card::before { content: ''; position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; background: rgba(255,255,255,0.07); border-radius: 50%; }
        .welcome-card::after { content: ''; position: absolute; bottom: -60px; left: -30px; width: 260px; height: 260px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .welcome-logo { width: 135px; height: 135px; object-fit: contain; background: #ffffff; border-radius: 24px; padding: 10px; margin-bottom: 20px; box-shadow: 0 16px 36px rgba(0,0,0,0.2); position: relative; z-index: 1; }
        .welcome-card h2 { font-family: 'Fraunces', serif; font-size: clamp(36px, 7vw, 66px); margin-bottom: 12px; line-height: 0.92; position: relative; z-index: 1; }
        .welcome-card p { color: rgba(255,255,255,0.88); font-size: 17px; margin-bottom: 8px; position: relative; z-index: 1; }
        .welcome-menu-preview { background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.25); border-radius: 18px; padding: 14px 20px; margin: 20px 0 28px; display: inline-block; text-align: left; position: relative; z-index: 1; }
        .welcome-menu-preview .label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; margin-bottom: 4px; }
        .welcome-menu-preview .menu-name { font-size: 18px; font-weight: 900; }
        .welcome-menu-preview .menu-price { font-size: 13px; opacity: 0.85; margin-top: 2px; }
        .welcome-button { display: inline-flex; justify-content: center; align-items: center; gap: 10px; width: min(100%, 420px); border: 0; background: #ffffff; color: #c2410c; padding: 20px 28px; border-radius: 22px; font-size: 20px; font-weight: 900; text-decoration: none; box-shadow: 0 16px 36px rgba(0,0,0,0.18); position: relative; z-index: 1; letter-spacing: -0.3px; }
        .welcome-button:hover { transform: translateY(-2px); box-shadow: 0 22px 44px rgba(0,0,0,0.22); }
        .admin-small { margin-top: 18px; border: 0; background: transparent; color: #78716c; font-weight: 800; text-decoration: underline; font-size: 13px; }
        .hero { background: linear-gradient(145deg, #ea580c, #f97316 50%, #f59e0b); color: white; padding: 36px 32px; position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -30px; right: -30px; width: 160px; height: 160px; background: rgba(255,255,255,0.06); border-radius: 50%; }
        .hero.green { background: linear-gradient(145deg, #16a34a, #22c55e 50%, #4ade80); }
        .hero p:first-child { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; opacity: 0.75; margin-bottom: 8px; }
        .hero h2 { font-family: 'Fraunces', serif; font-size: clamp(26px, 4vw, 40px); margin-bottom: 8px; line-height: 1.05; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
        .layout { display: grid; grid-template-columns: 1fr 400px; gap: 22px; align-items: start; }
        .admin-tabs { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 18px; background: #fff; border: 1px solid #fed7aa; border-radius: 22px; padding: 8px; }
        .admin-tabs button { width: 100%; border: 0; border-radius: 16px; padding: 14px 12px; background: transparent; font-weight: 900; color: #57534e; line-height: 1.15; min-height: 48px; }
        .admin-tabs button.active { background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; box-shadow: 0 4px 12px rgba(249,115,22,0.3); }
        .admin-layout { display: grid; grid-template-columns: 1fr; gap: 22px; }
        .admin-top-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
        .admin-actions-stack { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .button.warning { background: linear-gradient(135deg, #f79e1c, #f97316); color: #fff; border: none; box-shadow: 0 8px 18px rgba(247,158,28,0.28); }
        .button.warning:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(247,158,28,0.34); }
        .alerta-pedido-nuevo { display: flex; justify-content: space-between; gap: 14px; align-items: center; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 2px solid #f79e1c; border-radius: 24px; padding: 16px 18px; margin: 12px 0 16px; box-shadow: 0 12px 30px rgba(247,158,28,0.18); animation: pulseAlert 1.2s ease-in-out infinite; }
        .alerta-pedido-nuevo strong { display: block; color: #9a3412; font-family: 'Fraunces', serif; font-size: 20px; }
        .alerta-pedido-nuevo span { display: block; color: #7c2d12; margin-top: 4px; }
        .alerta-pedido-nuevo button { border: none; border-radius: 999px; padding: 10px 14px; font-weight: 900; color: white; background: #f97316; cursor: pointer; }
        .contador-sin-revisar { display: flex; justify-content: space-between; align-items: center; gap: 14px; background: #fff; border: 1px solid #fed7aa; border-radius: 24px; padding: 14px 16px; margin-bottom: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
        .contador-sin-revisar span { display: block; color: #7c2d12; font-weight: 800; }
        .contador-sin-revisar strong { color: #f79e1c; font-size: 34px; font-family: 'Fraunces', serif; line-height: 1; }
        .badge-nuevo { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
        .admin-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 12px 0 16px; }
        .soft-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 18px; padding: 16px; }
        .simple-list { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 8px; }
        .simple-list li { display: flex; justify-content: space-between; gap: 12px; align-items: center; background: white; border: 1px solid #ffedd5; border-radius: 12px; padding: 10px 12px; }
        .section { padding: 24px; }
        .meal-card { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 28px; padding: 20px; margin-bottom: 18px; scroll-margin-top: 18px; animation: fadeInUp 0.28s ease; }
        .fade-step { animation: fadeInUp 0.25s ease; scroll-margin-top: 18px; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .row { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
        .button { border: 0; background: linear-gradient(135deg, #f97316, #fb923c); color: white; font-weight: 900; padding: 14px 18px; border-radius: 16px; box-shadow: 0 6px 16px rgba(249,115,22,0.28); letter-spacing: -0.2px; }
        .button.green { background: linear-gradient(135deg, #16a34a, #22c55e); box-shadow: 0 6px 16px rgba(34,197,94,0.25); }
        .button.light { background: #fff; color: #44403c; border: 1px solid #e7e5e4; box-shadow: none; }
        .button.danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; box-shadow: none; }
        .button.disabled { opacity: 0.6; pointer-events: auto; }
        .button.add-meal { width: 100%; margin-top: 4px; margin-bottom: 18px; }

        .mesa-pos-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; padding: 12px 14px; border-radius: 22px; background: linear-gradient(135deg, #fff7ed, #fffbeb); border: 1px solid #fed7aa; }
        .mesa-pos-header h2 { margin: 2px 0 0; font-size: 20px; color: #7c2d12; letter-spacing: -0.02em; }
        .mesa-pos-kicker { font-size: 12px; font-weight: 900; color: #ea580c; text-transform: uppercase; letter-spacing: 0.08em; }
        .mesa-pos-pill { flex-shrink: 0; background: #fff; color: #7c2d12; border: 1px solid #fed7aa; border-radius: 999px; padding: 9px 12px; font-weight: 900; box-shadow: 0 8px 18px rgba(124,45,18,0.08); }
        .mesa-step-strip { position: sticky; top: 8px; z-index: 6; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; align-items: center; margin: 0 0 16px; padding: 10px; background: rgba(255,255,255,0.96); border: 1px solid #fed7aa; border-radius: 20px; box-shadow: 0 10px 24px rgba(15,23,42,0.08); backdrop-filter: blur(8px); }
        .mesa-step-strip span, .mesa-step-strip strong { border-radius: 999px; padding: 8px 9px; text-align: center; font-size: 12px; font-weight: 900; background: #f3f4f6; color: #6b7280; }
        .mesa-step-strip span.active { background: #ffedd5; color: #9a3412; }
        .mesa-step-strip strong { grid-column: 1 / -1; background: #16a34a; color: #fff; font-size: 13px; }
        .pos-selected-dish { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .pos-next-hint { margin-top: 10px; padding: 10px 12px; border-radius: 16px; background: #ecfdf5; color: #166534; font-weight: 900; text-align: center; }
        .pos-primary-action { font-size: 17px; padding: 16px 18px; border-radius: 20px; box-shadow: 0 10px 22px rgba(22,163,74,0.22); }
        .mesas-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
        .mesas-tab { border: 2px solid #fed7aa; background: #fff7ed; color: #9a3412; border-radius: 22px; padding: 16px 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 18px rgba(249,115,22,0.08); cursor: pointer; }
        .mesas-tab.cafeteria { border-color: #fde68a; background: #fffbeb; color: #92400e; }
        .mesas-tab.active { background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; border-color: transparent; }
        .mesas-tab.cafeteria.active { background: linear-gradient(135deg, #92400e, #b45309); color: #fff; }
        .cafeteria-placeholder { padding: 8px 0 4px; }
        .cafeteria-placeholder h2 { margin-bottom: 8px; text-align: center; color: #92400e; }
        .cafeteria-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
        .cafeteria-card { border: 1px solid #fde68a; background: #fffbeb; color: #78350f; border-radius: 20px; padding: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; text-align: center; min-height: 72px; }
        .cafeteria-button { cursor: pointer; font: inherit; flex-direction: column; }
        .cafeteria-button.active { background: #f59e0b; color: #fff; border-color: #f59e0b; box-shadow: 0 10px 22px rgba(245,158,11,0.22); }
        .cafeteria-panel { margin-top: 16px; border: 1px solid #fde68a; background: #fffdf5; border-radius: 22px; padding: 16px; display: grid; gap: 12px; }
        .cafeteria-panel h3 { margin: 0; color: #92400e; font-family: 'Fraunces', serif; font-size: 24px; }
        .cafeteria-panel h4 { margin: 4px 0 0; color: #57534e; }
        .cafeteria-actions { align-items: stretch; }
        .continue-button { width: 100%; margin-top: 16px; background: linear-gradient(135deg, #16a34a, #22c55e); box-shadow: 0 6px 16px rgba(34,197,94,0.25); }
        .continue-button + .field { margin-top: 14px; }
        .summary-continue { width: 100%; margin: 12px 0 6px; background: linear-gradient(135deg, #16a34a, #22c55e); box-shadow: 0 6px 16px rgba(34,197,94,0.22); }
        .small-reset { display: block; width: fit-content; margin: 8px auto 0; font-size: 12px; padding: 8px 12px; border-radius: 999px; color: #b91c1c; border-color: #fecaca; box-shadow: none; background: #fff; }
        .link-button { display: block; text-align: center; text-decoration: none; }
        .step-title { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; background: #fff; border: 1px solid #fed7aa; border-radius: 22px; padding: 16px; box-shadow: 0 8px 18px rgba(249,115,22,0.08); }
        .step-title h4 { font-size: 21px; line-height: 1.1; margin-bottom: 6px; color: #c2410c; font-family: 'Fraunces', serif; }
        .step-title p { font-size: 15px; }
        .step-number { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 999px; background: linear-gradient(135deg, #f97316, #f59e0b); color: white; font-weight: 900; font-size: 20px; flex: 0 0 auto; box-shadow: 0 8px 18px rgba(249,115,22,0.25); }
        .selected-dish { background: #ecfdf5; border: 1px solid #86efac; color: #166534; border-radius: 18px; padding: 12px 14px; margin-bottom: 16px; font-weight: 900; display: flex; align-items: center; gap: 8px; }
        .selected-dish::before { content: '✓'; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #22c55e; color: white; border-radius: 50%; font-size: 13px; flex-shrink: 0; }
        .category-block { margin-bottom: 20px; border: 1px solid #fed7aa; border-radius: 24px; padding: 16px; background: #fffaf0; }
        .category-title { font-size: 20px; margin-bottom: 12px; color: #c2410c; font-weight: 900; display: flex; align-items: center; gap: 8px; }
        .option-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .product-card .option, .cafeteria-panel .option, .product-card .chip, .cafeteria-panel .chip { min-height: 52px; font-size: 15px; }
        .product-card .option { border-width: 2px; }
        .cafeteria-card { transition: transform .15s ease, box-shadow .15s ease; }
        .cafeteria-card:active, .option:active, .chip:active, .mesas-tab:active { transform: scale(0.98); }
        .option { text-align: left; border: 1.5px solid #e7e5e4; background: #fff; border-radius: 18px; padding: 14px; font-weight: 900; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
        .option:hover { border-color: #fdba74; background: #fff7ed; }
        .option small { display: block; margin-top: 6px; color: #ea580c; font-size: 16px; font-weight: 900; }
        .option.selected { border-color: #f97316; color: #c2410c; background: #fff7ed; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
        .option.selected::after { content: '✓'; float: right; color: #f97316; font-size: 18px; }
        .chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .chip { border: 1.5px solid #e7e5e4; background: #fff; border-radius: 999px; padding: 10px 16px; font-weight: 900; transition: all 0.15s; }
        .chip:hover:not(:disabled) { border-color: #86efac; background: #f0fdf4; }
        .chip.selected { border-color: #22c55e; background: #dcfce7; color: #15803d; box-shadow: 0 0 0 2px rgba(34,197,94,0.15); }
        .chip.blocked { background: #f5f5f4; color: #a8a29e; }
        .box { background: #fff; border: 1px solid #e7e5e4; border-radius: 18px; padding: 14px; }
        .compact-info { padding: 10px 12px; border-radius: 14px; font-size: 14px; background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
        .pedido-paso-compacto { display: grid; gap: 10px; }
        .compact-box { padding: 10px 12px; border-radius: 14px; }
        .quantity-box { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .quantity-box strong, .takeout-box strong { font-size: 14px; }
        .takeout-box { cursor: pointer; }
        .box.soft { background: #fafaf9; }
        .field { display: block; margin-bottom: 14px; }
        .field span { display: block; font-weight: 900; margin-bottom: 8px; font-size: 15px; }
        .field input, .field textarea, .field select, select.box { width: 100%; border: 1.5px solid #e7e5e4; background: #fafaf9; border-radius: 16px; padding: 13px 14px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .pedido-paso-compacto .field { margin-bottom: 0; }
        .pedido-paso-compacto .field span { font-size: 14px; margin-bottom: 6px; }
        .pedido-paso-compacto .field textarea { min-height: 58px; padding: 10px 12px; border-radius: 14px; }
        .field input:focus, .field textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); background: #fff; }
        .quantity { display: flex; align-items: center; gap: 12px; }
        .quantity button { width: 40px; height: 40px; border-radius: 999px; border: 1.5px solid #e7e5e4; background: #fff; font-size: 22px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        .pedido-paso-compacto .quantity { gap: 8px; }
        .pedido-paso-compacto .quantity button { width: 32px; height: 32px; font-size: 18px; }
        .pedido-paso-compacto .quantity strong { min-width: 20px; text-align: center; }
        .quantity button:hover { border-color: #f97316; color: #f97316; }
        .summary-item { background: #fff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 12px; margin-bottom: 10px; font-weight: 700; }
        .total-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e7e5e4; margin-top: 14px; padding-top: 14px; font-weight: 900; }
        .total-row strong { color: #ea580c; font-size: 26px; }
        .compact-total-row { margin-top: 2px; padding-top: 10px; }
        .compact-total-row strong { font-size: 22px; }
        .mini-pending { display: inline-flex; align-items: center; gap: 8px; background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; border-radius: 999px; padding: 9px 13px; font-weight: 900; margin: 12px 0 16px; }
        .mini-pending strong { background: #f97316; color: #fff; min-width: 28px; height: 28px; border-radius: 999px; display: inline-flex; justify-content: center; align-items: center; }
        .filtros-historial { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0 6px; align-items: center; }
        .filtros-historial button { border: 1px solid #fed7aa; background: #fff; color: #c2410c; padding: 10px 14px; border-radius: 999px; font-weight: 900; }
        .filtros-historial button.active { background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; box-shadow: 0 4px 10px rgba(249,115,22,0.25); }
        .calendario-filtro { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #fed7aa; border-radius: 999px; padding: 8px 12px; color: #c2410c; font-weight: 900; }
        .calendario-filtro span { font-size: 13px; }
        .calendario-filtro input { border: 0; outline: none; background: transparent; color: #44403c; font-weight: 800; padding: 0; }
        .pedido-seccion { margin-bottom: 26px; }
        .section-heading { display: flex; justify-content: space-between; align-items: center; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 22px; padding: 16px 18px; margin-bottom: 14px; }
        .section-heading h3 { margin: 0; color: #c2410c; font-family: 'Fraunces', serif; }
        .section-heading span { background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; min-width: 34px; height: 34px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 10px rgba(249,115,22,0.3); }
        .bottom-summary { display: grid; grid-template-columns: 1.4fr 1fr; gap: 18px; margin-top: 18px; }
        .summary-cards { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .summary-card { background: #fff; border: 1px solid #fed7aa; border-radius: 24px; padding: 18px; transition: box-shadow 0.15s; }
        .summary-card:hover { box-shadow: 0 8px 24px rgba(249,115,22,0.1); }
        .summary-card.compact { padding: 15px; }
        .summary-card span { color: #78716c; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0px; }
        .summary-card strong { display: block; color: #ea580c; font-size: 28px; margin-top: 6px; font-family: 'Fraunces', serif; }
        .productos-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .producto-solicitud { background: #fff; border: 1px solid #fed7aa; border-radius: 18px; padding: 14px; }
        .producto-solicitud strong { display: block; color: #292524; margin-bottom: 10px; }
        .producto-controls { display: grid; grid-template-columns: 1fr 120px; gap: 8px; margin-bottom: 8px; }
        .producto-controls input, .producto-controls select, .producto-solicitud textarea { width: 100%; border: 1.5px solid #e7e5e4; background: #fafaf9; border-radius: 14px; padding: 11px 12px; outline: none; font-family: inherit; }
        .producto-solicitud textarea { min-height: 42px; resize: vertical; }
        .productos-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
        .producto-chip { border: 1.5px solid #e7e5e4; background: #fff; border-radius: 999px; padding: 10px 14px; font-weight: 900; color: #44403c; box-shadow: none; }
        .producto-chip:hover { border-color: #fdba74; background: #fff7ed; }
        .producto-chip.selected { border-color: #22c55e; background: #dcfce7; color: #15803d; box-shadow: 0 0 0 2px rgba(34,197,94,0.12); }
        .producto-chip-wrap { display: inline-flex; align-items: center; gap: 4px; }
        .producto-add-row, .producto-delete-row { display: grid; grid-template-columns: minmax(180px, 1fr) 170px auto; gap: 8px; align-items: center; margin-top: 10px; }
        .producto-delete-row { grid-template-columns: minmax(220px, 1fr) auto; }
        .producto-add-row input, .producto-add-row select, .producto-delete-row select { width: 100%; border: 1.5px solid #e7e5e4; background: #fafaf9; border-radius: 14px; padding: 11px 12px; outline: none; font-family: inherit; }
        .productos-seleccionados-lista { display: grid; gap: 7px; margin: 10px 0; }
        .producto-seleccionado-row { display: grid; grid-template-columns: minmax(120px, 1.1fr) 70px 88px minmax(110px, 1fr) auto; gap: 6px; align-items: center; background: #fff; border: 1px solid #fed7aa; border-radius: 15px; padding: 7px; }
        .producto-seleccionado-row strong { color: #292524; font-size: 14px; line-height: 1.1; }
        .producto-seleccionado-row input, .producto-seleccionado-row select { width: 100%; border: 1.5px solid #e7e5e4; background: #fafaf9; border-radius: 12px; padding: 8px 9px; outline: none; font-family: inherit; font-size: 13px; }
        .producto-seleccionado-row input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); background: #fff; }
        .producto-seleccionado-row .button { padding: 8px 10px; font-size: 12px; border-radius: 12px; }
        .solicitud-preview { white-space: pre-wrap; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 18px; padding: 16px; font-size: 14px; margin-top: 14px; }

        .pedidos-tabla-wrap { width: 100%; overflow-x: auto; border: 1px solid #fed7aa; border-radius: 18px; background: #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
        .pedidos-tabla-compacta { width: 100%; border-collapse: collapse; min-width: 1080px; font-size: 12px; }
        .pedidos-tabla-compacta th { position: sticky; top: 0; z-index: 1; background: #fff7ed; color: #9a3412; text-align: left; padding: 9px 8px; border-bottom: 1px solid #fed7aa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
        .pedidos-tabla-compacta td { vertical-align: top; padding: 8px; border-bottom: 1px solid #f5f5f4; color: #44403c; line-height: 1.25; }
        .pedidos-tabla-compacta tr:last-child td { border-bottom: 0; }
        .pedidos-tabla-compacta tr.fila-nueva { background: #fff7ed; box-shadow: inset 4px 0 0 #f79e1c; }
        .pedidos-tabla-compacta tr.fila-finalizada { background: #f0fdf4; opacity: 0.82; }
        .td-codigo strong { display: block; color: #c2410c; font-size: 13px; }
        .td-codigo span { display: inline-block; margin-top: 3px; background: #f79e1c; color: white; border-radius: 999px; padding: 2px 6px; font-size: 10px; font-weight: 900; }
        .pedidos-tabla-compacta td small { display: block; color: #78716c; margin-top: 2px; font-size: 11px; }
        .td-pedido { max-width: 360px; font-weight: 700; }
        .td-obs { max-width: 190px; color: #7c2d12; }
        .td-total { color: #16a34a; font-weight: 900; white-space: nowrap; }
        .pedidos-tabla-compacta select { width: 118px; border: 1px solid #e7e5e4; border-radius: 10px; padding: 7px 8px; background: #fafaf9; font-size: 12px; font-weight: 800; }
        .td-acciones { min-width: 94px; }
        .mini-btn { display: block; width: 100%; margin-bottom: 5px; border: 1px solid #e7e5e4; border-radius: 10px; padding: 6px 8px; background: #fff; color: #44403c; font-size: 11px; font-weight: 900; text-align: center; text-decoration: none; box-shadow: none; }
        .mini-btn.warning { background: #f79e1c; border-color: #f79e1c; color: #fff; }
        .mini-btn.green { background: #16a34a; border-color: #16a34a; color: #fff; }
        .mini-btn.print { background: #111827; border-color: #111827; color: #fff; }
        .pedido-cocina { border: 1px solid #fed7aa; background: #fff; border-radius: 26px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); overflow: hidden; animation: fadeInUp 0.25s ease; }
        .pedido-sin-revisar { border: 3px solid #f79e1c; box-shadow: 0 12px 34px rgba(247,158,28,0.22); }
        .pedido-finalizado { opacity: 0.7; }
        .pedido-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; }
        .pedido-header-pending { background: linear-gradient(135deg, #f97316, #fb923c); }
        .pedido-header-finalizado { background: linear-gradient(135deg, #16a34a, #22c55e); }
        .pedido-header-title { font-weight: 900; color: white; font-size: 15px; }
        .pedido-header-right { display: flex; align-items: center; gap: 8px; }
        .pedido-body { padding: 16px 18px; }
        .pedido-top { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; border-bottom: 1px solid #f5f5f4; padding-bottom: 14px; margin-bottom: 14px; }
        .pedido-linea { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .pedido-id { font-weight: 900; color: #78716c; font-size: 13px; }
        .pedido-total { text-align: right; }
        .pedido-total span { display: block; color: #78716c; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0px; }
        .pedido-total strong { color: #ea580c; font-size: 26px; font-family: 'Fraunces', serif; }
        .pedido-cliente-nombre { font-size: 20px; font-weight: 900; color: #292524; margin: 0 0 6px; font-family: 'Fraunces', serif; }
        .pedido-meta { font-size: 13px; color: #78716c; display: flex; flex-direction: column; gap: 2px; }
        .items-cocina { display: grid; gap: 12px; }
        .item-cocina { display: grid; grid-template-columns: 48px 1fr; gap: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 20px; padding: 14px; }
        .item-numero { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; border-radius: 14px; font-weight: 900; box-shadow: 0 4px 10px rgba(249,115,22,0.25); }
        .item-detalle h4 { margin-bottom: 8px; font-size: 18px; color: #c2410c; }
        .item-detalle p { margin-bottom: 5px; font-size: 14px; }
        .nota-cocina { margin-top: 12px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 16px; padding: 12px; }
        .pedido-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
        .pedido-actions select { border: 1.5px solid #e7e5e4; border-radius: 16px; padding: 13px 14px; background: #fafaf9; font-weight: 800; outline: none; }
        .pedido-text { white-space: pre-line; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 16px; padding: 12px; font-weight: 700; margin-top: 12px; }
        .badge { border: 1px solid transparent; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 900; }
        .badge-pendiente { background: rgba(254,243,199,0.6); color: #fff; border-color: rgba(253,230,138,0.4); }
        .badge-finalizado { background: rgba(220,252,231,0.6); color: #fff; border-color: rgba(134,239,172,0.4); }
        .progress-bar-wrap { display: flex; gap: 4px; margin-bottom: 18px; }
        .progress-step { flex: 1; height: 4px; background: #fed7aa; border-radius: 4px; transition: background 0.3s; }
        .progress-step.done { background: linear-gradient(90deg, #f97316, #f59e0b); }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .progress-label { font-size: 11px; font-weight: 900; color: #a8a29e; text-transform: uppercase; letter-spacing: 0px; }
        .progress-label.done { color: #f97316; }
        .sticky-total { position: sticky; bottom: 0; background: #1c1917; border-radius: 20px 20px 0 0; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin: 20px -24px -24px; box-shadow: 0 -8px 24px rgba(0,0,0,0.15); }
        .sticky-total-label { font-size: 12px; color: #a8a29e; font-weight: 800; text-transform: uppercase; letter-spacing: 0px; }
        .sticky-total-amount { font-size: 24px; font-weight: 900; color: #fb923c; font-family: 'Fraunces', serif; }
        .finalizar-area { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; max-width: 230px; }
        .finalizar-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; border-radius: 12px; padding: 8px 10px; font-size: 12px; font-weight: 900; text-align: right; line-height: 1.2; box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .confirmacion-check { width: 72px; height: 72px; background: linear-gradient(135deg, #16a34a, #22c55e); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; margin: 0 auto 16px; box-shadow: 0 12px 28px rgba(34,197,94,0.35); animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        pre { white-space: pre-wrap; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 18px; padding: 16px; overflow: auto; font-size: 14px; }

        .mesas-pos { max-width: 980px; margin: 0 auto; display: grid; gap: 16px; }
        .mesas-hero { display: flex; justify-content: space-between; align-items: center; gap: 16px; background: linear-gradient(135deg, #1c1917, #44403c); color: #fff; border-radius: 28px; padding: 22px; box-shadow: 0 16px 36px rgba(0,0,0,0.16); }
        .mesas-hero span { display: block; color: #fdba74; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: .7px; margin-bottom: 5px; }
        .mesas-hero h2 { margin: 0; font-size: clamp(30px, 6vw, 48px); line-height: .95; }
        .mesas-hero strong { background: #f97316; color: #fff; border-radius: 999px; padding: 12px 16px; font-size: 18px; white-space: nowrap; }
        .mesas-card { background: #fff; border: 1px solid #fed7aa; border-radius: 26px; padding: 18px; box-shadow: 0 12px 28px rgba(0,0,0,0.06); }
        .mesas-section-title { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
        .mesas-section-title h3 { margin: 0; color: #c2410c; font-size: 24px; font-family: 'Fraunces', serif; }
        .mesas-category { margin-top: 14px; }
        .mesas-category:first-of-type { margin-top: 0; }
        .mesas-category h4 { margin-bottom: 10px; color: #57534e; font-size: 16px; }
        .mesas-products-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .mesa-product-btn { border: 2px solid #fed7aa; background: #fff7ed; border-radius: 20px; min-height: 86px; padding: 14px 12px; text-align: left; font-weight: 900; color: #292524; box-shadow: none; }
        .mesa-product-btn span { display: block; font-size: 18px; line-height: 1.08; }
        .mesa-product-btn small { display: block; margin-top: 8px; color: #ea580c; font-size: 15px; font-weight: 900; }
        .mesa-product-btn:hover { background: #ffedd5; border-color: #fb923c; }
        .mesas-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .mesa-chip { border: 2px solid #e7e5e4; background: #fff; border-radius: 999px; padding: 12px 16px; font-weight: 900; color: #44403c; }
        .mesa-chip.selected { border-color: #22c55e; background: #dcfce7; color: #15803d; }
        .mesa-empty { background: #fafaf9; border: 1px dashed #d6d3d1; border-radius: 18px; padding: 18px; color: #78716c; font-weight: 800; text-align: center; }
        .mesa-items-list { display: grid; gap: 10px; }
        .mesa-item-row { display: grid; grid-template-columns: 1fr auto 38px; align-items: center; gap: 10px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 18px; padding: 12px; }
        .mesa-item-row.active { border-color: #22c55e; background: #f0fdf4; }
        .mesa-item-row strong { display: block; color: #292524; font-size: 17px; }
        .mesa-item-row small { display: block; color: #57534e; font-weight: 800; margin-top: 4px; line-height: 1.25; }
        .mesa-item-row span { display: block; color: #ea580c; font-weight: 900; margin-top: 3px; }
        .mesas-wizard .progress-bar-wrap { margin-bottom: 10px; }
        .mesas-progress-labels { margin-bottom: 0; }
        .mesa-chip.blocked { opacity: .45; cursor: not-allowed; }
        .mesa-otro-almuerzo { margin-top: 14px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 20px; padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .mesa-otro-almuerzo strong { color: #92400e; font-size: 18px; }
        .mesa-otro-almuerzo .button { margin: 0; }
        .mesa-remove { width: 36px; height: 36px; border: 0; border-radius: 999px; background: #fee2e2; color: #991b1b; font-size: 22px; font-weight: 900; }
        .mesa-acomp-preview { margin-top: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 16px; padding: 12px; font-weight: 800; }
        .mesa-link-btn { border: 0; background: transparent; color: #b91c1c; font-weight: 900; text-decoration: underline; }
        .mesas-final-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .mesa-send-bar { display: flex; justify-content: space-between; align-items: center; gap: 14px; background: #1c1917; color: #fff; border-radius: 22px; padding: 14px; margin-top: 6px; }
        .mesa-send-bar span { display: block; color: #d6d3d1; font-weight: 800; font-size: 12px; text-transform: uppercase; }
        .mesa-send-bar strong { display: block; color: #fdba74; font-size: 28px; font-family: 'Fraunces', serif; }
        .mesa-send-bar .button { margin: 0; min-width: 210px; }

        @media (max-width: 900px) {
          .topbar, .layout, .grid-2, .pedido-top, .pedido-actions, .bottom-summary, .admin-top-row, .admin-actions-stack, .contador-sin-revisar, .alerta-pedido-nuevo, .admin-stats { grid-template-columns: 1fr; display: grid; }
          .topbar { display: block; }
          .nav { margin-top: 16px; }
          .mesa-pos-header { align-items: flex-start; flex-direction: column; }
          .mesa-step-strip { top: 4px; grid-template-columns: 1fr; }
          .option-grid, .productos-grid, .producto-controls, .producto-add-row, .producto-delete-row, .producto-seleccionado-row, .mesas-products-grid, .mesas-final-grid { grid-template-columns: 1fr; }
          .mesa-send-bar { display: grid; grid-template-columns: 1fr; }
          .mesa-send-bar .button { width: 100%; min-width: 0; }
          .mesa-item-row, .mesa-otro-almuerzo { grid-template-columns: 1fr; display: grid; }
          .mesa-otro-almuerzo .button { width: 100%; }
          .app { padding: 14px; }
          .pedido-total { text-align: left; }
          .sticky-total { align-items: flex-start; gap: 12px; }
          .finalizar-area { max-width: 190px; }
          .admin-tabs { grid-template-columns: 1fr 1fr; border-radius: 18px; }
          .admin-tabs button { font-size: 12px; padding: 12px 8px; }
        }
      `}</style>

      <div className="app">
        <div className="container">
          {vista !== "inicio" && vista !== "admin" && vista !== "adminLogin" && (
            <header className="topbar">
              <div>
                <div className="brand">🍽️ Rafiki Pedidos</div>
                <h1>{vista === "mesas" ? "Panel de mesas" : "Menú diario y pedidos por WhatsApp"}</h1>
                <p className="muted">{vista === "mesas" ? "Toma rápida de pedidos internos." : "App real conectada a Supabase."}</p>
              </div>

              {(vista === "cliente" || vista === "confirmacion") && (
                <div className="nav">
                  <button
                    type="button"
                    onClick={() => navegar("/cliente", "cliente")}
                    className={vista === "cliente" ? "active" : ""}
                  >
                    Vista cliente
                  </button>

                  <button type="button" onClick={() => navegar("/", "inicio")}>
                    Inicio
                  </button>
                </div>
              )}
            </header>
          )}

          {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
          {cargando && <div className="card card-pad">Cargando datos de Rafiki...</div>}

          {!cargando && vista === "inicio" && (
            <main className="welcome">
              <section className="welcome-card">
                <img src="/logo-rafiki.png" alt="Rafiki Restaurante" className="welcome-logo" />
                <h2>Bienvenido a Rafiki</h2>
                <p>Escoge tu almuerzo del día, selecciona tus acompañantes y envíanos tu pedido por WhatsApp.</p>

                <button type="button" onClick={() => navegar("/cliente", "cliente")} className="welcome-button">
                  🛍️ Haz tu pedido aquí
                </button>
              </section>
            </main>
          )}

          {!cargando && vista === "adminLogin" && (
            <main style={{ maxWidth: 520, margin: "0 auto" }}>
              <section className="card card-pad">
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div className="brand">🔐 Panel Rafiki</div>
                  <h2>Acceso administrativo</h2>
                  <p className="muted">Ingresa la clave para ver pedidos y editar el menú diario.</p>
                </div>

                {errorClaveAdmin && (
                  <div className="alert alert-error">{errorClaveAdmin}</div>
                )}

                <form onSubmit={validarClaveAdmin}>
                  <label className="field">
                    <span>Clave del panel</span>
                    <input
                      type="password"
                      value={claveAdmin}
                      onChange={(e) => {
                        setClaveAdmin(e.target.value);
                        setErrorClaveAdmin("");
                      }}
                      placeholder="Escribe la clave"
                      autoFocus
                    />
                  </label>

                  <button type="submit" className="button" style={{ width: "100%" }}>
                    Entrar al panel
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setClaveAdmin("");
                    setErrorClaveAdmin("");
                    navegar("/", "inicio");
                  }}
                  className="button light"
                  style={{ width: "100%", marginTop: 12 }}
                >
                  Volver al inicio
                </button>
              </section>
            </main>
          )}

          {!cargando && vista === "cliente" && (
            <main className="layout">
              <section className="card" id="inicio-pedido-cliente">
                <div className="hero">
                  <p>{menu.fecha}</p>
                  <h2>{menu.titulo}</h2>
                  <p>{menu.descripcion}</p>
                </div>

                <div className="section">
                  {menu.platos_detalle.length === 0 ? (
                    <div className="box soft">
                      Todavía no hay platos configurados para el menú de hoy. Entra al panel administrativo y agrega los platos del día.
                    </div>
                  ) : (
                  <>
                      <div style={{ marginBottom: 18 }}>
                        <h3>🛍️ Arma tu pedido paso a paso</h3>
                        <p className="muted">Primero selecciona tu proteína. Luego aparecerán los siguientes pasos.</p>
                      </div>

                      {itemsPedido.map((item, index) => {
                        const itemEsSopa = esCategoriaSopa(item.categoria);
                        const acompanantesItem = Array.isArray(item.acompanantes) ? item.acompanantes : [];
                        const tienePlato = Boolean(item.plato || item.proteina);
                        const tieneAcompanantes = itemEsSopa || acompanantesItem.length > 0;

                        const pasos = itemEsSopa
                          ? ["Proteína", "Datos"]
                          : ["Proteína", "Acomp.", "Datos"];
                        const pasoActual = !tienePlato ? 0 : !tieneAcompanantes ? 1 : pasos.length - 1;

                        return (
                          <div key={item.id} id={`producto-${item.id}`} className="meal-card">
                            <div className="row">
                              <h3>Producto #{index + 1}</h3>

                              {itemsPedido.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => eliminarAlmuerzo(item.id)}
                                  className="button danger"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>

                            <div className="progress-bar-wrap">
                              {pasos.map((_, i) => (
                                <div key={i} className={`progress-step ${i <= pasoActual ? "done" : ""}`} />
                              ))}
                            </div>
                            <div className="progress-labels">
                              {pasos.map((nombre, i) => (
                                <span key={i} className={`progress-label ${i <= pasoActual ? "done" : ""}`}>{nombre}</span>
                              ))}
                            </div>

                            <div className="step-title">
                              <span className="step-number">1</span>
                              <div>
                                <h4>Primero selecciona tu proteína</h4>
                                <p className="muted" style={{ marginBottom: 0 }}>
                                  Toca una opción para continuar.
                                </p>
                              </div>
                            </div>

                            {tienePlato && (
                              <div className="selected-dish">
                                Seleccionado: {item.plato || item.proteina} —{" "}
                                {dinero(item.precioPlato || item.precioProteina)}
                              </div>
                            )}

                            {Object.entries(platosAgrupados).map(([categoria, platos]) => (
                              <div key={categoria} className="category-block">
                                <h3 className="category-title">{categoria}</h3>

                                <div className="option-grid">
                                  {platos.map((plato) => (
                                    <button
                                      key={`${plato.categoria}-${plato.nombre}`}
                                      type="button"
                                      onClick={() => cambiarPlatoItem(item.id, plato)}
                                      className={`option ${item.plato === plato.nombre ? "selected" : ""}`}
                                    >
                                      <div>{plato.nombre}</div>
                                      <small>{dinero(plato.precio)}</small>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {tienePlato && !itemEsSopa && (
                              <div id={`paso-acompanantes-${item.id}`} className="fade-step" style={{ marginTop: 18 }}>
                                <div className="step-title">
                                  <span className="step-number">2</span>
                                  <div>
                                    <h4>Escoge tus acompañantes</h4>
                                    <p className="muted" style={{ marginBottom: 0 }}>
                                      Selecciona hasta {MAX_ACOMPANANTES_CLIENTE} opciones para completar tu almuerzo.
                                    </p>
                                  </div>
                                </div>

                                <div className="chips">
                                  {menu.acompanantes.length === 0 ? (
                                    <span className="muted">No hay acompañantes configurados.</span>
                                  ) : (
                                    menu.acompanantes.map((acompanante) => {
                                      const seleccionado = acompanantesItem.includes(acompanante);
                                      const bloqueado =
                                        !seleccionado &&
                                        acompanantesItem.length >= MAX_ACOMPANANTES_CLIENTE;

                                      return (
                                        <button
                                          key={acompanante}
                                          type="button"
                                          onClick={() => cambiarAcompananteItem(item.id, acompanante)}
                                          disabled={bloqueado}
                                          className={`chip ${seleccionado ? "selected" : ""} ${
                                            bloqueado ? "blocked" : ""
                                          }`}
                                        >
                                          {seleccionado ? "✓ " : "+ "}
                                          {acompanante}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="box compact-info" style={{ marginTop: 12 }}>
                                  <strong>🥣 Sopa y bebida incluida</strong>
                                </div>
                              </div>
                            )}

                            {tienePlato && itemEsSopa && (
                              <div className="box soft fade-step" style={{ marginTop: 18 }}>
                                <strong>🥣 Producto de sopas</strong>
                                <p className="muted" style={{ marginBottom: 0 }}>
                                  Este producto no incluye acompañantes, sopa adicional ni bebida.
                                </p>
                              </div>
                            )}

                            {tienePlato && (
                              <div id={`paso-cantidad-${item.id}`} className="fade-step pedido-paso-compacto" style={{ marginTop: 12 }}>
                                <div className="box compact-box quantity-box">
                                  <strong>Cantidad de {item.plato || item.proteina || "proteína escogida"}</strong>
                                  <SelectorCantidad
                                    cantidad={item.cantidad}
                                    onChange={(cantidad) => actualizarItem(item.id, { cantidad })}
                                  />
                                </div>

                                {!itemEsSopa && (
                                  <CampoTexto
                                    etiqueta="Observación sobre tus acompañantes"
                                    value={item.observacionAcompanantes || ""}
                                    onChange={(valor) => actualizarItem(item.id, { observacionAcompanantes: valor })}
                                    placeholder="Ejemplo: sin ensalada, más arroz..."
                                    multiline
                                    rows={2}
                                  />
                                )}

                                <label className="box row compact-box takeout-box">
                                  <div>
                                    <strong>🥡 Para llevar</strong>
                                    <p className="muted" style={{ marginBottom: 0 }}>
                                      {valorParaLlevarItem(item) === 0 && item.paraLlevar
                                        ? "Sin costo adicional"
                                        : `Suma ${dinero(VALOR_PARA_LLEVAR)}`}
                                    </p>
                                  </div>

                                  <input
                                    type="checkbox"
                                    checked={item.paraLlevar}
                                    onChange={(e) =>
                                      actualizarItem(item.id, { paraLlevar: e.target.checked })
                                    }
                                    style={{ width: 20, height: 20 }}
                                  />
                                </label>

                                <div className="total-row compact-total-row">
                                  <span>Subtotal</span>
                                  <strong>{dinero(calcularTotalItem(item))}</strong>
                                </div>

                                <button
                                  type="button"
                                  className="button continue-button"
                                  onClick={() => irAElemento("paso-datos-entrega")}
                                >
                                  Continuar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button type="button" onClick={agregarAlmuerzo} className="button add-meal">
                        + Agregar otro almuerzo o producto
                      </button>
                    </>
                  )}
                </div>
              </section>

              <aside className="card card-pad fade-step" id="resumen-pedido">
                <h2>{hayProductoSeleccionado ? "Resumen del pedido" : "Resumen"}</h2>

                {!hayProductoSeleccionado ? (
                  <div className="box soft">
                    <strong>👈 Empieza seleccionando una proteína</strong>
                    <p className="muted" style={{ marginBottom: 0 }}>
                      Cuando selecciones un producto, aquí aparecerá el resumen y los datos de entrega.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="muted">Revisa tu pedido antes de finalizar.</p>

                    <div className="box soft" style={{ marginBottom: 12 }}>
                      <h3>Resumen del pedido</h3>

                      {itemsPedido
                        .filter((item) => item.plato || item.proteina)
                        .map((item) => {
                          const itemEsSopa = esCategoriaSopa(item.categoria);
                          const acompanantesItem = Array.isArray(item.acompanantes) ? item.acompanantes : [];

                          return (
                            <div key={item.id} className="summary-item">
                              <p>
                                <strong>{item.cantidad} x {item.plato || item.proteina}</strong> - {" "}
                                {dinero(item.precioPlato || item.precioProteina)}
                              </p>

                              {item.categoria && <p>Categoría: {item.categoria}</p>}

                              {!itemEsSopa && <p>{acompanantesItem.join(", ") || "Sin acompañantes"}</p>}
                              {!itemEsSopa && item.observacionAcompanantes?.trim() && (
                                <p>Obs. acompañantes: {item.observacionAcompanantes.trim()}</p>
                              )}
                              {itemEsSopa && <p>Acompañantes: No aplica</p>}

                              {!itemEsSopa && <p>Sopa + bebida incluida</p>}

                              <p>{textoParaLlevarItem(item)}</p>
                            </div>
                          );
                        })}

                      <div className="total-row">
                        <span>Total</span>
                        <strong>{dinero(totalPedido)}</strong>
                      </div>
                    </div>


                    <button type="button" onClick={reiniciarPedido} className="button light small-reset">
                      Borrar y volver a empezar
                    </button>

                    <div id="paso-datos-entrega" className="step-title" style={{ marginTop: 18 }}>
                      <span className="step-number">3</span>
                      <div>
                        <h4>Datos de entrega</h4>
                        <p className="muted" style={{ marginBottom: 0 }}>
                          Así sabremos a dónde llevar tu pedido.
                        </p>
                      </div>
                    </div>

                    <CampoTexto
                      etiqueta="👤 Nombre"
                      value={cliente}
                      onChange={(valor) => {
                        setCliente(valor);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: Laura Pérez"
                    />

                    <CampoTexto
                      etiqueta="📞 Teléfono"
                      value={telefono}
                      onChange={(valor) => {
                        setTelefono(valor);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: 300 123 4567"
                    />

                    <CampoTexto
                      etiqueta="📍 Ubicación"
                      value={ubicacion}
                      onChange={(valor) => {
                        setUbicacion(valor);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: Edificio, oficina o barrio"
                    />

                    <label className="field">
                      <span>💳 Tipo de pago</span>
                      <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </label>

                    <CampoTexto
                      etiqueta="Observaciones generales"
                      value={observaciones}
                      onChange={setObservaciones}
                      placeholder="Ej: llevar a recepción, sin cubiertos, pago en efectivo..."
                      multiline
                    />

                    {hayProductoSeleccionado && (
                      <div className="sticky-total">
                        <div>
                          <div className="sticky-total-label">Total</div>
                          <div className="sticky-total-amount">{dinero(totalPedido)}</div>
                        </div>
                        <div className="finalizar-area">
                          {errorDatosPedido && (
                            <div className="finalizar-error" role="alert" aria-live="polite">{errorDatosPedido}</div>
                          )}

                          <button
                            type="button"
                            onClick={registrarPedido}
                            disabled={guardandoPedido || itemsConProducto.length === 0}
                            className="button"
                            style={{ margin: 0, padding: "12px 20px", fontSize: 15 }}
                          >
                            {guardandoPedido ? "Guardando..." : "Enviar a cocina →"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </aside>
            </main>
          )}

          {!cargando && vista === "confirmacion" && pedidoFinalizado && (
            <main style={{ maxWidth: 620, margin: "0 auto" }}>
              <section className="card">
                <div className="hero green confirmacion-cocina" style={{ textAlign: "center" }}>
                  <div className="confirmacion-check">✓</div>
                  <h2 style={{ fontFamily: "'Fraunces', serif" }}>
                    Pedido #{obtenerCodigoPedido(pedidoFinalizado)} enviado a cocina
                  </h2>
                  <p>El pedido fue registrado correctamente.</p>
                </div>

                <div className="card-pad" style={{ textAlign: "center" }}>
                  <button type="button" onClick={nuevoPedidoCliente} className="button green" style={{ maxWidth: 320, margin: "0 auto" }}>
                    Hacer otro pedido
                  </button>
                </div>
              </section>
            </main>
          )}

          {!cargando && vista === "mesas" && (
            <PanelMesasPOS
              menu={menu}
              platosAgrupados={platosAgrupados}
              guardandoPedido={guardandoPedido}
              onEnviar={registrarPedidoMesa}
            />
          )}

          {!cargando && vista === "admin" && adminAutenticado && (
            <main className="admin-layout">
              <div className="admin-tabs">
                <button
                  type="button"
                  onClick={() => setAdminTab("pedidos")}
                  className={adminTab === "pedidos" ? "active" : ""}
                >
                  Pedidos de hoy
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab("menu")}
                  className={adminTab === "menu" ? "active" : ""}
                >
                  Editar menú diario
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab("productos")}
                  className={adminTab === "productos" ? "active" : ""}
                >
                  Solicitud de insumos
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab("generador")}
                  className={adminTab === "generador" ? "active" : ""}
                >
                  Generador de menú
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab("rafa")}
                  className={adminTab === "rafa" ? "active" : ""}
                >
                  Rafa
                </button>

                <button
                  type="button"
                  onClick={cerrarPanelAdmin}
                  className="button light"
                >
                  Cerrar panel
                </button>
              </div>

              {adminTab === "pedidos" && (
                <section className="card card-pad">
                  <div className="admin-top-row">
                    <div>
                      <h2>📋 {tituloPedidos}</h2>
                      <p className="muted">Vista organizada para preparar pedidos y revisar historial.</p>
                    </div>

                    <div className="admin-actions-stack">
                      <button
                        type="button"
                        className="button light"
                        onClick={() => setRecargaPedidos((actual) => actual + 1)}
                      >
                        🔄 Actualizar pedidos
                      </button>

                      <button
                        type="button"
                        className={sonidoActivado ? "button green" : "button warning"}
                        onClick={activarSonidoPedidos}
                      >
                        {sonidoActivado ? "🔔 Sonido activo" : "🔔 Activar sonido"}
                      </button>
                    </div>
                  </div>

                  {alertaPedidoNuevo && (
                    <div className="alerta-pedido-nuevo">
                      <div>
                        <strong>🔔 Nuevo pedido #{obtenerCodigoPedido(alertaPedidoNuevo)}</strong>
                        <span>{obtenerCliente(alertaPedidoNuevo)} · {dinero(alertaPedidoNuevo.total)}</span>
                      </div>
                      <button type="button" onClick={() => marcarPedidoRevisado(alertaPedidoNuevo.id)}>
                        Marcar revisado
                      </button>
                    </div>
                  )}

                  <div className="contador-sin-revisar">
                    <div>
                      <span>Pedidos sin revisar</span>
                      <strong>{pedidosSinRevisar.length}</strong>
                    </div>
                    <button
                      type="button"
                      className="button light"
                      onClick={marcarTodosPedidosRevisados}
                      disabled={pedidosSinRevisar.length === 0}
                    >
                      Marcar todos como revisados
                    </button>
                  </div>

                  <div className="filtros-historial">
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroPedidos("hoy");
                        setFechaSeleccionada(fechaISOColombia());
                      }}
                      className={filtroPedidos === "hoy" ? "active" : ""}
                    >
                      Hoy
                    </button>

                    <label className="calendario-filtro">
                      <span>Buscar día</span>
                      <input
                        type="date"
                        value={fechaSeleccionada}
                        onChange={(e) => {
                          setFechaSeleccionada(e.target.value);
                          setFiltroPedidos("dia");
                        }}
                      />
                    </label>

                    {hayBusquedaPedidos && (
                      <button type="button" onClick={() => setBusqueda("")}>
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>

                  <CampoTexto
                    etiqueta="Buscar pedido"
                    value={busqueda}
                    onChange={setBusqueda}
                    placeholder="Buscar por cliente, ubicación, pago o estado..."
                  />

                  <p className="muted small">
                    Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos cargados.
                  </p>

                  <div className="pedido-seccion">
                    <div className="section-heading">
                      <h3>🟡 Pedidos pendientes</h3>
                      <span>{pedidosPendientes.length}</span>
                    </div>

                    {pedidosPendientes.length === 0 ? (
                      <div className="box soft">No hay pedidos pendientes.</div>
                    ) : (
                      <TablaPedidosCompacta
                        pedidos={pedidosPendientes}
                        onCambiarEstado={cambiarEstadoPedido}
                        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
                        pedidosRevisados={pedidosRevisados}
                        onMarcarRevisado={marcarPedidoRevisado}
                      />
                    )}
                  </div>

                  <div className="pedido-seccion">
                    <div className="section-heading">
                      <h3>✅ Finalizados</h3>
                      <span>{pedidosFinalizados.length}</span>
                    </div>

                    {pedidosFinalizados.length === 0 ? (
                      <div className="box soft">Todavía no hay pedidos finalizados.</div>
                    ) : (
                      <TablaPedidosCompacta
                        pedidos={pedidosFinalizados}
                        onCambiarEstado={cambiarEstadoPedido}
                        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
                        pedidosRevisados={pedidosRevisados}
                        onMarcarRevisado={marcarPedidoRevisado}
                      />
                    )}
                  </div>

                  <div className="bottom-summary">
                    <div className="card card-pad">
                      <h3>Consolidado cocina</h3>
                      <p className="muted">Resumen total de platos del día seleccionado.</p>

                      {Object.keys(consolidado).length === 0 ? (
                        <p className="muted">Todavía no hay productos para consolidar.</p>
                      ) : (
                        <div className="grid-2">
                          {Object.entries(consolidado).map(([producto, cantidadProducto]) => (
                            <div key={producto} className="box row">
                              <strong>{producto}</strong>
                              <strong>{cantidadProducto}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="summary-cards">
                      <div className="summary-card">
                        <span>Pedidos</span>
                        <strong>{pedidosFiltrados.length}</strong>
                      </div>

                      <div className="summary-card">
                        <span>Finalizados</span>
                        <strong>{pedidosFinalizados.length}</strong>
                      </div>

                      <div className="summary-card">
                        <span>Total vendido</span>
                        <strong>{dinero(totalVendido)}</strong>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {adminTab === "productos" && <SolicitudProductos />}

              {adminTab === "generador" && <GeneradorMenu />}

              {adminTab === "rafa" && (
                rafaAutenticado ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                      <button type="button" onClick={cerrarPanelRafa} className="button light">
                        Bloquear Rafa
                      </button>
                    </div>
                    <PanelRafaPrivado />
                  </>
                ) : (
                  <section className="card card-pad" style={{ maxWidth: 520, margin: "0 auto" }}>
                    <h2>🔒 Rafa</h2>
                    <p className="muted">Esta sección es privada. Ingresa la contraseña para continuar.</p>

                    {errorClaveRafa && (
                      <div className="alert alert-error">{errorClaveRafa}</div>
                    )}

                    <form onSubmit={validarClaveRafa}>
                      <label className="field">
                        <span>Contraseña</span>
                        <input
                          type="password"
                          value={claveRafa}
                          onChange={(e) => {
                            setClaveRafa(e.target.value);
                            setErrorClaveRafa("");
                          }}
                          placeholder="Contraseña de Rafa"
                        />
                      </label>

                      <button type="submit" className="button primary" style={{ width: "100%" }}>
                        Entrar a Rafa
                      </button>
                    </form>
                  </section>
                )
              )}

              {adminTab === "menu" && (
                <section className="card card-pad">
                  <h2>✏️ Editar menú diario</h2>
                  <p className="muted">
                    Aquí modificas los platos, precios, categorías y acompañantes disponibles para los clientes.
                  </p>

                  <CampoTexto
                    etiqueta="Fecha"
                    value={menu.fecha || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, fecha: valor }))}
                  />

                  <CampoTexto
                    etiqueta="Nombre del menú"
                    value={menu.titulo || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, titulo: valor }))}
                  />

                  <CampoTexto
                    etiqueta="Descripción"
                    value={menu.descripcion || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, descripcion: valor }))}
                    multiline
                    rows={3}
                  />

                  <CampoTexto
                    etiqueta="Platos del día"
                    value={platosTexto}
                    onChange={setPlatosTexto}
                    placeholder={
                      "Pechuga | Pechuga asada sin salsa:17500\nPechuga | Pechuga en salsa criolla:18500\nCerdo | Cerdo asado sin salsa:17000\nSopas | Sopas medianas sin arroz:7000\nSopas | Sopas medianas con arroz:9000\nSopas | Sancocho de pollo con arroz:15000\nCarnes | Carne guisada:19000"
                    }
                    multiline
                    rows={9}
                  />

                  <CampoTexto
                    etiqueta="Acompañantes del día"
                    value={acompanantesTexto}
                    onChange={setAcompanantesTexto}
                    placeholder={"Arroz con coco\nEnsalada verde\nPuré de papa\nTajadas maduras\nYuca cocida"}
                    multiline
                    rows={7}
                  />

                  <div className="box soft small">
                    <strong>Platos:</strong> escribe un plato por línea con este formato:
                    <br />
                    Categoría | Nombre del plato:Precio
                    <br />
                    <br />
                    <strong>Ejemplo:</strong> Pechuga | Pechuga en salsa criolla:18500
                    <br />
                    <br />
                    <strong>Sopas:</strong> los platos con categoría Sopas no permiten acompañantes ni incluyen sopa + bebida.
                    <br />
                    <br />
                    <strong>Para llevar:</strong> las sopas configuradas como “Sopas medianas sin arroz”, “Sopas medianas con arroz” y “Sancocho de pollo con arroz” tienen empaque sin costo adicional.
                  </div>

                  <button
                    type="button"
                    onClick={guardarMenu}
                    disabled={guardandoMenu}
                    className="button"
                    style={{ width: "100%", marginTop: 14 }}
                  >
                    {guardandoMenu ? "Guardando menú..." : "Guardar menú del día"}
                  </button>

                  {mensajeMenu.texto && (
                    <div className={`alert alert-${mensajeMenu.tipo} menu-action-message`}>
                      {mensajeMenu.texto}
                    </div>
                  )}
                </section>
              )}
            </main>
          )}
        </div>
      </div>
    </>
  );
}
