import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, supabaseConfigOk, supabaseConfigMensaje } from "./supabaseClient";
import { appStyles } from "./styles/appStyles";
import { obtenerVistaInicial, actualizarRuta } from "./utils/navigation";
import { InicioRafiki, AdminLogin } from "./components/screens/InicioAdmin";
import { CampoTexto, useConfirmacion } from "./components/common";
import { MAX_ACOMPANANTES_CLIENTE } from "./data/menuAlmuerzos";
import {
  acompanantesATexto,
  agruparPlatosPorCategoria,
  calcularTotalItems,
  crearItemNuevo,
  crearLinkWhatsApp,
  crearMensajeWhatsAppPedido,
  dinero,
  fechaISOColombia,
  guardarSesionTemporal,
  limpiarAcompanantesMenu,
  limpiarTelefonoWhatsApp,
  esCategoriaSopa,
  listaPorLineas,
  normalizarMenu,
  obtenerCliente,
  obtenerEstadoPedido,
  obtenerRangoPedidos,
  obtenerSesionActiva,
  platosATexto,
  textoAPlatosDetalle,
} from "./utils/pedidos";
import { WHATSAPP_RAFIKI } from "./config/adminConfig";
import { describirActor, nombreRol, obtenerRolUsuarioDesdeTabla, primeraPestanaPermitida, usuarioPuede } from "./utils/authAdmin";
import CargandoModulo from "./components/layout/CargandoModulo";
import { conTiempoMaximo } from "./utils/async";
import { guardarMenuCache, hayMenuCacheValido, leerMenuCache } from "./utils/menuCache";
import {
  sincronizarPedidosPendientesOffline,
  actualizarBadgePedidosPendientes
} from "./utils/offlinePedidos";
import AdminHeaderTabs from "./components/admin/AdminHeaderTabs";
import AdminPedidosSection from "./components/admin/AdminPedidosSection";
import PedidoCliente from "./components/cliente/PedidoCliente";
import ConfirmacionPedidoCliente from "./components/cliente/ConfirmacionPedidoCliente";
import { useRealtimePedidos } from "./hooks/useRealtimePedidos";
import { usePedidos } from "./hooks/usePedidos";
import { useAdminPedidos } from "./hooks/useAdminPedidos";
import { leerUltimoTextoEditorGenerador } from "./utils/generadorMenu";


const SolicitudProductos = lazy(() => import("./components/SolicitudProductos"));
const GeneradorMenu = lazy(() => import("./components/GeneradorMenu"));
const PanelMesasPOS = lazy(() => import("./components/PanelMesas"));
const PanelRafaPrivado = lazy(() => import("./components/PanelRafaPrivado"));
const CatalogoRafa = lazy(() => import("./components/CatalogoRafa"));
const GastosDiarios = lazy(() => import("./components/admin/GastosDiarios"));

const ADMIN_TAB_STORAGE_KEY = "rafikiAdminTabActiva";
const MENU_EDITOR_DRAFT_KEY = "rafikiMenuDiarioEditorBorrador";
const REALTIME_ADMIN_STORAGE_KEY = "rafikiRealtimeAdminActivo";
const ADMIN_TABS_VALIDAS = new Set(["pedidos", "menu", "productos", "generador", "catalogo", "gastos", "rafa"]);

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

