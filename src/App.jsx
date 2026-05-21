import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, supabaseConfigOk, supabaseConfigMensaje } from "./supabaseClient";
import { appStyles } from "./styles/appStyles";
import { obtenerVistaInicial, actualizarRuta } from "./utils/navigation";
import { InicioRafiki, AdminLogin } from "./components/screens/InicioAdmin";
import { CampoTexto, SelectorCantidad, useConfirmacion } from "./components/common";
import { MAX_ACOMPANANTES_CLIENTE } from "./data/menuAlmuerzos";
import {
  acompanantesATexto,
  agruparPlatosPorCategoria,
  calcularTotalItem,
  calcularTotalItems,
  crearItemNuevo,
  crearLinkWhatsApp,
  crearMensajeWhatsAppPedido,
  dinero,
  fechaISOColombia,
  guardarSesionTemporal,
  limpiarTelefonoWhatsApp,
  limpiarAcompanantesMenu,
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
  platosATexto,
  textoAPlatosDetalle,
} from "./utils/pedidos";
import { BOTONES } from "./config/textos";
import { WHATSAPP_RAFIKI } from "./config/adminConfig";
import { describirActor, nombreRol, obtenerRolUsuarioDesdeTabla, primeraPestanaPermitida, usuarioPuede } from "./utils/authAdmin";
import CargandoModulo from "./components/CargandoModulo";
import { conTiempoMaximo } from "./utils/async";
import { guardarMenuCache, hayMenuCacheValido, leerMenuCache } from "./utils/menuCache";
import {
  sincronizarPedidosPendientesOffline,
  actualizarBadgePedidosPendientes
} from "./utils/offlinePedidos";
import AdminHeaderTabs from "./components/admin/AdminHeaderTabs";
import AdminPedidosSection from "./components/admin/AdminPedidosSection";
import { useRealtimePedidos } from "./hooks/useRealtimePedidos";
import { usePedidos } from "./hooks/usePedidos";
import { useAdminPedidos } from "./hooks/useAdminPedidos";
import { leerUltimoTextoEditorGenerador } from "./utils/generadorMenu";


const SolicitudProductos = lazy(() => import("./components/SolicitudProductos"));
const GeneradorMenu = lazy(() => import("./components/GeneradorMenu"));
const PanelMesasPOS = lazy(() => import("./components/PanelMesas"));
const PanelRafaPrivado = lazy(() => import("./components/PanelRafaPrivado"));

const ADMIN_TAB_STORAGE_KEY = "rafikiAdminTabActiva";
const ADMIN_TABS_VALIDAS = new Set(["pedidos", "menu", "productos", "generador", "rafa"]);

function leerAdminTabGuardada() {
  try {
    const tab = window.localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
    return ADMIN_TABS_VALIDAS.has(tab) ? tab : "pedidos";
  } catch {
    return "pedidos";
  }
}

function guardarAdminTabActiva(tab) {
  try {
    if (ADMIN_TABS_VALIDAS.has(tab)) {
      window.localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
    }
  } catch {
    // No bloquea el panel si localStorage no está disponible.
  }
}

