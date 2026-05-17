import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { appStyles } from "./styles/appStyles";
import { obtenerVistaInicial, actualizarRuta } from "./utils/navigation";
import { InicioRafiki, AdminLogin } from "./components/screens/InicioAdmin";
import { CampoTexto, SelectorCantidad, Tarjeta } from "./components/common";
import { PedidoCocina, TablaPedidosCompacta } from "./components/PedidosAdmin";
import { estadosPedido, menuFallback, MAX_ACOMPANANTES_CLIENTE } from "./data/menuAlmuerzos";
import {
  acompanantesATexto,
  agruparPlatosPorCategoria,
  calcularTotalItem,
  calcularTotalItems,
  consolidarPedidos,
  crearItemNuevo,
  crearLinkWhatsApp,
  crearMensajeWhatsAppPedido,
  crearTextoPedido,
  dinero,
  esDispositivoMovil,
  fechaISOColombia,
  formatearFechaHora,
  guardarSesionTemporal,
  limpiarAcompanantesCliente,
  limpiarAcompanantesMenu,
  limpiarTelefono,
  limpiarTelefonoWhatsApp,
  limpiarTexto,
  obtenerCodigoPedido,
  esCategoriaSopa,
  valorParaLlevarItem,
  textoParaLlevarItem,
  listaPorLineas,
  normalizarMenu,
  obtenerCliente,
  obtenerEstadoPedido,
  obtenerRangoPedidos,
  obtenerSesionActiva,
  pedidoEsDeHoy,
  platosATexto,
  textoAPlatosDetalle,
} from "./utils/pedidos";
import { BOTONES, CONFIRMACIONES_PEDIDOS, MENSAJES_PEDIDOS, TEXTOS_APP } from "./config/textos";
import { describirActor, nombreRol, obtenerRolUsuarioDesdeTabla, primeraPestanaPermitida, usuarioPuede } from "./utils/authAdmin";


const SolicitudProductos = lazy(() => import("./components/SolicitudProductos"));
const GeneradorMenu = lazy(() => import("./components/GeneradorMenu"));
const PanelMesasPOS = lazy(() => import("./components/PanelMesas"));
const PanelRafaPrivado = lazy(() => import("./components/PanelRafaPrivado"));

function CargandoModulo({ texto = TEXTOS_APP.CARGANDO_SECCION }) {
  return (
    <Tarjeta className="module-loader" role="status" aria-live="polite">
      <strong>{texto}</strong>
      <p className="muted" style={{ marginBottom: 0 }}>{TEXTOS_APP.CARGANDO_SECCION_DETALLE}</p>
    </Tarjeta>
  );
}

const WHATSAPP_RAFIKI = import.meta.env.VITE_WHATSAPP_RAFIKI || "";
const CLAVE_ADMIN = import.meta.env.VITE_CLAVE_ADMIN || "";
const CLAVE_RAFA = import.meta.env.VITE_CLAVE_RAFA || "";
const CLAVE_ELIMINAR_PEDIDO = import.meta.env.VITE_CLAVE_ELIMINAR_PEDIDO || "Rafiki1989";