function leerBorradorEditorMenuDiario() {
  try {
    const raw = window.localStorage.getItem(MENU_EDITOR_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function guardarBorradorEditorMenuDiario(payload) {
  try {
    window.localStorage.setItem(MENU_EDITOR_DRAFT_KEY, JSON.stringify({
      ...payload,
      actualizadoEn: new Date().toISOString()
    }));
  } catch {
    // El borrador es una ayuda operativa; no debe bloquear la app.
  }
}

function menuConFechaActual(menuBase) {
  return {
    ...menuBase,
    fecha: fechaISOColombia()
  };
}

function borrarBorradorEditorMenuDiario() {
  try {
    window.localStorage.removeItem(MENU_EDITOR_DRAFT_KEY);
  } catch {
    // No bloquear si el navegador no permite limpiar localStorage.
  }
}

export default function App() {
  const [confirmarRafiki, modalConfirmacionRafiki] = useConfirmacion();
  const menuCacheDisponibleRef = useRef(hayMenuCacheValido());
  const borradorEditorMenuRestauradoRef = useRef(false);
  const [vista, setVista] = useState(() => obtenerVistaInicial());
  const [adminTab, setAdminTab] = useState(() => leerAdminTabGuardada());
  const adminTabRef = useRef(adminTab);
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
      return window.localStorage.getItem(REALTIME_ADMIN_STORAGE_KEY) === "true";
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
  const puedeVerCatalogo = usuarioPuede(adminRol, "catalogo");
  const puedeVerGastos = usuarioPuede(adminRol, "gastos");
  const puedeVerInformeGastos = usuarioPuede(adminRol, "gastos_informe");
  const puedeEliminarPedido = usuarioPuede(adminRol, "eliminar_pedido");
  const puedeEditarPedido = usuarioPuede(adminRol, "editar_pedido");
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
    const rutaAdmin = vista === "admin" || vista === "adminLogin" || vista === "pedidos";
    const haySesionTemporalAdmin = obtenerSesionActiva("rafikiAdminActivo");

    const enviarALoginAdmin = () => {
      localStorage.removeItem("rafikiAdminActivo");
      setAdminRol("usuario");
      setAdminUsuario(null);
      setAdminAutenticado(false);
      if (rutaAdmin) {
        setVista("adminLogin");
      }
    };

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
          enviarALoginAdmin();
        } else {
          enviarALoginAdmin();
        }
      } catch (error) {
        console.warn("No se pudo revisar la sesión administrativa:", error?.message || error);
        if (activo && rutaAdmin) {
          enviarALoginAdmin();
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

  const irAElemento = useCallback((id) => {
    setTimeout(() => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 160);
  }, []);

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

  const realtimePuedeActualizarPedidos = realtimeAdminActivo && adminAutenticado && ((vista === "admin" && adminTab === "pedidos") || vista === "pedidos");

  const cambiarEstadoRealtimeAdmin = useCallback(() => {
    setRealtimeAdminActivo((activoActual) => {
      const siguienteEstado = !activoActual;
      try {
        window.localStorage.setItem(REALTIME_ADMIN_STORAGE_KEY, siguienteEstado ? "true" : "false");
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


  useEffect(() => {
    if (adminTab !== "menu" || borradorEditorMenuRestauradoRef.current) return;

    const borrador = leerBorradorEditorMenuDiario();
    if (borrador) {
      if (borrador.menu && typeof borrador.menu === "object") {
        setMenu((actual) => ({
          ...actual,
          ...borrador.menu,
          fecha: fechaISOColombia()
        }));
      }
      if (typeof borrador.platosTexto === "string") setPlatosTexto(borrador.platosTexto);
      if (typeof borrador.acompanantesTexto === "string") setAcompanantesTexto(borrador.acompanantesTexto);
    }

    borradorEditorMenuRestauradoRef.current = true;
  }, [adminTab]);

  useEffect(() => {
    if (vista !== "admin" || !adminAutenticado || adminTab !== "menu") return;

    setMenu((actual) => {
      const fechaActual = fechaISOColombia();
      return actual.fecha === fechaActual ? actual : { ...actual, fecha: fechaActual };
    });
  }, [vista, adminAutenticado, adminTab]);

  useEffect(() => {
    if (adminTab !== "menu") return undefined;

    const guardarBorradorTimer = window.setTimeout(() => {
      guardarBorradorEditorMenuDiario({
        menu: {
          fecha: fechaISOColombia(),
          titulo: menu.titulo || "",
          descripcion: menu.descripcion || ""
        },
        platosTexto,
        acompanantesTexto
      });
    }, 500);

    return () => window.clearTimeout(guardarBorradorTimer);
  }, [adminTab, menu.fecha, menu.titulo, menu.descripcion, platosTexto, acompanantesTexto]);

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

  const vistaProtegidaAdmin = vista === "admin" || vista === "adminLogin" || vista === "pedidos";
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

  useEffect(() => {
    adminTabRef.current = adminTab;
  }, [adminTab]);

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
            setMenu(adminTabRef.current === "menu" ? menuConFechaActual(menuNormalizado) : menuNormalizado);
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
  }, [mostrarMensaje, recargaMenu]);

  useEffect(() => {
    if (!supabaseConfigOk || !realtimeAdminActivo) return undefined;

    let ultimaRecargaMenu = 0;
    let recargaMenuPendiente = null;

    const pedirRecargaMenu = () => {
      if (adminTabRef.current === "menu") return;

      const ahora = Date.now();
      const tiempoDesdeUltima = ahora - ultimaRecargaMenu;

      if (tiempoDesdeUltima >= 2000) {
        ultimaRecargaMenu = ahora;
        setRecargaMenu((actual) => actual + 1);
        return;
      }

      if (recargaMenuPendiente) return;

      recargaMenuPendiente = window.setTimeout(() => {
        recargaMenuPendiente = null;
        if (adminTabRef.current === "menu") return;
        ultimaRecargaMenu = Date.now();
        setRecargaMenu((actual) => actual + 1);
      }, 2000 - tiempoDesdeUltima);
    };

    const canalMenu = supabase
      .channel(`${instanciaRealtimeRef.current}-menu`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_diario" },
        pedirRecargaMenu
      )
      .subscribe();

    return () => {
      if (recargaMenuPendiente) window.clearTimeout(recargaMenuPendiente);
      supabase.removeChannel(canalMenu);
    };
  }, [realtimeAdminActivo]);

  useEffect(() => {
    let cancelado = false;
    const debeCargarPedidos = adminAutenticado && ((vista === "admin" && adminTab === "pedidos") || vista === "pedidos");

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
  }, [vista, adminAutenticado, adminTab, filtroPedidos, fechaSeleccionada, recargaPedidos, mostrarMensaje]);

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

  function imprimirMenuDiarioTicket() {
    const resultadoPlatos = textoAPlatosDetalle(platosTexto, { estricto: false });
    const acompanantes = limpiarAcompanantesMenu(listaPorLineas(acompanantesTexto));

    if (resultadoPlatos.platos.length === 0 && acompanantes.length === 0) {
      mostrarMensajeMenu(
        "No hay platos ni acompañantes para imprimir. Primero carga o escribe el menú del día.",
        "warning",
        { persistente: true }
      );
      return;
    }

    const escaparHtml = (valor) =>
      String(valor || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const platosHtml = resultadoPlatos.platos
      .map((plato) => `
          <div class="item">
            <div class="nombre">${escaparHtml(plato.nombre)}</div>
            <div class="precio">$ ${dinero(plato.precio).replace("$", "").trim()}</div>
          </div>
        `)
      .join("");

    const acompanantesHtml = acompanantes
      .map((item) => `<li>${escaparHtml(item)}</li>`)
      .join("");

    const fechaTexto = menu.fecha || fechaISOColombia();
    const tituloTexto = menu.titulo || "Menú del día";
    const descripcionTexto = menu.descripcion || "";

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Menú Rafiki</title>
  <style>
    @page { size: 58mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
      font-size: 11px;
      line-height: 1.18;
    }
    .ticket { width: 50mm; max-width: 50mm; margin: 0 auto; }
    .center { text-align: center; }
    .brand { font-size: 17px; font-weight: 900; letter-spacing: 1px; }
    .titulo { font-size: 13px; font-weight: 800; margin-top: 3px; }
    .fecha { font-size: 10px; margin-top: 3px; }
    .linea { border-top: 1px dashed #111; margin: 6px 0; }
    .descripcion { font-size: 10px; text-align: center; margin: 6px 0; }
    .seccion { font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
    .item { display: flex; justify-content: space-between; gap: 5px; margin: 3px 0; }
    .nombre { font-size: 11px; font-weight: 800; flex: 1; }
    .precio { font-size: 11px; font-weight: 900; white-space: nowrap; }
    .categoria { font-size: 9px; color: #333; margin-bottom: 4px; text-transform: uppercase; }
    ul { margin: 0; padding-left: 14px; }
    li { font-size: 11px; margin: 2px 0; font-weight: 700; }
    .nota { font-size: 9px; margin-top: 8px; text-align: center; }
    @media screen {
      body { background: #f5f5f5; padding: 12px; }
      .ticket { background: #fff; padding: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="center">
      <div class="brand">RAFIKI</div>
      <div class="titulo">${escaparHtml(tituloTexto)}</div>
      <div class="fecha">${escaparHtml(fechaTexto)}</div>
    </div>
    ${descripcionTexto ? `<div class="descripcion">${escaparHtml(descripcionTexto)}</div>` : ""}
    <div class="linea"></div>
    ${resultadoPlatos.platos.length ? `${platosHtml}<div class="linea"></div>` : ""}
    ${acompanantes.length ? `<div class="seccion">Acompañantes</div><ul>${acompanantesHtml}</ul><div class="linea"></div>` : ""}
    <div class="nota">Menú sujeto a disponibilidad.</div>
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 250);
    });
  </script>
</body>
</html>`;

    const ventana = window.open("", "_blank", "width=360,height=640");
    if (!ventana) {
      mostrarMensajeMenu(
        "El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para Rafiki e intenta de nuevo.",
        "warning",
        { persistente: true }
      );
      return;
    }

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
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
      borrarBorradorEditorMenuDiario();

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
    editarPedidoAdministrador,
    editandoPedidoId,
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
    puedeEditarPedido,
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
    const rutaActual = window.location.pathname.replace(/\/$/, "") || "/";
    if (rutaActual === "/pedidos") {
      navegar("/pedidos", "pedidos");
    } else {
      navegar("/admin", "admin");
    }
  }

  async function cerrarPanelAdmin() {
    const rutaActual = window.location.pathname.replace(/\/$/, "") || "/";
    localStorage.removeItem("rafikiAdminActivo");
    await supabase.auth.signOut();
    setAdminAutenticado(false);
    setAdminUsuario(null);
    setAdminRol("usuario");
    setAdminEmail("");
    setAdminPassword("");
    setErrorClaveAdmin("");
    navegar(rutaActual === "/pedidos" ? "/pedidos" : "/admin", "adminLogin");
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
                <h1>{vista === "mesas" ? "Panel de mesas" : vista === "gastos" ? "Gastos rápidos" : vista === "pedidos" ? "Pedidos hoy" : "Menú diario y pedidos por WhatsApp"}</h1>
                <p className="muted">{vista === "mesas" ? "Toma rápida de pedidos internos." : vista === "gastos" ? "Registro rápido de compras y salidas de dinero." : vista === "pedidos" ? "Control liviano de pedidos del día." : "App real conectada a Supabase."}</p>
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
                  <button
                    type="button"
                    onClick={() => navegar("/pedidos", adminAutenticado ? "pedidos" : "adminLogin")}
                  >
                    Pedidos hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => navegar("/gastos", "gastos")}
                  >
                    Gastos
                  </button>

                </div>
              )}

              {vista === "gastos" && (
                <div className="nav nav-wrap">
                  <button
                    type="button"
                    onClick={() => navegar("/mesas", "mesas")}
                  >
                    Panel mesas
                  </button>
                  <button
                    type="button"
                    onClick={() => navegar("/pedidos", adminAutenticado ? "pedidos" : "adminLogin")}
                  >
                    Pedidos hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => navegar("/admin", adminAutenticado ? "admin" : "adminLogin")}
                  >
                    Panel admin
                  </button>
                </div>
              )}

              {vista === "pedidos" && (
                <div className="nav nav-wrap">
                  <button
                    type="button"
                    onClick={() => navegar("/mesas", "mesas")}
                  >
                    Panel mesas
                  </button>
                  <button
                    type="button"
                    onClick={() => navegar("/admin", adminAutenticado ? "admin" : "adminLogin")}
                  >
                    Panel admin
                  </button>
                  <button
                    type="button"
                    onClick={() => navegar("/gastos", "gastos")}
                  >
                    Gastos
                  </button>
                </div>
              )}
            </header>
          )}

          {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
          {cargando && <div className="card card-pad">Verificando sesión administrativa...</div>}

          {!cargando && vista === "inicio" && <InicioRafiki navegar={navegar} />}

          {!cargando && vista === "gastos" && (
            <Suspense fallback={<CargandoModulo texto="Cargando gastos rápidos..." />}>
              <GastosDiarios modoRapido mostrarInforme={false} />
            </Suspense>
          )}

          {!cargando && vista === "pedidos" && adminAutenticado && (
            <main className="admin-layout admin-layout-liviano">
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
                puedeEditarPedido={puedeEditarPedido}
                editarPedidoAdministrador={editarPedidoAdministrador}
                editandoPedidoId={editandoPedidoId}
                pedidosFinalizados={pedidosFinalizados}
                consolidado={consolidado}
                pedidosActivos={pedidosActivos}
              />
            </main>
          )}

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
            <PedidoCliente
              menu={menu}
              cargandoMenu={cargandoMenu}
              itemsPedido={itemsPedido}
              itemsConProducto={itemsConProducto}
              platosAgrupados={platosAgrupados}
              hayProductoSeleccionado={hayProductoSeleccionado}
              totalPedido={totalPedido}
              cliente={cliente}
              telefono={telefono}
              ubicacion={ubicacion}
              tipoPago={tipoPago}
              observaciones={observaciones}
              errorDatosPedido={errorDatosPedido}
              guardandoPedido={guardandoPedido}
              setCliente={setCliente}
              setTelefono={setTelefono}
              setUbicacion={setUbicacion}
              setTipoPago={setTipoPago}
              setObservaciones={setObservaciones}
              setErrorDatosPedido={setErrorDatosPedido}
              cambiarPlatoItem={cambiarPlatoItem}
              cambiarAcompananteItem={cambiarAcompananteItem}
              actualizarItem={actualizarItem}
              agregarAlmuerzo={agregarAlmuerzo}
              eliminarAlmuerzo={eliminarAlmuerzo}
              reiniciarPedido={reiniciarPedido}
              irAElemento={irAElemento}
              registrarPedido={registrarPedido}
            />
          )}

          {!cargando && vista === "confirmacion" && pedidoFinalizado && (
            <ConfirmacionPedidoCliente
              pedidoFinalizado={pedidoFinalizado}
              whatsappRafikiDisponible={whatsappRafikiDisponible}
              linkWhatsAppFinal={linkWhatsAppFinal}
              nuevoPedidoCliente={nuevoPedidoCliente}
            />
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
                puedeVerCatalogo={puedeVerCatalogo}
                puedeVerGastos={puedeVerGastos}
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
                      Ir a Pedidos hoy
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
                  puedeEditarPedido={puedeEditarPedido}
                  editarPedidoAdministrador={editarPedidoAdministrador}
                  editandoPedidoId={editandoPedidoId}
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


              {adminTab === "catalogo" && puedeVerCatalogo && (
                <Suspense fallback={<CargandoModulo texto="Cargando catálogo..." />}>
                  <CatalogoRafa />
                </Suspense>
              )}
              {adminTab === "gastos" && puedeVerGastos && (
                <Suspense fallback={<CargandoModulo texto="Cargando gastos diarios..." />}>
                  <GastosDiarios esAdministrador={puedeVerInformeGastos} />
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
                    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                      <button
                        type="button"
                        className="button"
                        onClick={traerTextoDesdeGeneradorMenu}
                        style={{ width: "100%", fontWeight: 900 }}
                      >
                        📥 Traer platos y acompañantes del generador
                      </button>
                      <button
                        type="button"
                        className="button light"
                        onClick={imprimirMenuDiarioTicket}
                        style={{ width: "100%", padding: "8px 10px", fontSize: 13 }}
                      >
                        🧾 Imprimir menú del día
                      </button>
                    </div>
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