export default function App() {
  const [confirmarRafiki, modalConfirmacionRafiki] = useConfirmacion();
  const menuCacheDisponibleRef = useRef(hayMenuCacheValido());
  const [vista, setVista] = useState(() => obtenerVistaInicial());
  const [adminTab, setAdminTab] = useState(() => leerAdminTabGuardada());
  const [adminAutenticado, setAdminAutenticado] = useState(() => obtenerSesionActiva("rafikiAdminActivo"));
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUsuario, setAdminUsuario] = useState(null);
  const [adminRol, setAdminRol] = useState("usuario");
  const [adminAuthCargando, setAdminAuthCargando] = useState(true);
  const [errorClaveAdmin, setErrorClaveAdmin] = useState("");
  const [menu, setMenu] = useState(() => leerMenuCache());
  const [pedidos, setPedidos] = useState([]);
  const [itemsPedido, setItemsPedido] = useState([crearItemNuevo()]);
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [tipoPago, setTipoPago] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [filtroPedidos, setFiltroPedidos] = useState("hoy");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaISOColombia());
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "info" });
  const [mensajeMenu, setMensajeMenu] = useState({ texto: "", tipo: "info" });
  const [errorDatosPedido, setErrorDatosPedido] = useState("");
  const [pedidoFinalizado, setPedidoFinalizado] = useState(null);
  const [cargandoMenu, setCargandoMenu] = useState(() => !menuCacheDisponibleRef.current);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [errorCargaPedidos, setErrorCargaPedidos] = useState("");
  const [guardandoMenu, setGuardandoMenu] = useState(false);
  const [recargaPedidos, setRecargaPedidos] = useState(0);
  const [realtimeAdminActivo, setRealtimeAdminActivo] = useState(() => {
    try {
      return localStorage.getItem("rafikiRealtimeAdminActivo") === "true";
    } catch {
      return false;
    }
  });
  const [cambiosPedidosPendientes, setCambiosPedidosPendientes] = useState(false);
  const [mensajeCambiosPedidos, setMensajeCambiosPedidos] = useState("");
  const [recargaMenu, setRecargaMenu] = useState(0);
  const [alertaPedidoNuevo, setAlertaPedidoNuevo] = useState(null);
  const [platosTexto, setPlatosTexto] = useState("");
  const [acompanantesTexto, setAcompanantesTexto] = useState("");
  const mensajeTimer = useRef(null);
  const mensajeMenuTimer = useRef(null);
  const menuHashRef = useRef("");
  const alertaPedidoTimer = useRef(null);
  const sincronizandoOfflineRef = useRef(false);
  const pedidosCargaHashRef = useRef("");

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

  const activarSesionAdmin = useCallback((usuario, rol, opciones = {}) => {
    const { preservarPestana = false } = opciones;
    guardarSesionTemporal("rafikiAdminActivo");
    setAdminUsuario(usuario || null);
    setAdminRol(rol || "usuario");
    setAdminAutenticado(true);

    if (!preservarPestana) {
      const pestanaInicial = primeraPestanaPermitida(rol || "usuario");
      guardarAdminTabActiva(pestanaInicial);
      setAdminTab(pestanaInicial);
    }
  }, []);

  useEffect(() => {
    actualizarBadgePedidosPendientes();

    const reenviarPedidosPendientes = async (opciones = {}) => {
      if (!supabaseConfigOk || sincronizandoOfflineRef.current || !window.navigator.onLine) return;

      sincronizandoOfflineRef.current = true;
      try {
        const resultado = await sincronizarPedidosPendientesOffline({
          supabase,
          ids: opciones.ids,
          onPedidoSincronizado: (pedidoSincronizado) => {
            if (pedidoCoincideConFiltroActual(pedidoSincronizado)) {
              setPedidos((actual) => {
                if (actual.some((pedido) => pedido.id === pedidoSincronizado.id)) return actual;
                return [...actual, pedidoSincronizado];
              });
            }
          }
        });

        if (resultado.enviados > 0) {
          mostrarMensaje(
            `${resultado.enviados} pedido${resultado.enviados === 1 ? "" : "s"} pendiente${resultado.enviados === 1 ? "" : "s"} enviado${resultado.enviados === 1 ? "" : "s"} correctamente.`,
            "success"
          );
        }
      } finally {
        sincronizandoOfflineRef.current = false;
      }
    };

    const manejarReenvioManual = (evento) => {
      reenviarPedidosPendientes(evento?.detail || {});
    };

    window.addEventListener("online", reenviarPedidosPendientes);
    window.addEventListener("rafiki:reenviar-pedidos-offline", manejarReenvioManual);
    reenviarPedidosPendientes();

    return () => {
      window.removeEventListener("online", reenviarPedidosPendientes);
      window.removeEventListener("rafiki:reenviar-pedidos-offline", manejarReenvioManual);
    };
  }, []);

  useEffect(() => {
    let activo = true;
    const rutaAdmin = vista === "admin" || vista === "adminLogin";
    const haySesionTemporalAdmin = obtenerSesionActiva("rafikiAdminActivo");

    if (!supabaseConfigOk || (!rutaAdmin && !haySesionTemporalAdmin)) {
      setAdminAuthCargando(false);
      return () => {
        activo = false;
      };
    }

    setAdminAuthCargando(rutaAdmin);

    async function revisarSesionAdmin() {
      try {
        const { data } = await conTiempoMaximo(
          supabase.auth.getSession(),
          6000,
          "La revisión de sesión administrativa"
        );
        if (!activo) return;

        const usuario = data?.session?.user || null;
        setAdminUsuario(usuario);

        if (usuario && obtenerSesionActiva("rafikiAdminActivo")) {
          const rol = await cargarRolAdmin(usuario);
          if (!activo) return;
          activarSesionAdmin(usuario, rol, { preservarPestana: true });
          if (window.location.pathname.replace(/\/$/, "") === "/admin") {
            setVista("admin");
          }
        } else if (usuario && !obtenerSesionActiva("rafikiAdminActivo")) {
          await supabase.auth.signOut();
          if (!activo) return;
          setAdminRol("usuario");
          setAdminAutenticado(false);
        } else {
          setAdminRol("usuario");
          setAdminAutenticado(false);
        }
      } catch (error) {
        console.warn("No se pudo revisar la sesión administrativa:", error?.message || error);
        if (activo && rutaAdmin) {
          setAdminRol("usuario");
          setAdminAutenticado(false);
        }
      } finally {
        if (activo) setAdminAuthCargando(false);
      }
    }

    revisarSesionAdmin();

    return () => {
      activo = false;
    };
  }, [vista, cargarRolAdmin, activarSesionAdmin]);

  useEffect(() => {
    if (!supabaseConfigOk) return undefined;

    let activo = true;
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!activo) return;

      const usuario = session?.user || null;
      setAdminUsuario(usuario);

      if (usuario && obtenerSesionActiva("rafikiAdminActivo")) {
        const rol = await cargarRolAdmin(usuario);
        if (!activo) return;
        activarSesionAdmin(usuario, rol, { preservarPestana: true });
        setErrorClaveAdmin("");
        return;
      }

      if (!usuario) {
        setAdminRol("usuario");
        if (!obtenerSesionActiva("rafikiAdminActivo")) {
          setAdminAutenticado(false);
        }
      }
    });

    return () => {
      activo = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [cargarRolAdmin, activarSesionAdmin]);

  useEffect(() => {
    if (!adminAutenticado || adminAuthCargando) return;
    const pestanaPermitida = primeraPestanaPermitida(adminRol);

    if (!usuarioPuede(adminRol, adminTab)) {
      guardarAdminTabActiva(pestanaPermitida);
      setAdminTab(pestanaPermitida);
    }
  }, [adminAutenticado, adminAuthCargando, adminRol, adminTab]);

  const mostrarMensaje = useCallback((texto, tipo = "info") => {
    if (mensajeTimer.current) {
      clearTimeout(mensajeTimer.current);
    }

    setMensaje({ texto, tipo });

    mensajeTimer.current = setTimeout(() => {
      setMensaje({ texto: "", tipo: "info" });
    }, 5000);
  }, []);

  const mostrarMensajeMenu = useCallback((texto, tipo = "info", opciones = {}) => {
    if (mensajeMenuTimer.current) {
      clearTimeout(mensajeMenuTimer.current);
    }

    setMensajeMenu({ texto, tipo });

    if (!opciones.persistente) {
      mensajeMenuTimer.current = setTimeout(() => {
        setMensajeMenu({ texto: "", tipo: "info" });
      }, 8000);
    }
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

  const mostrarAlertaPedidoNuevo = useCallback((pedido) => {
    setAlertaPedidoNuevo(pedido);
    if (alertaPedidoTimer.current) {
      clearTimeout(alertaPedidoTimer.current);
    }
    alertaPedidoTimer.current = setTimeout(() => setAlertaPedidoNuevo(null), 12000);
  }, []);

  const realtimePuedeActualizarPedidos = realtimeAdminActivo && vista === "admin" && adminAutenticado && adminTab === "pedidos";

  const cambiarEstadoRealtimeAdmin = useCallback(() => {
    setRealtimeAdminActivo((activoActual) => {
      const siguienteEstado = !activoActual;
      try {
        localStorage.setItem("rafikiRealtimeAdminActivo", siguienteEstado ? "true" : "false");
      } catch {
        // Si localStorage no está disponible, el cambio sigue funcionando durante la sesión.
      }

      if (!siguienteEstado) {
        setCambiosPedidosPendientes(false);
        setMensajeCambiosPedidos("");
        setAlertaPedidoNuevo(null);
      } else if (vista === "admin" && adminAutenticado) {
        setRecargaPedidos((actual) => actual + 1);
      }

      return siguienteEstado;
    });
  }, [adminAutenticado, vista]);

  const marcarCambiosPedidosPendientes = useCallback((detalle = "Hay nuevos cambios en pedidos.") => {
    if (!realtimeAdminActivo) return;
    setCambiosPedidosPendientes(true);
    setMensajeCambiosPedidos(detalle);
  }, [realtimeAdminActivo]);

  const cambiarAdminTabSeguro = useCallback((tab) => {
    if (!ADMIN_TABS_VALIDAS.has(tab)) return;
    guardarAdminTabActiva(tab);
    setAdminTab(tab);

    if (tab === "pedidos") {
      setCambiosPedidosPendientes(false);
      setMensajeCambiosPedidos("");
      setRecargaPedidos((actual) => actual + 1);
    }
  }, []);

  const irAPedidosYActualizar = useCallback(() => {
    cambiarAdminTabSeguro("pedidos");
  }, [cambiarAdminTabSeguro]);

  const descartarAvisoCambiosPedidos = useCallback(() => {
    setCambiosPedidosPendientes(false);
    setMensajeCambiosPedidos("");
  }, []);

  const { estadoRealtimePedidos, pedidoCoincideConFiltroActual, instanciaRealtimeRef } = useRealtimePedidos({
    activo: realtimeAdminActivo && vista === "admin" && adminAutenticado,
    filtroPedidos,
    fechaSeleccionada,
    setPedidos,
    setRecargaPedidos,
    mostrarAlertaPedidoNuevo,
    puedeActualizarAutomatico: realtimePuedeActualizarPedidos,
    onCambiosPendientes: marcarCambiosPedidosPendientes
  });

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

  const vistaProtegidaAdmin = vista === "admin" || vista === "adminLogin";
  const cargando = vistaProtegidaAdmin && adminAuthCargando;
  const itemsConProducto = useMemo(
    () => itemsPedido.filter((item) => item.plato || item.proteina || item.producto),
    [itemsPedido]
  );

  const totalPedido = useMemo(() => calcularTotalItems(itemsConProducto), [itemsConProducto]);

  const hayProductoSeleccionado = useMemo(() => {
    return itemsPedido.some((item) => item.plato || item.proteina);
  }, [itemsPedido]);

  const {
    pedidosFiltrados,
    pedidosPendientes,
    pedidosFinalizados,
    pedidosBorrados,
    pedidosActivos,
    consolidado,
    tituloPedidos,
  } = useAdminPedidos({
    pedidos,
    busquedaDebounced,
    filtroPedidos,
    fechaSeleccionada,
  });

  const platosAgrupados = useMemo(
    () => agruparPlatosPorCategoria(menu.platos_detalle),
    [menu.platos_detalle]
  );

  const hayBusquedaPedidos = busqueda.trim().length > 0;

  const mensajeWhatsAppFinal = pedidoFinalizado ? crearMensajeWhatsAppPedido(pedidoFinalizado) : "";
  const whatsappRafikiDisponible = Boolean(limpiarTelefonoWhatsApp(WHATSAPP_RAFIKI));

  const linkWhatsAppFinal = pedidoFinalizado && whatsappRafikiDisponible
    ? crearLinkWhatsApp(WHATSAPP_RAFIKI, mensajeWhatsAppFinal)
    : "#";

  useEffect(() => {
    let cancelado = false;

    async function cargarMenuSeguro() {
      const hayCache = menuCacheDisponibleRef.current;
      setCargandoMenu(!hayCache);

      if (!supabaseConfigOk) {
        setCargandoMenu(false);
        mostrarMensaje(supabaseConfigMensaje, "error");
        return;
      }

      try {
        const { data: menuData, error: menuError } = await conTiempoMaximo(
          supabase
            .from("menu_diario")
            .select("*")
            .eq("activo", true)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle(),
          7000,
          "La carga del menú"
        );

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
            guardarMenuCache(menuNormalizado);
            menuCacheDisponibleRef.current = true;
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
        if (!cancelado && !menuCacheDisponibleRef.current) {
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
  }, [recargaMenu]);

  useEffect(() => {
    if (!supabaseConfigOk || !realtimeAdminActivo) return undefined;

    const canalMenu = supabase
      .channel(`${instanciaRealtimeRef.current}-menu`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_diario" },
        () => {
          if (adminTab === "menu") return;
          setRecargaMenu((actual) => actual + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalMenu);
    };
  }, [adminTab, realtimeAdminActivo]);

  useEffect(() => {
    let cancelado = false;
    const debeCargarPedidos = vista === "admin" && adminAutenticado;

    if (!debeCargarPedidos) {
      setCargandoPedidos(false);
      return () => {
        cancelado = true;
      };
    }

    async function cargarPedidosSeguro() {
      setCargandoPedidos(true);

      if (!supabaseConfigOk) {
        setCargandoPedidos(false);
        mostrarMensaje(supabaseConfigMensaje, "error");
        return;
      }

      try {
        const rango = obtenerRangoPedidos(filtroPedidos, fechaSeleccionada);

        const { data: pedidosData, error: pedidosError } = await conTiempoMaximo(
          supabase
            .from("pedidos")
            .select("*")
            .gte("created_at", rango.inicio)
            .lt("created_at", rango.fin)
            .order("created_at", { ascending: true }),
          12000,
          "La carga de pedidos"
        );

        if (cancelado) return;

        if (pedidosError) {
          const detalle = `Error cargando pedidos: ${pedidosError.message}`;
          setErrorCargaPedidos(detalle);
          mostrarMensaje(detalle, "error");
          return;
        }

        const pedidosNuevos = pedidosData || [];
        const nuevoHashPedidos = JSON.stringify(
          pedidosNuevos.map((pedido) => [pedido.id, pedido.estado, pedido.total, pedido.updated_at || pedido.created_at])
        );

        setErrorCargaPedidos("");
        setPedidos((actual) => {
          if (pedidosCargaHashRef.current === nuevoHashPedidos) return actual;
          pedidosCargaHashRef.current = nuevoHashPedidos;
          return pedidosNuevos;
        });
      } catch (error) {
        if (!cancelado) {
          const detalle = `No se pudieron cargar los pedidos. Se conserva la última información visible. ${error.message || ""}`.trim();
          setErrorCargaPedidos(detalle);
          mostrarMensaje(detalle, "error");
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
  }, [vista, adminAutenticado, filtroPedidos, fechaSeleccionada, recargaPedidos]);

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

  function crearPayloadsMenuDiario(menuActualizado) {
    const payloadCompleto = {
      ...menuActualizado,
      proteinas_detalle: menuActualizado.proteinas_detalle,
      platos_detalle: menuActualizado.platos_detalle,
    };

    const payloadCompatible = {
      fecha: menuActualizado.fecha,
      titulo: menuActualizado.titulo,
      descripcion: menuActualizado.descripcion,
      precio: menuActualizado.precio,
      proteinas: menuActualizado.proteinas,
      acompanantes: menuActualizado.acompanantes,
      activo: menuActualizado.activo,
    };

    const payloadMinimo = {
      fecha: menuActualizado.fecha,
      precio: menuActualizado.precio,
      proteinas: menuActualizado.proteinas,
      acompanantes: menuActualizado.acompanantes,
      activo: menuActualizado.activo,
    };

    return [payloadCompleto, payloadCompatible, payloadMinimo];
  }

  function esErrorColumnasSupabase(error) {
    const texto = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();
    return (
      texto.includes("column") ||
      texto.includes("schema cache") ||
      texto.includes("could not find") ||
      texto.includes("platos_detalle") ||
      texto.includes("proteinas_detalle") ||
      texto.includes("titulo") ||
      texto.includes("descripcion")
    );
  }

  async function ejecutarGuardadoMenuConFallback({ eraEdicion, id, payloads }) {
    const errores = [];

    for (const payload of payloads) {
      try {
        const consulta = eraEdicion
          ? supabase.from("menu_diario").update(payload).eq("id", id)
          : supabase.from("menu_diario").insert(payload);

        const respuesta = await conTiempoMaximo(
          consulta,
          12000,
          eraEdicion ? "La actualización del menú diario" : "La creación del menú diario"
        );

        if (!respuesta.error) {
          return { payloadUsado: payload };
        }

        errores.push(respuesta.error);

        if (!esErrorColumnasSupabase(respuesta.error)) {
          break;
        }
      } catch (error) {
        errores.push(error);

        if (!esErrorColumnasSupabase(error)) {
          break;
        }
      }
    }

    const ultimoError = errores[errores.length - 1];
    throw new Error(ultimoError?.message || "Supabase no aceptó el guardado del menú diario.");
  }

  function traerTextoDesdeGeneradorMenu() {
    const ultimoTexto = leerUltimoTextoEditorGenerador();

    if (!ultimoTexto) {
      mostrarMensajeMenu(
        "No encontré texto reciente del Generador de menú. Abre el generador, ajusta los platos y acompañantes, y vuelve a intentar.",
        "warning",
        { persistente: true }
      );
      return;
    }

    if (ultimoTexto.platosTexto) {
      setPlatosTexto(ultimoTexto.platosTexto);
    }

    if (ultimoTexto.acompanantesTexto) {
      setAcompanantesTexto(ultimoTexto.acompanantesTexto);
    }

    mostrarMensajeMenu(
      "✅ Texto del Generador de menú cargado. Revisa y presiona Guardar menú del día para publicarlo.",
      "success",
      { persistente: true }
    );
  }

  async function guardarMenu() {
    if (guardandoMenu) return;

    if (!supabaseConfigOk) {
      mostrarMensajeMenu(supabaseConfigMensaje, "error", { persistente: true });
      return;
    }

    setMensajeMenu({ texto: "Guardando menú diario...", tipo: "info" });

    const resultadoPlatos = textoAPlatosDetalle(platosTexto, { estricto: true });
    const acompanantes = limpiarAcompanantesMenu(listaPorLineas(acompanantesTexto));

    if (resultadoPlatos.errores.length > 0) {
      mostrarMensajeMenu(
        `No se puede guardar el menú. Corrige:\n${resultadoPlatos.errores.slice(0, 5).join("\n")}`,
        "error",
        { persistente: true }
      );
      irAElemento("confirmacion-menu-diario");
      return;
    }

    if (resultadoPlatos.platos.length === 0) {
      mostrarMensajeMenu(
        "Debes agregar al menos un plato del día con el formato Categoría | Plato:Precio.",
        "warning",
        { persistente: true }
      );
      irAElemento("confirmacion-menu-diario");
      return;
    }

    const menuActualizado = {
      fecha: menu.fecha || fechaISOColombia(),
      titulo: menu.titulo || "Almuerzo ejecutivo Rafiki",
      descripcion: menu.descripcion || "Escoge tu plato del día y máximo 3 acompañantes. Incluye sopa y bebida.",
      precio: Number(resultadoPlatos.platos[0]?.precio) || 0,
      proteinas: resultadoPlatos.platos.map((item) => item.nombre),
      proteinas_detalle: resultadoPlatos.platos.map((item) => ({
        nombre: item.nombre,
        precio: item.precio,
      })),
      platos_detalle: resultadoPlatos.platos,
      acompanantes,
      activo: true,
    };

    setGuardandoMenu(true);

    try {
      const eraEdicion = Boolean(menu.id);
      const payloads = crearPayloadsMenuDiario(menuActualizado);

      const { payloadUsado } = await ejecutarGuardadoMenuConFallback({
        eraEdicion,
        id: menu.id,
        payloads,
      });

      let idMenuGuardado = menu.id || null;

      if (!eraEdicion) {
        const { data: menuActivoReciente } = await conTiempoMaximo(
          supabase
            .from("menu_diario")
            .select("id")
            .eq("activo", true)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle(),
          7000,
          "La verificación del menú guardado"
        ).catch(() => ({ data: null }));

        idMenuGuardado = menuActivoReciente?.id || `local-${Date.now()}`;
      }

      if (idMenuGuardado && !String(idMenuGuardado).startsWith("local-")) {
        await conTiempoMaximo(
          supabase
            .from("menu_diario")
            .update({ activo: false })
            .eq("activo", true)
            .neq("id", idMenuGuardado),
          7000,
          "La desactivación de menús anteriores"
        ).catch(() => ({ error: null }));
      }

      const nuevoMenu = normalizarMenu({
        ...menu,
        ...menuActualizado,
        ...payloadUsado,
        id: idMenuGuardado,
      });

      const nuevoHash = JSON.stringify({
        id: nuevoMenu.id,
        fecha: nuevoMenu.fecha,
        titulo: nuevoMenu.titulo,
        descripcion: nuevoMenu.descripcion,
        platos_detalle: nuevoMenu.platos_detalle,
        acompanantes: nuevoMenu.acompanantes,
      });

      menuHashRef.current = nuevoHash;
      guardarMenuCache(nuevoMenu);
      menuCacheDisponibleRef.current = true;
      setMenu(nuevoMenu);
      setItemsPedido([crearItemNuevo()]);
      setPlatosTexto(platosATexto(nuevoMenu.platos_detalle));
      setAcompanantesTexto(acompanantesATexto(nuevoMenu.acompanantes));

      mostrarMensajeMenu(
        eraEdicion
          ? "✅ Menú diario actualizado correctamente."
          : "✅ Menú diario creado correctamente.",
        "success",
        { persistente: true }
      );
      irAElemento("confirmacion-menu-diario");
      setRecargaMenu((actual) => actual + 1);
    } catch (error) {
      mostrarMensajeMenu(
        `No se pudo guardar el menú diario. Detalle: ${error.message || "error desconocido"}`,
        "error",
        { persistente: true }
      );
      irAElemento("confirmacion-menu-diario");
    } finally {
      setGuardandoMenu(false);
    }
  }

  const {
    guardandoPedido,
    guardandoEstadoPedidoId,
    eliminandoPedidoId,
    finalizandoPendientes,
    registrarPedido,
    registrarPedidoMesa,
    cambiarEstadoPedido,
    finalizarTodosPendientes,
    eliminarPedidoAdministrador,
  } = usePedidos({
    itemsPedido,
    cliente,
    telefono,
    ubicacion,
    tipoPago,
    observaciones,
    pedidos,
    pedidosPendientes,
    adminUsuario,
    adminRol,
    adminActor,
    puedeCambiarEstado,
    puedeEliminarPedido,
    puedeFinalizarPendientes,
    confirmarRafiki,
    mostrarMensaje,
    setErrorDatosPedido,
    setMensaje,
    setVista,
    setPedidoFinalizado,
    setPedidos,
    pedidoCoincideConFiltroActual,
  });

  async function validarClaveAdmin(e) {
    e.preventDefault();
    setErrorClaveAdmin("");

    const email = adminEmail.trim();
    const password = adminPassword.trim();

    if (!email) {
      setErrorClaveAdmin("Ingresa el email del usuario administrativo.");
      return;
    }

    if (!password) {
      setErrorClaveAdmin("Ingresa la contraseña del usuario administrativo.");
      return;
    }

    localStorage.removeItem("rafikiAdminActivo");

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
    activarSesionAdmin(usuarioAutenticado, rol);
    setAdminPassword("");
    setErrorClaveAdmin("");
    navegar("/admin", "admin");
  }

  async function cerrarPanelAdmin() {
    localStorage.removeItem("rafikiAdminActivo");
    await supabase.auth.signOut();
    setAdminAutenticado(false);
    setAdminUsuario(null);
    setAdminRol("usuario");
    setAdminEmail("");
    setAdminPassword("");
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
      {modalConfirmacionRafiki}

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

                </div>
              )}
            </header>
          )}

          {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
          {cargando && <div className="card card-pad">Verificando sesión administrativa...</div>}

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
                  {cargandoMenu ? (
                    <div className="box soft">
                      Cargando menú de hoy...
                    </div>
                  ) : menu.platos_detalle.length === 0 ? (
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
                                    maxLength={60}
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
                                  onClick={() => irAElemento("resumen-pedido")}
                                >
                                  Ver resumen y continuar
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


                    <button
                      type="button"
                      onClick={() => irAElemento("paso-datos-entrega")}
                      className="button continue-button"
                    >
                      Continuar
                    </button>

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
                      maxLength={80}
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
                    {whatsappRafikiDisponible ? (
                      <a
                        href={linkWhatsAppFinal}
                        target="_blank"
                        rel="noreferrer"
                        className="button green whatsapp-confirm-button"
                      >
                        {BOTONES.CONFIRMAR_WHATSAPP}
                      </a>
                    ) : (
                      <div className="confirmacion-warning" role="alert">
                        WhatsApp no está configurado. El pedido ya fue enviado a cocina correctamente.
                      </div>
                    )}
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
                cargandoMenu={cargandoMenu}
                guardandoPedido={guardandoPedido}
                onEnviar={registrarPedidoMesa}
              />
            </Suspense>
          )}

          {!cargando && vista === "admin" && adminAutenticado && (
            <main className="admin-layout">
              <AdminHeaderTabs
                adminUsuario={adminUsuario}
                adminNombreRol={adminNombreRol}
                adminTab={adminTab}
                setAdminTab={cambiarAdminTabSeguro}
                puedeVerMenu={puedeVerMenu}
                puedeVerProductos={puedeVerProductos}
                puedeVerGenerador={puedeVerGenerador}
                puedeVerRafa={puedeVerRafa}
                cerrarPanelAdmin={cerrarPanelAdmin}
                navegar={navegar}
              />

              {cambiosPedidosPendientes && adminTab !== "pedidos" && (
                <section className="card card-pad admin-realtime-pending" role="status">
                  <div>
                    <strong>🔔 Hay cambios en pedidos</strong>
                    <p className="muted small">
                      {mensajeCambiosPedidos || "Realtime detectó cambios, pero no interrumpió tu pestaña actual."}
                    </p>
                  </div>
                  <div className="admin-actions-stack horizontal">
                    <button type="button" className="button" onClick={irAPedidosYActualizar}>
                      Ir a Pedidos de hoy
                    </button>
                    <button type="button" className="button light" onClick={descartarAvisoCambiosPedidos}>
                      Seguir aquí
                    </button>
                  </div>
                </section>
              )}

              {adminTab === "pedidos" && (
                <AdminPedidosSection
                  tituloPedidos={tituloPedidos}
                  setRecargaPedidos={setRecargaPedidos}
                  alertaPedidoNuevo={alertaPedidoNuevo}
                  setAlertaPedidoNuevo={setAlertaPedidoNuevo}
                  estadoRealtimePedidos={estadoRealtimePedidos}
                  realtimeAdminActivo={realtimeAdminActivo}
                  cambiarEstadoRealtimeAdmin={cambiarEstadoRealtimeAdmin}
                  filtroPedidos={filtroPedidos}
                  setFiltroPedidos={setFiltroPedidos}
                  fechaSeleccionada={fechaSeleccionada}
                  setFechaSeleccionada={setFechaSeleccionada}
                  hayBusquedaPedidos={hayBusquedaPedidos}
                  setBusqueda={setBusqueda}
                  busqueda={busqueda}
                  cargandoPedidos={cargandoPedidos}
                  errorCargaPedidos={errorCargaPedidos}
                  pedidosFiltrados={pedidosFiltrados}
                  pedidos={pedidos}
                  pedidosBorrados={pedidosBorrados}
                  pedidosPendientes={pedidosPendientes}
                  puedeFinalizarPendientes={puedeFinalizarPendientes}
                  finalizarTodosPendientes={finalizarTodosPendientes}
                  finalizandoPendientes={finalizandoPendientes}
                  cambiarEstadoPedido={cambiarEstadoPedido}
                  guardandoEstadoPedidoId={guardandoEstadoPedidoId}
                  puedeEliminarPedido={puedeEliminarPedido}
                  eliminarPedidoAdministrador={eliminarPedidoAdministrador}
                  eliminandoPedidoId={eliminandoPedidoId}
                  pedidosFinalizados={pedidosFinalizados}
                  consolidado={consolidado}
                  pedidosActivos={pedidosActivos}
                />
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
                <Suspense fallback={<CargandoModulo texto="Cargando sección Rafa..." />}>
                  <PanelRafaPrivado />
                </Suspense>
              )}

              {adminTab === "menu" && puedeVerMenu && (
                <section className="card card-pad">
                  <h2>✏️ Editar menú diario</h2>
                  <p className="muted">
                    Aquí modificas los platos, precios, categorías y acompañantes disponibles para los clientes.
                  </p>

                  <div className="box soft" style={{ marginBottom: 14 }}>
                    <strong>Traer desde Generador de menú</strong>
                    <p className="muted small" style={{ margin: "4px 0 10px" }}>
                      Carga automáticamente el texto de platos del día y acompañantes generado en la sección Generador.
                    </p>
                    <button
                      type="button"
                      className="button light"
                      onClick={traerTextoDesdeGeneradorMenu}
                      style={{ width: "100%" }}
                    >
                      📥 Traer platos y acompañantes del generador
                    </button>
                  </div>

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
                    <div
                      id="confirmacion-menu-diario"
                      className={`alert alert-${mensajeMenu.tipo} menu-action-message`}
                      role="alert"
                    >
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