export default function App() {
  const [vista, setVista] = useState(() => obtenerVistaInicial());
  const [adminTab, setAdminTab] = useState("pedidos");
  const [adminAutenticado, setAdminAutenticado] = useState(() => obtenerSesionActiva("rafikiAdminActivo"));
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUsuario, setAdminUsuario] = useState(null);
  const [adminRol, setAdminRol] = useState("usuario");
  const [adminAuthCargando, setAdminAuthCargando] = useState(true);
  const [errorClaveAdmin, setErrorClaveAdmin] = useState("");
  const [rafaAutenticado, setRafaAutenticado] = useState(false);
  const [claveRafa, setClaveRafa] = useState("");
  const [errorClaveRafa, setErrorClaveRafa] = useState("");
  const [menu, setMenu] = useState(normalizarMenu(menuFallback));
  const [pedidos, setPedidos] = useState([]);
  const [itemsPedido, setItemsPedido] = useState([crearItemNuevo()]);
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [tipoPago, setTipoPago] = useState("");
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
  const [eliminandoPedidoId, setEliminandoPedidoId] = useState(null);
  const [finalizandoPendientes, setFinalizandoPendientes] = useState(false);
  const [recargaPedidos, setRecargaPedidos] = useState(0);
  const [alertaPedidoNuevo, setAlertaPedidoNuevo] = useState(null);
  const [sonidoActivado, setSonidoActivado] = useState(false);
  const [platosTexto, setPlatosTexto] = useState("");
  const [acompanantesTexto, setAcompanantesTexto] = useState("");
  const mensajeTimer = useRef(null);
  const mensajeMenuTimer = useRef(null);
  const menuHashRef = useRef("");
  const audioCtxRef = useRef(null);
  const alertaPedidoTimer = useRef(null);

  const adminNombreRol = nombreRol(adminRol);
  const adminActor = describirActor(adminUsuario, adminAutenticado ? "Clave administrativa local" : "Sin sesión");
  const puedeVerMenu = usuarioPuede(adminRol, "menu");
  const puedeVerProductos = usuarioPuede(adminRol, "productos");
  const puedeVerGenerador = usuarioPuede(adminRol, "generador");
  const puedeVerRafa = usuarioPuede(adminRol, "rafa");
  const puedeEliminarPedido = usuarioPuede(adminRol, "eliminar_pedido");
  const puedeCambiarEstado = usuarioPuede(adminRol, "cambiar_estado");
  const puedeFinalizarPendientes = usuarioPuede(adminRol, "finalizar_pendientes");

  const navegar = useCallback((ruta, nuevaVista) => {
    actualizarRuta(ruta);
    setVista(nuevaVista);
  }, []);

  const cargarRolAdmin = useCallback(async (usuario) => {
    const rol = await obtenerRolUsuarioDesdeTabla(supabase, usuario);
    setAdminRol(rol);
    return rol;
  }, []);

  useEffect(() => {
    let activo = true;

    async function revisarSesionAdmin() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!activo) return;

        const usuario = data?.session?.user || null;
        setAdminUsuario(usuario);

        if (usuario) {
          const rol = await cargarRolAdmin(usuario);
          setAdminAutenticado(true);
          setAdminTab(primeraPestanaPermitida(rol));
        } else {
          setAdminRol("usuario");
        }
      } finally {
        if (activo) setAdminAuthCargando(false);
      }
    }

    revisarSesionAdmin();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const usuario = session?.user || null;
      setAdminUsuario(usuario);

      if (usuario) {
        const rol = await cargarRolAdmin(usuario);
        setAdminAutenticado(true);
        setAdminTab(primeraPestanaPermitida(rol));
        setErrorClaveAdmin("");
        return;
      }

      setAdminRol("usuario");

      if (!obtenerSesionActiva("rafikiAdminActivo")) {
        setAdminAutenticado(false);
        setRafaAutenticado(false);
      }
    });

    return () => {
      activo = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [cargarRolAdmin]);

  useEffect(() => {
    if (!adminAutenticado) return;
    const pestanaPermitida = primeraPestanaPermitida(adminRol);
    if (adminTab !== "pedidos" && !usuarioPuede(adminRol, adminTab)) {
      setAdminTab(pestanaPermitida);
    }
  }, [adminAutenticado, adminRol, adminTab]);

  const mostrarMensaje = useCallback((texto, tipo = "info") => {
    if (mensajeTimer.current) {
      clearTimeout(mensajeTimer.current);
    }

    setMensaje({ texto, tipo });

    mensajeTimer.current = setTimeout(() => {
      setMensaje({ texto: "", tipo: "info" });
    }, 5000);
  }, []);

  const mostrarMensajeMenu = useCallback((texto, tipo = "info") => {
    if (mensajeMenuTimer.current) {
      clearTimeout(mensajeMenuTimer.current);
    }

    setMensajeMenu({ texto, tipo });

    mensajeMenuTimer.current = setTimeout(() => {
      setMensajeMenu({ texto: "", tipo: "info" });
    }, 6000);
  }, []);

  function irAElemento(id) {
    setTimeout(() => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 160);
  }

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
      mostrarMensaje(MENSAJES_PEDIDOS.SONIDO_ACTIVADO, "success");
    } catch {
      mostrarMensaje(MENSAJES_PEDIDOS.SONIDO_BLOQUEADO, "warning");
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

  const cargando = cargandoMenu || cargandoPedidos || adminAuthCargando;

  const itemsConProducto = useMemo(
    () => itemsPedido.filter((item) => item.plato || item.proteina || item.producto),
    [itemsPedido]
  );

  const totalPedido = useMemo(() => calcularTotalItems(itemsConProducto), [itemsConProducto]);

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

  const totalVendido = useMemo(() => {
    return pedidosActivos.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0);
  }, [pedidosActivos]);


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

          if (hoy) {
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
    setItemsPedido((actual) => {
      const restantes = actual.filter((item) => item.id !== id);
      return restantes.length === 0 ? [crearItemNuevo()] : restantes;
    });
  }

  function reiniciarPedido() {
    setItemsPedido([crearItemNuevo()]);
    setCliente("");
    setTelefono("");
    setUbicacion("");
    setTipoPago("");
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
    if (!tipoPago) camposFaltantes.push("forma de pago");

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

  async function registrarPedidoMesa({ items, acompanantes, modoLlevar = false, mesa, cliente, telefono, ubicacion, mesero, tipoPago, observaciones: obsMesa }) {
    if (guardandoPedido) return false;

    const itemsValidos = (Array.isArray(items) ? items : [])
      .filter((item) => item.plato || item.proteina || item.producto)
      .map((item) => {
        if (item.categoria === "cafeteria") {
          return {
            ...item,
            paraLlevar: Boolean(modoLlevar)
          };
        }

        return {
          ...item,
          acompanantes: limpiarAcompanantesMenu(
            Array.isArray(item.acompanantes) && item.acompanantes.length > 0
              ? item.acompanantes
              : acompanantes || []
          ),
          observacionAcompanantes: item.observacionAcompanantes || "",
          paraLlevar: Boolean(modoLlevar)
        };
      });

    if (itemsValidos.length === 0) {
      mostrarMensaje("Agrega al menos un producto al pedido de mesa.", "warning");
      return false;
    }

    const esLlevar = Boolean(modoLlevar);
    const mesaLimpia = esLlevar ? "Llevar" : (limpiarTexto(mesa, 40) || "Mesa 1");
    const clienteMesaOpcional = limpiarTexto(cliente, 120);
    const clienteLimpio = clienteMesaOpcional || (esLlevar ? "Cliente" : mesaLimpia);
    const telefonoLimpio = esLlevar ? limpiarTelefono(telefono) : "";
    const ubicacionLimpia = esLlevar ? (limpiarTexto(ubicacion, 200) || "Ubicación pendiente") : mesaLimpia;
    const meseroLimpio = limpiarTexto(mesero, 80) || "Mesero";
    const tipoPagoLimpio = limpiarTexto(tipoPago, 80) || "Efectivo";
    const observacionesLimpias = limpiarTexto(obsMesa, 500);
    const pedidoTexto = crearTextoPedido(itemsValidos, observacionesLimpias);
    const total = calcularTotalItems(itemsValidos);

    const nuevoPedido = {
      cliente: clienteLimpio,
      cliente_nombre: clienteLimpio,
      telefono: telefonoLimpio,
      ubicacion: ubicacionLimpia,
      tipo_pago: tipoPagoLimpio,
      tipo_pedido: esLlevar ? "llevar" : "mesa",
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

      mostrarMensaje(`Pedido #${obtenerCodigoPedido(data)} enviado a cocina para ${mesaLimpia}.`, "success");
      return data;
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
      mostrarMensajeMenu(menu.id ? MENSAJES_PEDIDOS.MENU_ACTUALIZADO : MENSAJES_PEDIDOS.MENU_CREADO, "success");
    } finally {
      setGuardandoMenu(false);
    }
  }

  const registrarAuditoria = useCallback(async ({ accion, pedido, detalle = {} }) => {
    try {
      const { error } = await supabase.from("auditoria_pedidos").insert({
        pedido_id: pedido?.id ? String(pedido.id) : null,
        codigo_pedido: pedido ? obtenerCodigoPedido(pedido) : null,
        accion,
        detalle,
        usuario_email: adminUsuario?.email || null,
        usuario_rol: adminRol,
        actor: adminActor,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Auditoría no registrada:", error.message);
      }
    } catch (error) {
      console.warn("Auditoría no registrada:", error?.message || error);
    }
  }, [adminActor, adminRol, adminUsuario]);

  const cambiarEstadoPedido = useCallback(async (id, estado) => {
    if (guardandoEstadoPedidoId) return;

    if (!puedeCambiarEstado) {
      mostrarMensaje("Tu rol no tiene permiso para cambiar el estado de pedidos.", "error");
      return;
    }

    const estadoNuevo = estado === "Finalizado" ? "Finalizado" : "Pendiente";
    const pedidoActual = pedidos.find((pedido) => pedido.id === id);
    const estadoActual = obtenerEstadoPedido(pedidoActual || {});

    if (estadoNuevo === estadoActual) return;

    if (estadoNuevo === "Finalizado") {
      const codigoPedido = pedidoActual ? obtenerCodigoPedido(pedidoActual) : "";
      const confirmar = window.confirm(CONFIRMACIONES_PEDIDOS.pedidoEntregado(codigoPedido));

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
      registrarAuditoria({
        accion: estadoNuevo === "Finalizado" ? "pedido_entregado" : "pedido_pendiente",
        pedido: data,
        detalle: { estadoAnterior: estadoActual, estadoNuevo },
      });
      mostrarMensaje(`Pedido #${obtenerCodigoPedido(data)} marcado como ${estadoNuevo === "Finalizado" ? "Entregado" : estadoNuevo}.`, "success");
    } finally {
      setGuardandoEstadoPedidoId(null);
    }
  }, [guardandoEstadoPedidoId, pedidos, mostrarMensaje, puedeCambiarEstado, registrarAuditoria]);


  const finalizarTodosPendientes = useCallback(async () => {
    if (finalizandoPendientes || guardandoEstadoPedidoId) return;

    if (!puedeFinalizarPendientes) {
      mostrarMensaje("Tu rol no tiene permiso para finalizar todos los pedidos.", "error");
      return;
    }

    const pendientesParaFinalizar = pedidosPendientes.filter((pedido) => obtenerEstadoPedido(pedido) === "Pendiente");

    if (pendientesParaFinalizar.length === 0) {
      mostrarMensaje(MENSAJES_PEDIDOS.SIN_PEDIDOS_PENDIENTES, "warning");
      return;
    }

    const confirmar = window.confirm(CONFIRMACIONES_PEDIDOS.finalizarPendientes(pendientesParaFinalizar.length));

    if (!confirmar) return;

    setFinalizandoPendientes(true);

    try {
      const ids = pendientesParaFinalizar.map((pedido) => pedido.id);
      const { data, error } = await supabase
        .from("pedidos")
        .update({ estado: "Finalizado" })
        .in("id", ids)
        .select();

      if (error) {
        mostrarMensaje(`Error finalizando pedidos: ${error.message}`, "error");
        return;
      }

      const actualizados = data || [];
      const mapaActualizados = new Map(actualizados.map((pedido) => [pedido.id, pedido]));

      setPedidos((actual) => actual.map((pedido) => mapaActualizados.get(pedido.id) || pedido));
      await Promise.all((actualizados.length ? actualizados : pendientesParaFinalizar).map((pedido) => registrarAuditoria({
        accion: "finalizacion_masiva",
        pedido,
        detalle: { totalSeleccionados: ids.length },
      })));
      mostrarMensaje(`${actualizados.length || ids.length} pedidos pendientes marcados como entregados.`, "success");
    } finally {
      setFinalizandoPendientes(false);
    }
  }, [finalizandoPendientes, guardandoEstadoPedidoId, pedidosPendientes, mostrarMensaje, puedeFinalizarPendientes, registrarAuditoria]);

  const eliminarPedidoConClave = useCallback(async (id) => {
    if (eliminandoPedidoId) return;

    if (!puedeEliminarPedido) {
      mostrarMensaje("Tu rol no tiene permiso para eliminar pedidos.", "error");
      return;
    }

    const pedidoActual = pedidos.find((pedido) => pedido.id === id);
    const codigoPedido = pedidoActual ? obtenerCodigoPedido(pedidoActual) : id;

    const confirmar = window.confirm(CONFIRMACIONES_PEDIDOS.eliminarPedido(codigoPedido));

    if (!confirmar) return;

    const claveIngresada = window.prompt(CONFIRMACIONES_PEDIDOS.claveEliminarPedido(codigoPedido));

    if (claveIngresada === null) return;

    if (claveIngresada.trim() !== CLAVE_ELIMINAR_PEDIDO) {
      mostrarMensaje(MENSAJES_PEDIDOS.CLAVE_INCORRECTA_ELIMINAR, "error");
      return;
    }

    setEliminandoPedidoId(id);

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .update({ estado: "Borrado" })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        mostrarMensaje(`Error borrando pedido: ${error.message}`, "error");
        return;
      }

      setPedidos((actual) => actual.map((pedido) => (pedido.id === id ? data : pedido)));
      registrarAuditoria({
        accion: "pedido_borrado",
        pedido: data,
        detalle: { estadoAnterior: obtenerEstadoPedido(pedidoActual || {}), requiereClaveLocal: true },
      });
      mostrarMensaje(`Pedido #${codigoPedido} movido a Pedidos Borrados.`, "success");
    } finally {
      setEliminandoPedidoId(null);
    }
  }, [eliminandoPedidoId, pedidos, mostrarMensaje, puedeEliminarPedido, registrarAuditoria]);

  function abrirPanelAdmin() {
    setErrorClaveAdmin("");
    setAdminPassword("");
    setRafaAutenticado(false);
    setClaveRafa("");
    setErrorClaveRafa("");

    if (adminAutenticado) {
      navegar("/admin", "admin");
      return;
    }

    navegar("/admin", "adminLogin");
  }

  async function validarClaveAdmin(e) {
    e.preventDefault();
    setErrorClaveAdmin("");

    const email = adminEmail.trim();
    const password = adminPassword.trim();

    if (email) {
      if (!password) {
        setErrorClaveAdmin("Ingresa la contraseña del usuario administrativo.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorClaveAdmin(`No se pudo iniciar sesión: ${error.message}`);
        return;
      }

      const usuarioAutenticado = data?.user || null;
      const rol = await cargarRolAdmin(usuarioAutenticado);
      setAdminUsuario(usuarioAutenticado);
      setAdminAutenticado(true);
      setAdminPassword("");
      setErrorClaveAdmin("");
      setAdminTab(primeraPestanaPermitida(rol));
      navegar("/admin", "admin");
      return;
    }

    // Respaldo temporal: permite entrar con la clave antigua mientras se crean los usuarios en Supabase Auth.
    if (!CLAVE_ADMIN) {
      setErrorClaveAdmin("Ingresa el email del usuario administrativo. Como respaldo, también puedes configurar VITE_CLAVE_ADMIN.");
      return;
    }

    if (password === CLAVE_ADMIN) {
      guardarSesionTemporal("rafikiAdminActivo");
      setAdminUsuario(null);
      setAdminRol("admin");
      setAdminAutenticado(true);
      setAdminPassword("");
      setErrorClaveAdmin("");
      setAdminTab("pedidos");
      navegar("/admin", "admin");
      return;
    }

    setErrorClaveAdmin("Credenciales incorrectas. Inténtalo nuevamente.");
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

  async function cerrarPanelAdmin() {
    localStorage.removeItem("rafikiAdminActivo");
    localStorage.removeItem("rafikiRafaActivo");
    await supabase.auth.signOut();
    setAdminAutenticado(false);
    setAdminUsuario(null);
    setAdminRol("usuario");
    setAdminEmail("");
    setAdminPassword("");
    setRafaAutenticado(false);
    setErrorClaveAdmin("");
    navegar("/admin", "adminLogin");
  }

  function nuevoPedidoCliente() {
    reiniciarPedido();
    navegar("/cliente", "cliente");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
  }

  return (
    <>
      <style>{appStyles}</style>

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
                </div>
              )}

              {vista === "mesas" && (
                <div className="nav nav-wrap">
                  <button
                    type="button"
                    onClick={() => navegar("/admin", adminAutenticado ? "admin" : "adminLogin")}
                  >
                    Panel admin
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

          {!cargando && vista === "inicio" && <InicioRafiki navegar={navegar} />}

          {!cargando && vista === "adminLogin" && (
            <AdminLogin
              adminEmail={adminEmail}
              adminPassword={adminPassword}
              errorClaveAdmin={errorClaveAdmin}
              setAdminEmail={setAdminEmail}
              setAdminPassword={setAdminPassword}
              setErrorClaveAdmin={setErrorClaveAdmin}
              validarClaveAdmin={validarClaveAdmin}
              navegar={navegar}
            />
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
                                        : `Suma ${dinero(valorParaLlevarItem(item))}`}
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
                              <div className="summary-item-header">
                                <p>
                                  <strong>{item.cantidad} x {item.plato || item.proteina}</strong> - {" "}
                                  {dinero(item.precioPlato || item.precioProteina)}
                                </p>
                                <button
                                  type="button"
                                  className="mini-danger"
                                  onClick={() => eliminarAlmuerzo(item.id)}
                                  aria-label={`Borrar ${item.plato || item.proteina || "producto"} del pedido`}
                                >
                                  Borrar
                                </button>
                              </div>

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
                      <select value={tipoPago} onChange={(e) => {
                        setTipoPago(e.target.value);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}>
                        <option value="">Selecciona una forma de pago</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Datafono">Datafono</option>
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
            <main style={{ maxWidth: 680, margin: "0 auto" }}>
              <section className="card confirmacion-restaurante">
                <div className="hero green">
                  <div className="confirmacion-check">✓</div>
                  <h2>¡Pedido confirmado!</h2>
                  <p>Pedido #{obtenerCodigoPedido(pedidoFinalizado)} enviado a cocina</p>
                </div>

                <div className="card-pad">
                  <div className="confirmacion-info">
                    <div className="confirmacion-info-item">
                      <span>Cliente</span>
                      <strong>{pedidoFinalizado.cliente || pedidoFinalizado.cliente_nombre || "Cliente"}</strong>
                    </div>
                    <div className="confirmacion-info-item">
                      <span>Teléfono</span>
                      <strong>{pedidoFinalizado.telefono || "Sin teléfono"}</strong>
                    </div>
                    <div className="confirmacion-info-item">
                      <span>Pago</span>
                      <strong>{pedidoFinalizado.tipo_pago || "No especificado"}</strong>
                    </div>
                    <div className="confirmacion-info-item">
                      <span>Ubicación</span>
                      <strong>{pedidoFinalizado.ubicacion || "Sin ubicación"}</strong>
                    </div>
                  </div>

                  <div className="confirmacion-resumen">
                    <h3>Resumen del pedido</h3>
                    <div className="confirmacion-lineas">
                      {(pedidoFinalizado.pedido_texto || "Pedido registrado")
                        .split("\n")
                        .filter(Boolean)
                        .map((linea, index) => (
                          <div key={`${linea}-${index}`} className="confirmacion-linea">{linea}</div>
                        ))}
                    </div>
                    <div className="confirmacion-total">
                      <span>Total</span>
                      <strong>{dinero(pedidoFinalizado.total)}</strong>
                    </div>
                  </div>

                  <div className="confirmacion-ok">Pedido enviado a cocina correctamente.</div>

                  <div className="confirmacion-actions">
                    <a
                      href={linkWhatsAppFinal}
                      target="_blank"
                      rel="noreferrer"
                      className="button green whatsapp-confirm-button"
                    >
                      {BOTONES.CONFIRMAR_WHATSAPP}
                    </a>
                    <button type="button" onClick={nuevoPedidoCliente} className="button light" style={{ width: "100%" }}>
                      Hacer otro pedido
                    </button>
                  </div>
                </div>
              </section>
            </main>
          )}

          {!cargando && vista === "mesas" && (
            <Suspense fallback={<CargandoModulo texto="Cargando panel mesas..." />}>
              <PanelMesasPOS
                menu={menu}
                platosAgrupados={platosAgrupados}
                guardandoPedido={guardandoPedido}
                onEnviar={registrarPedidoMesa}
              />
            </Suspense>
          )}

          {!cargando && vista === "admin" && adminAutenticado && (
            <main className="admin-layout">
              <header className="topbar admin-panel-header">
                <div>
                  <div className="brand">⚙️ Panel Administrativo</div>
                  <h1>Gestión de pedidos y ventas</h1>
                  <p className="muted">Control de pedidos, menú diario, solicitudes y estadísticas.</p>
                  {adminUsuario?.email && <p className="muted small">Sesión activa: {adminUsuario.email}</p>}
                  <p className="muted small">Rol: <strong>{adminNombreRol}</strong></p>
                </div>
                <div className="nav nav-wrap">
                  <button type="button" onClick={() => navegar("/mesas", "mesas")}>
                    Panel mesas
                  </button>
                </div>
              </header>

              <div className="admin-tabs">
                <button
                  type="button"
                  onClick={() => setAdminTab("pedidos")}
                  className={adminTab === "pedidos" ? "active" : ""}
                >
                  Pedidos de hoy
                </button>

                {puedeVerMenu && (
                  <button
                    type="button"
                    onClick={() => setAdminTab("menu")}
                    className={adminTab === "menu" ? "active" : ""}
                  >
                    Editar menú diario
                  </button>
                )}

                {puedeVerProductos && (
                  <button
                    type="button"
                    onClick={() => setAdminTab("productos")}
                    className={adminTab === "productos" ? "active" : ""}
                  >
                    Solicitud de insumos
                  </button>
                )}

                {puedeVerGenerador && (
                  <button
                    type="button"
                    onClick={() => setAdminTab("generador")}
                    className={adminTab === "generador" ? "active" : ""}
                  >
                    Generador de menú
                  </button>
                )}

                {puedeVerRafa && (
                  <button
                    type="button"
                    onClick={() => setAdminTab("rafa")}
                    className={adminTab === "rafa" ? "active" : ""}
                  >
                    Rafa
                  </button>
                )}

                <button
                  type="button"
                  onClick={cerrarPanelAdmin}
                  className="button light admin-tab-close"
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
                      <button type="button" onClick={() => setAlertaPedidoNuevo(null)}>
                        Cerrar
                      </button>
                    </div>
                  )}


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
                    placeholder="Buscar por cliente, ubicación o pago..."
                  />

                  <p className="muted small">
                    Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos cargados.
                    {pedidosBorrados.length > 0 ? ` ${pedidosBorrados.length} en Pedidos Borrados no suman en ventas.` : ""}
                  </p>

                  <div className="pedido-seccion">
                    <div className="section-heading">
                      <h3>🟡 Pedidos pendientes</h3>
                      <div className="section-heading-actions">
                        {pedidosPendientes.length > 0 && puedeFinalizarPendientes && (
                          <button
                            type="button"
                            className="mini-btn green"
                            onClick={finalizarTodosPendientes}
                            disabled={finalizandoPendientes}
                          >
                            {finalizandoPendientes ? "Finalizando..." : "Finalizar todos"}
                          </button>
                        )}
                        <span>{pedidosPendientes.length}</span>
                      </div>
                    </div>

                    {pedidosPendientes.length === 0 ? (
                      <div className="box soft">No hay pedidos pendientes.</div>
                    ) : (
                      <TablaPedidosCompacta
                        pedidos={pedidosPendientes}
                        onCambiarEstado={cambiarEstadoPedido}
                        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
                        onEliminarPedido={puedeEliminarPedido ? eliminarPedidoConClave : undefined}
                        eliminandoPedidoId={eliminandoPedidoId}
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
                        onEliminarPedido={puedeEliminarPedido ? eliminarPedidoConClave : undefined}
                        eliminandoPedidoId={eliminandoPedidoId}
                      />
                    )}
                  </div>

                  <div className="pedido-seccion">
                    <div className="section-heading section-heading-danger">
                      <h3>🗑️ Pedidos Borrados</h3>
                      <span>{pedidosBorrados.length}</span>
                    </div>

                    {pedidosBorrados.length === 0 ? (
                      <div className="box soft">No hay pedidos borrados.</div>
                    ) : (
                      <TablaPedidosCompacta
                        pedidos={pedidosBorrados}
                        onCambiarEstado={cambiarEstadoPedido}
                        guardandoEstadoPedidoId={guardandoEstadoPedidoId}
                        eliminandoPedidoId={eliminandoPedidoId}
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
                        <strong>{pedidosActivos.length}</strong>
                      </div>

                      <div className="summary-card">
                        <span>Finalizados</span>
                        <strong>{pedidosFinalizados.length}</strong>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {adminTab === "productos" && puedeVerProductos && (
                <Suspense fallback={<CargandoModulo texto="Cargando solicitud de insumos..." />}>
                  <SolicitudProductos />
                </Suspense>
              )}

              {adminTab === "generador" && puedeVerGenerador && (
                <Suspense fallback={<CargandoModulo texto="Cargando generador de menú..." />}>
                  <GeneradorMenu />
                </Suspense>
              )}

              {adminTab === "rafa" && puedeVerRafa && (
                (adminUsuario || rafaAutenticado) ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                      <button type="button" onClick={cerrarPanelRafa} className="button light">
                        Bloquear Rafa
                      </button>
                    </div>
                    <Suspense fallback={<CargandoModulo texto="Cargando sección Rafa..." />}>
                      <PanelRafaPrivado />
                    </Suspense>
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

              {adminTab === "menu" && puedeVerMenu && (
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
