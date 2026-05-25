import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { PRODUCTOS_CATALOGO_FALLBACK } from "../data/catalogoProductosData";
import { cargarCatalogoProductosAdmin } from "../services/catalogoProductosService";
import {
  limpiarLista,
  limpiarPrecio,
  fechaHoyISO,
  normalizarPlatos,
  formatearFechaInformeMenu,
  obtenerPlatosSinPrecio,
  crearSvgMenu,
  crearSvgMenuSoloTexto,
  generarTextoEditorMenu,
  generarTextoAcompanantesEditor,
  guardarUltimoTextoEditorGenerador
} from "../utils/generadorMenu";
import { useAlertaRafiki } from "./common";

const GENERADOR_MENU_DRAFT_KEY = "rafikiGeneradorMenuBorrador21J5";

const PLATOS_GENERADOR_DEFECTO = [];

const ACOMPANANTES_GENERADOR_DEFECTO = "";

const PRODUCTOS_OCULTOS_GENERADOR = [
  "Pechuga asada sin Salsa",
  "Cerdo asado sin salsa",
  "Sopas medianas sin arroz",
  "Sopas medianas con arroz",
  "Sancocho de pollo",
  "Sancocho de pollo con arroz"
];

function normalizarTextoCatalogo(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


function esProductoOcultoGenerador(producto) {
  const clave = normalizarTextoCatalogo(producto?.nombre || producto);
  return PRODUCTOS_OCULTOS_GENERADOR.some((nombre) => normalizarTextoCatalogo(nombre) === clave);
}

function clasificarPlatoVisual(producto) {
  const nombre = producto?.nombre || "";
  const normalizado = normalizarTextoCatalogo(nombre);
  if (normalizado.startsWith("pechuga o cerdo")) return "pechugaCerdo";
  if (normalizado.startsWith("pastas")) return "pastas";
  return "guisos";
}

function nombreVisualPlato(producto) {
  const nombre = String(producto?.nombre || "").trim();
  const tipo = clasificarPlatoVisual(producto);

  if (tipo === "pechugaCerdo") {
    return nombre
      .replace(/^Pechuga o cerdo\s+en\s+/i, "")
      .replace(/^Pechuga o cerdo\s+/i, "")
      .replace(/^salsa\s+/i, "Salsa ")
      .trim();
  }

  if (tipo === "pastas") {
    return nombre.replace(/^Pastas\s*/i, "").trim();
  }

  return nombre;
}

function agruparPlatosVisuales(productos) {
  return [
    { key: "pechugaCerdo", titulo: "Pechuga y cerdo", productos: productos.filter((producto) => clasificarPlatoVisual(producto) === "pechugaCerdo") },
    { key: "pastas", titulo: "Pastas", productos: productos.filter((producto) => clasificarPlatoVisual(producto) === "pastas") },
    { key: "guisos", titulo: "Guisos y demás", productos: productos.filter((producto) => clasificarPlatoVisual(producto) === "guisos") }
  ].filter((grupo) => grupo.productos.length > 0);
}


function esSopaResumen(nombre) {
  const normalizado = normalizarTextoCatalogo(nombre?.nombre || nombre);
  return /\b(ajiaco|mote|mondongo|costilla|gallina|paticas|sancocho|sopa|sopas)\b/.test(normalizado);
}

function ordenPlatoResumen(plato) {
  const normalizado = normalizarTextoCatalogo(plato?.nombre || plato);
  if (esSopaResumen(plato)) return 3;
  if (normalizado.startsWith("pechuga o cerdo") || normalizado.startsWith("pechuga ") || normalizado.startsWith("cerdo ")) return 2;
  if (normalizado.startsWith("pastas")) return 1;
  return 0;
}

function ordenarPlatosResumen(platos = []) {
  return [...platos].sort((a, b) => {
    const orden = ordenPlatoResumen(a) - ordenPlatoResumen(b);
    if (orden !== 0) return orden;
    return String(a?.nombre || a).localeCompare(String(b?.nombre || b), "es", { sensitivity: "base" });
  });
}

function ordenAcompananteResumen(nombre) {
  const normalizado = normalizarTextoCatalogo(nombre?.nombre || nombre);
  if (normalizado.startsWith("arroz")) return 0;
  if (normalizado.startsWith("ensalada")) return 2;
  return 1;
}

function ordenarAcompanantesResumen(items = []) {
  return [...items].sort((a, b) => {
    const orden = ordenAcompananteResumen(a) - ordenAcompananteResumen(b);
    if (orden !== 0) return orden;
    return String(a?.nombre || a).localeCompare(String(b?.nombre || b), "es", { sensitivity: "base" });
  });
}

function productosRestauranteFallback() {
  return PRODUCTOS_CATALOGO_FALLBACK
    .filter((item) => item.linea === "Restaurante" && item.activo !== false && item.agotado !== true)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.nombre).localeCompare(String(b.nombre)));
}

function filtrarCatalogoMenu(productos, categoria) {
  return productos
    .filter((item) => item.linea === "Restaurante" && item.categoria === categoria && item.activo !== false && item.agotado !== true)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.nombre).localeCompare(String(b.nombre)));
}

function precioTextoProducto(producto, precioPorDefecto = "") {
  const precio = producto?.precio === null || producto?.precio === undefined || producto?.precio === "" ? precioPorDefecto : producto.precio;
  return precio === null || precio === undefined ? "" : String(precio);
}

function tipoAlertaGenerador(texto) {
  const normalizado = String(texto || "").toLowerCase();
  if (normalizado.includes("no se pudo") || normalizado.includes("error")) return "error";
  if (normalizado.includes("selecciona") || normalizado.includes("agrega")) return "advertencia";
  if (normalizado.includes("correctamente") || normalizado.includes("guardad") || normalizado.includes("descargad") || normalizado.includes("copiad")) return "exito";
  return "info";
}

function tituloAlertaGenerador(tipo) {
  if (tipo === "error") return "Revisar generador";
  if (tipo === "advertencia") return "Falta un paso";
  if (tipo === "exito") return "Acción realizada";
  return "Aviso del generador";
}

function leerBorradorGeneradorMenu() {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(GENERADOR_MENU_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export default function GeneradorMenu() {
  const borradorInicial = leerBorradorGeneradorMenu();
  const [mostrarAlertaRafiki, modalAlertaRafiki] = useAlertaRafiki();
  const [platos, setPlatos] = useState(() => Array.isArray(borradorInicial?.platos) && borradorInicial.platos.length ? borradorInicial.platos : PLATOS_GENERADOR_DEFECTO);
  const [acompanantes, setAcompanantes] = useState(() => typeof borradorInicial?.acompanantes === "string" ? borradorInicial.acompanantes : ACOMPANANTES_GENERADOR_DEFECTO);
  const [mensaje, setMensaje] = useState("");
  const [fechaMenu, setFechaMenu] = useState(() => fechaHoyISO());
  const [observaciones, setObservaciones] = useState("");
  const [guardandoHistorial, setGuardandoHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [catalogoRestaurante, setCatalogoRestaurante] = useState(() => productosRestauranteFallback());
  const [fuenteCatalogo, setFuenteCatalogo] = useState("local");
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [busquedaPlatos, setBusquedaPlatos] = useState("");
  const [busquedaSopas, setBusquedaSopas] = useState("");
  const [busquedaAcompanantes, setBusquedaAcompanantes] = useState("");
  const [seleccionCatalogoPlatos, setSeleccionCatalogoPlatos] = useState([]);
  const [seleccionCatalogoAcompanantes, setSeleccionCatalogoAcompanantes] = useState([]);

  useEffect(() => {
    let activo = true;

    async function cargarCatalogoRestaurante() {
      setCargandoCatalogo(true);
      const resultado = await cargarCatalogoProductosAdmin();
      if (!activo) return;

      if (resultado.ok && resultado.productos?.length) {
        const restaurante = resultado.productos
          .filter((item) => item.linea === "Restaurante" && item.activo !== false && item.agotado !== true)
          .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.nombre).localeCompare(String(b.nombre)));
        if (restaurante.length) {
          setCatalogoRestaurante(restaurante);
          setFuenteCatalogo("bd");
        } else {
          setCatalogoRestaurante(productosRestauranteFallback());
          setFuenteCatalogo("local");
        }
      } else {
        setCatalogoRestaurante(productosRestauranteFallback());
        setFuenteCatalogo("local");
      }

      setCargandoCatalogo(false);
    }

    cargarCatalogoRestaurante();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!mensaje) return;
    const tipo = tipoAlertaGenerador(mensaje);
    mostrarAlertaRafiki({
      tipo,
      titulo: tituloAlertaGenerador(tipo),
      mensaje
    });
  }, [mensaje, mostrarAlertaRafiki]);

  const platosLimpios = useMemo(() => ordenarPlatosResumen(platos.filter((p) => p.nombre.trim())), [platos]);
  const listaAcompanantes = useMemo(() => ordenarAcompanantesResumen(limpiarLista(acompanantes)), [acompanantes]);
  const platosResumenConIndice = useMemo(() =>
    platos
      .map((plato, index) => ({ plato, index }))
      .sort((a, b) => {
        const orden = ordenPlatoResumen(a.plato) - ordenPlatoResumen(b.plato);
        if (orden !== 0) return orden;
        return String(a.plato?.nombre || "").localeCompare(String(b.plato?.nombre || ""), "es", { sensitivity: "base" });
      }),
    [platos]
  );
  const catalogoPlatos = useMemo(() => filtrarCatalogoMenu(catalogoRestaurante, "Platos").filter((item) => !esProductoOcultoGenerador(item)), [catalogoRestaurante]);
  const catalogoSopas = useMemo(() => filtrarCatalogoMenu(catalogoRestaurante, "Sopas").filter((item) => !esProductoOcultoGenerador(item)), [catalogoRestaurante]);
  const catalogoAcompanantes = useMemo(() => filtrarCatalogoMenu(catalogoRestaurante, "Acompañantes"), [catalogoRestaurante]);

  const platosFiltradosCatalogo = useMemo(() => {
    const q = normalizarTextoCatalogo(busquedaPlatos);
    return q ? catalogoPlatos.filter((item) => normalizarTextoCatalogo(item.nombre).includes(q)) : catalogoPlatos;
  }, [catalogoPlatos, busquedaPlatos]);

  const gruposPlatosVisuales = useMemo(() => agruparPlatosVisuales(platosFiltradosCatalogo), [platosFiltradosCatalogo]);

  const sopasFiltradasCatalogo = useMemo(() => {
    const q = normalizarTextoCatalogo(busquedaSopas);
    return q ? catalogoSopas.filter((item) => normalizarTextoCatalogo(item.nombre).includes(q)) : catalogoSopas;
  }, [catalogoSopas, busquedaSopas]);

  const acompanantesFiltradosCatalogo = useMemo(() => {
    const q = normalizarTextoCatalogo(busquedaAcompanantes);
    return q ? catalogoAcompanantes.filter((item) => normalizarTextoCatalogo(item.nombre).includes(q)) : catalogoAcompanantes;
  }, [catalogoAcompanantes, busquedaAcompanantes]);

  const svg = useMemo(
    () => crearSvgMenu({ platos: platosLimpios, acompanantes: listaAcompanantes }),
    [platos, acompanantes]
  );

  const svgTexto = useMemo(
    () => crearSvgMenuSoloTexto({ platos: platosLimpios, acompanantes: listaAcompanantes }),
    [platos, acompanantes]
  );

  const svgUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);
  const svgTextoUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgTexto)}`, [svgTexto]);


  const nombresPlatosSeleccionados = useMemo(
    () => new Set(seleccionCatalogoPlatos.map((plato) => normalizarTextoCatalogo(plato.nombre)).filter(Boolean)),
    [seleccionCatalogoPlatos]
  );

  const nombresAcompanantesSeleccionados = useMemo(
    () => new Set(seleccionCatalogoAcompanantes.map((item) => normalizarTextoCatalogo(item.nombre || item)).filter(Boolean)),
    [seleccionCatalogoAcompanantes]
  );

  const textoEditorMenu = useMemo(() => generarTextoEditorMenu(platosLimpios), [platosLimpios]);
  const textoEditorAcompanantes = useMemo(() => generarTextoAcompanantesEditor(listaAcompanantes), [listaAcompanantes]);

  useEffect(() => {
    guardarUltimoTextoEditorGenerador({
      platosTexto: textoEditorMenu,
      acompanantesTexto: textoEditorAcompanantes
    });
  }, [textoEditorMenu, textoEditorAcompanantes]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      window.localStorage.setItem(
        GENERADOR_MENU_DRAFT_KEY,
        JSON.stringify({
          fechaMenu: fechaMenu || fechaHoyISO(),
          platos,
          acompanantes,
          actualizadoEn: new Date().toISOString()
        })
      );
    } catch {
      // Si el navegador no permite guardar, la app continúa normalmente.
    }
  }, [fechaMenu, platos, acompanantes]);

  const informeUltimosMenus = useMemo(() => {
    const unicosPorFecha = new Map();
    historial.forEach((registro) => {
      if (registro?.fecha && !unicosPorFecha.has(registro.fecha)) {
        unicosPorFecha.set(registro.fecha, registro);
      }
    });

    return Array.from(unicosPorFecha.values())
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
      .slice(-12);
  }, [historial]);

  function actualizarPlato(index, campo, valor) {
    setPlatos((actual) =>
      actual.map((plato, i) =>
        i === index ? { ...plato, [campo]: campo === "precio" ? limpiarPrecio(valor) : valor } : plato
      )
    );
  }

  function agregarPlato() {
    setPlatos((actual) => [...actual, { nombre: "", precio: "" }].slice(0, 8));
  }

  function quitarPlato(index) {
    setPlatos((actual) => actual.filter((_, i) => i !== index));
  }

  function alternarProductoCatalogoAlMenu(producto) {
    if (!producto?.nombre) return;
    setSeleccionCatalogoPlatos((actual) => {
      const claveProducto = normalizarTextoCatalogo(producto.nombre);
      const existe = actual.some((plato) => normalizarTextoCatalogo(plato.nombre) === claveProducto);
      if (existe) return actual.filter((plato) => normalizarTextoCatalogo(plato.nombre) !== claveProducto);
      return [...actual, producto].slice(0, 12);
    });
  }

  function alternarAcompananteCatalogo(producto) {
    if (!producto?.nombre) return;
    setSeleccionCatalogoAcompanantes((actual) => {
      const claveProducto = normalizarTextoCatalogo(producto.nombre);
      const existe = actual.some((item) => normalizarTextoCatalogo(item.nombre || item) === claveProducto);
      if (existe) return actual.filter((item) => normalizarTextoCatalogo(item.nombre || item) !== claveProducto);
      return [...actual, producto];
    });
  }

  function actualizarResumenDesdeSeleccion() {
    const preciosActuales = new Map(platos.map((plato) => [normalizarTextoCatalogo(plato.nombre), plato.precio]));
    const platosOrdenados = ordenarPlatosResumen(seleccionCatalogoPlatos).map((producto) => ({
      nombre: producto.nombre,
      precio: preciosActuales.get(normalizarTextoCatalogo(producto.nombre)) || ""
    }));
    const acompanantesOrdenados = ordenarAcompanantesResumen(seleccionCatalogoAcompanantes).map((producto) => producto.nombre || producto);
    setPlatos(platosOrdenados);
    setAcompanantes(acompanantesOrdenados.join("\n"));
    setMensaje("Resumen actualizado con la selección del catálogo.");
  }

  function borrarSeleccionCompleta() {
    setSeleccionCatalogoPlatos([]);
    setSeleccionCatalogoAcompanantes([]);
    setPlatos([]);
    setAcompanantes("");
    setMensaje("Selección del generador borrada.");
  }

  function quitarAcompananteResumen(nombre) {
    const clave = normalizarTextoCatalogo(nombre);
    setAcompanantes((actual) => limpiarLista(actual).filter((item) => normalizarTextoCatalogo(item) !== clave).join("\n"));
    setSeleccionCatalogoAcompanantes((actual) => actual.filter((item) => normalizarTextoCatalogo(item.nombre || item) !== clave));
  }

  function descargarDesdeSvg(url, nombreArchivo, mensajeOk, transparente = false, ancho = 1080, alto = 1080) {
    setMensaje("");
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const anchoReal = image.naturalWidth || ancho;
      const altoReal = image.naturalHeight || alto;

      // Importante: el SVG del generador puede crecer cuando hay varios platos
      // o acompañantes. Antes se forzaba a 1080x930/1080 y eso cortaba la
      // sección de acompañantes en el PNG descargado. Ahora el canvas toma el
      // tamaño real del SVG para exportar la imagen completa.
      canvas.width = anchoReal;
      canvas.height = altoReal;

      const ctx = canvas.getContext("2d");
      if (!transparente) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.download = nombreArchivo;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setMensaje(mensajeOk);
    };
    image.onerror = () => setMensaje("No se pudo descargar la imagen. Intenta de nuevo.");
    image.src = url;
  }

  async function copiarTextoGenerado(texto, mensajeOk) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setMensaje(mensajeOk);
    } catch (error) {
      setMensaje("No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente.");
    }
  }

  async function descargarSoloTexto() {
    const guardado = await guardarHistorialGenerador({ silencioso: true });
    if (!guardado) return;

    descargarDesdeSvg(
      svgTextoUrl,
      "menu-rafiki-solo-texto.png",
      "Imagen solo texto descargada y guardada en el historial.",
      true,
      1080,
      930
    );
  }

  async function cargarHistorialGenerador(opciones = {}) {
    setCargandoHistorial(true);
    const { data, error } = await supabase
      .from("historial_generador_menu")
      .select("id, fecha, platos, acompanantes, observaciones, creado_en")
      .order("fecha", { ascending: false })
      .order("creado_en", { ascending: false })
      .limit(21);

    if (error) {
      setMensaje(`No se pudo cargar el historial: ${error.message}`);
    } else {
      const registros = [];
      const fechasVistas = new Set();
      (data || []).forEach((registro) => {
        if (!fechasVistas.has(registro.fecha)) {
          fechasVistas.add(registro.fecha);
          registros.push(registro);
        }
      });
      setHistorial(registros);
      if (opciones.cargarUltimo && registros.length > 0) {
        cargarRegistro(registros[0], { silencioso: true });
      }
    }
    setCargandoHistorial(false);
  }

  async function guardarHistorialGenerador(opciones = {}) {
    const platosParaGuardar = normalizarPlatos(platos);
    const acompanantesParaGuardar = limpiarLista(acompanantes);

    if (!fechaMenu) {
      setMensaje("Selecciona la fecha del menú antes de guardar.");
      return false;
    }

    if (platosParaGuardar.length === 0 && acompanantesParaGuardar.length === 0) {
      setMensaje("Agrega al menos un plato o acompañante antes de guardar.");
      return false;
    }

    setGuardandoHistorial(true);
    setMensaje("");

    const registroParaGuardar = {
      fecha: fechaMenu,
      titulo: "Menú del día",
      platos: platosParaGuardar,
      acompanantes: acompanantesParaGuardar,
      texto_generado: svgTexto,
      observaciones: null
    };

    const { data: registroExistente, error: errorBuscar } = await supabase
      .from("historial_generador_menu")
      .select("id")
      .eq("fecha", fechaMenu)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorBuscar) {
      setMensaje(`No se pudo validar el historial del día: ${errorBuscar.message}`);
      setGuardandoHistorial(false);
      return false;
    }

    let error = null;
    let idGuardado = registroExistente?.id || null;

    if (registroExistente?.id) {
      const resultado = await supabase
        .from("historial_generador_menu")
        .update(registroParaGuardar)
        .eq("id", registroExistente.id);
      error = resultado.error;
    } else {
      const resultado = await supabase
        .from("historial_generador_menu")
        .insert(registroParaGuardar)
        .select("id")
        .single();
      error = resultado.error;
      idGuardado = resultado.data?.id || null;
    }

    if (error) {
      setMensaje(`No se pudo guardar el historial: ${error.message}`);
      setGuardandoHistorial(false);
      return false;
    }

    if (idGuardado) {
      await supabase
        .from("historial_generador_menu")
        .delete()
        .eq("fecha", fechaMenu)
        .neq("id", idGuardado);
    }

    if (!opciones.silencioso) {
      setMensaje(registroExistente?.id ? "Menú del día actualizado correctamente." : "Historial del generador guardado correctamente.");
    }
    await cargarHistorialGenerador({ cargarUltimo: false });

    setGuardandoHistorial(false);
    return true;
  }

  function cargarRegistro(registro, opciones = {}) {
    const platosRegistro = Array.isArray(registro.platos) ? registro.platos : [];
    const acompanantesRegistro = Array.isArray(registro.acompanantes) ? registro.acompanantes : [];

    setFechaMenu(registro.fecha || fechaHoyISO());
    setPlatos(
      platosRegistro.length
        ? platosRegistro.map((plato) => ({
            nombre: plato.nombre || "",
            precio: plato.precio ? String(plato.precio) : ""
          }))
        : [{ nombre: "", precio: "" }]
    );
    setAcompanantes(acompanantesRegistro.join("\n"));
    if (!opciones.silencioso) {
      setMensaje("Registro cargado en el generador. Puedes editarlo o descargarlo.");
    }
  }

  useEffect(() => {
    cargarHistorialGenerador({ cargarUltimo: !borradorInicial });
  }, []);

  return (
    <>
      {modalAlertaRafiki}
      <section className="card card-pad generador-menu">
      <div>
        <h2>🎨 Generador de menú Rafiki</h2>
        <p className="muted">Crea una imagen solo texto del menú para usarla en WhatsApp, Instagram o sobre una plantilla.</p>
      </div>

      <div className="generador-menu-grid">
        <div>
          <div className="box soft" style={{ marginTop: 0 }}>
            <strong>Fecha del menú</strong>
            <p className="muted small">Por defecto queda la fecha actual.</p>
            <label className="field" style={{ marginTop: 10 }}>
              <span>Fecha</span>
              <input type="date" value={fechaMenu} onChange={(e) => setFechaMenu(e.target.value || fechaHoyISO())} />
            </label>
          </div>

          <div className="box soft selector-catalogo-menu" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <div>
                <strong>Seleccionar desde Catálogo Restaurante</strong>
                <p className="muted small" style={{ marginBottom: 0 }}>
                  {cargandoCatalogo ? "Cargando catálogo..." : fuenteCatalogo === "bd" ? "Usando productos activos de Supabase." : "Usando respaldo local del catálogo."}
                </p>
              </div>
              <span className={fuenteCatalogo === "bd" ? "badge badge-finalizado" : "badge"}>{fuenteCatalogo === "bd" ? "BD" : "Local"}</span>
            </div>

            <div className="selector-catalogo-lista-limpia">
              <section className="selector-catalogo-section">
                <div className="selector-catalogo-section-head">
                  <h3 className="category-title">🍽️ Platos</h3>
                  <label className="field selector-catalogo-search">
                    <input type="search" value={busquedaPlatos} onChange={(e) => setBusquedaPlatos(e.target.value)} placeholder="Buscar plato" />
                  </label>
                </div>

                {gruposPlatosVisuales.map((grupo) => (
                  <div key={grupo.key} className="selector-subcategoria-visual">
                    <h4>{grupo.titulo}</h4>
                    <div className="productos-chips selector-catalogo-chips">
                      {grupo.productos.map((producto) => {
                        const seleccionado = nombresPlatosSeleccionados.has(normalizarTextoCatalogo(producto.nombre));
                        return (
                          <span key={producto.id} className="producto-chip-wrap">
                            <button
                              type="button"
                              className={`producto-chip selector-catalogo-chip ${seleccionado ? "selected" : ""}`}
                              onClick={() => alternarProductoCatalogoAlMenu(producto)}
                              title={seleccionado ? "Quitar del menú del día" : "Agregar al menú del día"}
                            >
                              {seleccionado ? "✓ " : "+ "}{nombreVisualPlato(producto)}
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>

              <section className="selector-catalogo-section">
                <div className="selector-catalogo-section-head">
                  <h3 className="category-title">🍲 Sopas</h3>
                  <label className="field selector-catalogo-search">
                    <input type="search" value={busquedaSopas} onChange={(e) => setBusquedaSopas(e.target.value)} placeholder="Buscar sopa" />
                  </label>
                </div>
                <div className="productos-chips selector-catalogo-chips">
                  {sopasFiltradasCatalogo.map((producto) => {
                    const seleccionado = nombresPlatosSeleccionados.has(normalizarTextoCatalogo(producto.nombre));
                    return (
                      <span key={producto.id} className="producto-chip-wrap">
                        <button
                          type="button"
                          className={`producto-chip selector-catalogo-chip ${seleccionado ? "selected" : ""}`}
                          onClick={() => alternarProductoCatalogoAlMenu(producto)}
                          title={seleccionado ? "Quitar del menú del día" : "Agregar al menú del día"}
                        >
                          {seleccionado ? "✓ " : "+ "}{producto.nombre}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </section>

              <section className="selector-catalogo-section">
                <div className="selector-catalogo-section-head">
                  <h3 className="category-title">🥗 Acompañantes</h3>
                  <label className="field selector-catalogo-search">
                    <input type="search" value={busquedaAcompanantes} onChange={(e) => setBusquedaAcompanantes(e.target.value)} placeholder="Buscar acompañante" />
                  </label>
                </div>
                <div className="productos-chips selector-catalogo-chips">
                  {acompanantesFiltradosCatalogo.map((producto) => {
                    const seleccionado = nombresAcompanantesSeleccionados.has(normalizarTextoCatalogo(producto.nombre));
                    return (
                      <span key={producto.id} className="producto-chip-wrap">
                        <button
                          type="button"
                          className={`producto-chip selector-catalogo-chip ${seleccionado ? "selected" : ""}`}
                          onClick={() => alternarAcompananteCatalogo(producto)}
                          title={seleccionado ? "Quitar acompañante" : "Agregar acompañante"}
                        >
                          {seleccionado ? "✓ " : "+ "}{producto.nombre}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          <div className="box soft resumen-menu-dia" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <div>
                <strong>Resumen del menú seleccionado</strong>
                <p className="muted small" style={{ marginBottom: 0 }}>
                  Aquí se colocan los precios de los platos del día. Primero selecciona arriba y luego actualiza este resumen.
                </p>
              </div>
              <span className="badge">{platosLimpios.length} platos · {listaAcompanantes.length} acompañantes</span>
            </div>

            <div className="resumen-menu-actions">
              <button type="button" className="button" onClick={actualizarResumenDesdeSeleccion}>
                Actualizar resumen con selección
              </button>
              <button type="button" className="button light resumen-clear-button" onClick={borrarSeleccionCompleta}>
                Borrar selección
              </button>
            </div>

            {platos.length === 0 ? (
              <div className="alert alert-info" style={{ marginTop: 12 }}>Selecciona platos o sopas desde el catálogo.</div>
            ) : (
              <div className="resumen-precios-lista">
                {platosResumenConIndice.map(({ plato, index }) => (
                  <div key={`${plato.nombre || "plato"}-${index}`} className="plato-menu-row resumen-plato-row">
                    <input
                      value={plato.nombre}
                      onChange={(e) => actualizarPlato(index, "nombre", e.target.value)}
                      placeholder="Nombre del plato"
                    />
                    <input
                      value={plato.precio}
                      onChange={(e) => actualizarPlato(index, "precio", e.target.value)}
                      placeholder="Precio"
                      inputMode="numeric"
                    />
                    <button type="button" className="button light resumen-delete-button" onClick={() => quitarPlato(index)} title="Quitar plato">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className="button light" onClick={agregarPlato} style={{ marginTop: 12 }} disabled={platos.length >= 12}>
              + Agregar manual
            </button>

            <div className="resumen-acompanantes-box">
              <strong>Acompañantes seleccionados</strong>
              {listaAcompanantes.length ? (
                <div className="resumen-acompanantes-chips">
                  {listaAcompanantes.map((nombre) => (
                    <button key={nombre} type="button" className="producto-chip selected" onClick={() => quitarAcompananteResumen(nombre)} title="Quitar acompañante">
                      ✓ {nombre}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted small" style={{ marginBottom: 0 }}>Selecciona acompañantes desde el catálogo.</p>
              )}
            </div>

            <label className="field acompanantes-manual-field" style={{ marginTop: 14 }}>
              <span>Ajuste manual de acompañantes</span>
              <textarea value={acompanantes} onChange={(e) => setAcompanantes(e.target.value)} rows={4} placeholder={"Arroz de maíz\nPuré\nEnsalada"} />
            </label>
          </div>

          <div className="box soft acciones-generador" style={{ marginTop: 14 }}>
            <strong>Acciones</strong>
            <p className="muted small">Guarda automáticamente en el historial y descarga la imagen solo texto.</p>
            <button type="button" className="button download-text-button" onClick={descargarSoloTexto} disabled={guardandoHistorial}>
              {guardandoHistorial ? "Guardando..." : "Guardar y descargar"}
            </button>
          </div>

          <div className="box soft texto-editor-menu-box" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <div>
                <strong>Texto para Editor de Menú Diario</strong>
                <p className="muted small" style={{ marginBottom: 0 }}>Copia este bloque y pégalo en el editor de menú diario.</p>
              </div>
              <button type="button" className="button light" onClick={() => copiarTextoGenerado(textoEditorMenu, "Texto de platos copiado correctamente.")}>
                📋 Copiar platos
              </button>
            </div>
            <textarea className="texto-editor-menu-output" value={textoEditorMenu} readOnly rows={12} />
          </div>

          <div className="box soft texto-editor-menu-box" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <div>
                <strong>Acompañantes para Editor</strong>
                <p className="muted small" style={{ marginBottom: 0 }}>Los acompañantes con “o” se separan y siempre se agrega “Solo esos dos”.</p>
              </div>
              <button type="button" className="button light" onClick={() => copiarTextoGenerado(textoEditorAcompanantes, "Texto de acompañantes copiado correctamente.")}>
                📋 Copiar acompañantes
              </button>
            </div>
            <textarea className="texto-editor-menu-output" value={textoEditorAcompanantes} readOnly rows={7} />
          </div>

          {mensaje && <div className="alert alert-ok menu-action-message">{mensaje}</div>}
        </div>

        <div>
          <div className="box soft" style={{ marginBottom: 10 }}>
            <strong>Vista previa solo texto</strong>
            <p className="muted small">El PNG se descarga con fondo transparente para pegar sobre otra plantilla.</p>
          </div>
          <div className="preview-menu-frame">
            <img src={svgTextoUrl} alt="Vista previa menú Rafiki solo texto" style={{ display: "block", width: "100%", height: "auto" }} />
          </div>

          <div className="box soft" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <strong>Historial reciente</strong>
              <button type="button" className="button light" onClick={() => cargarHistorialGenerador({ cargarUltimo: false })} disabled={cargandoHistorial} style={{ padding: "8px 10px" }}>
                {cargandoHistorial ? "Cargando..." : "Actualizar"}
              </button>
            </div>
            {historial.length === 0 ? (
              <p className="muted small" style={{ marginBottom: 0 }}>Todavía no hay registros guardados.</p>
            ) : (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {historial.map((registro) => (
                  <button
                    key={registro.id}
                    type="button"
                    className="history-menu-item"
                    onClick={() => cargarRegistro(registro)}
                    title="Cargar este menú en el generador"
                  >
                    <strong>{registro.fecha}</strong>
                    <span>{Array.isArray(registro.platos) ? registro.platos.length : 0} platos · {Array.isArray(registro.acompanantes) ? registro.acompanantes.length : 0} acompañantes</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="box soft" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <strong>Informe últimos 12 menús</strong>
              <span className="muted small">Solo platos, sin precios</span>
            </div>
            {informeUltimosMenus.length === 0 ? (
              <p className="muted small" style={{ marginBottom: 0 }}>Guarda menús en el historial para ver el informe.</p>
            ) : (
              <div className="informe-menu-scroll">
                <table className="informe-menu-tabla">
                  <thead>
                    <tr>
                      {informeUltimosMenus.map((registro) => {
                        const fechaInforme = formatearFechaInformeMenu(registro.fecha);
                        return (
                          <th key={registro.fecha}>
                            <span className="informe-menu-dia">{fechaInforme.diaSemana}</span>
                            <span className="informe-menu-fecha">{fechaInforme.fechaCorta}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {informeUltimosMenus.map((registro) => {
                        const platosRegistro = obtenerPlatosSinPrecio(registro);
                        return (
                          <td key={registro.fecha}>
                            {platosRegistro.length ? (
                              <ul>
                                {platosRegistro.map((plato, index) => (
                                  <li key={`${registro.fecha}-${index}`}>{plato}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="muted small">Sin platos</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .generador-menu { width: 100%; max-width: 100%; overflow: visible; }
        .generador-menu, .generador-menu * { min-width: 0; }
        .generador-menu h2 { line-height: 1.05; }
        .generador-menu-grid { width: 100%; max-width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 420px); gap: 22px; align-items: start; margin-top: 18px; }
        .plato-menu-row { display: grid; grid-template-columns: minmax(0, 1fr) 120px 38px; gap: 8px; margin-top: 10px; align-items: center; }
        .field { display: grid; gap: 7px; margin-bottom: 12px; }
        .field span { font-weight: 900; color: #3f2a1d; }
        .field input, .field textarea, .box input { width: 100%; max-width: 100%; border: 1px solid #fed7aa; border-radius: 14px; padding: 12px 13px; font: inherit; outline: none; background: #fff; box-sizing: border-box; }
        .field input:focus, .field textarea:focus, .box input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12); }
        .texto-editor-menu-box { border-color: #fdba74; background: linear-gradient(180deg, #fff7ed, #fff); }
        .texto-editor-menu-output { width: 100%; margin-top: 12px; border: 1px solid #fed7aa; border-radius: 16px; background: #fff; color: #2f1b10; padding: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 13px; line-height: 1.45; resize: vertical; box-sizing: border-box; white-space: pre; }
        .texto-editor-menu-output:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12); outline: none; }
        .preview-menu-frame { width: 100%; max-width: 100%; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 28px rgba(124,45,18,0.16); background: #fff; }
        .preview-menu-frame img { max-width: 100%; height: auto; }
        .generador-box-header { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
        .history-menu-item { width: 100%; border: 1px solid #fed7aa; border-radius: 14px; background: #fff; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px; text-align: left; cursor: pointer; color: #3f2a1d; }
        .history-menu-item span { color: #8a5a32; font-size: 13px; font-weight: 800; }
        .history-menu-item:hover { border-color: #f97316; box-shadow: 0 4px 12px rgba(124,45,18,0.08); }
        .informe-menu-scroll { width: 100%; max-width: 100%; margin-top: 12px; overflow-x: auto; overflow-y: hidden; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
        .informe-menu-tabla { width: max-content; min-width: 1080px; max-width: none; border-collapse: collapse; background: #fff; border: 1px solid #fed7aa; border-radius: 16px; overflow: hidden; }
        .informe-menu-tabla th { background: #fff7ed; color: #7c2d12; padding: 10px 12px; border: 1px solid #fed7aa; white-space: nowrap; text-align: center; }
        .informe-menu-dia { display: block; font-size: 13px; font-weight: 950; line-height: 1.15; }
        .informe-menu-fecha { display: block; margin-top: 3px; font-size: 12.5px; font-weight: 800; color: #9a3412; line-height: 1.15; }
        .informe-menu-tabla td { vertical-align: top; width: 210px; min-width: 210px; max-width: 210px; padding: 12px 14px; border: 1px solid #fed7aa; color: #3f2a1d; }
        .informe-menu-tabla ul { margin: 0; padding-left: 16px; display: grid; gap: 6px; }
        .informe-menu-tabla li { font-size: 12.5px; font-weight: 800; line-height: 1.3; overflow-wrap: normal; word-break: normal; hyphens: none; white-space: normal; }
        .download-text-button { background: linear-gradient(135deg, #dc2626, #f97316); color: #fff; border: none; box-shadow: 0 10px 22px rgba(220, 38, 38, 0.24); }
        .download-text-button:hover { transform: translateY(-1px); filter: brightness(1.02); }

        .selector-catalogo-menu { border-color: #fed7aa; background: linear-gradient(135deg, #fff7ed, #ffffff); }
        .selector-catalogo-lista-limpia { display: flex; flex-direction: column; gap: 18px; margin-top: 14px; }
        .selector-catalogo-section { padding-top: 2px; border-top: 1px solid #fed7aa; }
        .selector-catalogo-section:first-child { border-top: 0; padding-top: 0; }
        .selector-catalogo-section-head { display: grid; grid-template-columns: minmax(160px, 0.45fr) minmax(220px, 1fr); gap: 12px; align-items: end; margin-bottom: 10px; }
        .selector-catalogo-search { margin: 0; }
        .selector-catalogo-search input { padding: 10px 12px; }
        .selector-catalogo-chips { padding: 2px 0; align-content: start; margin-bottom: 8px; }
        .selector-catalogo-chip { font-size: 12.5px; line-height: 1.2; }
        .selector-subcategoria-visual { margin-top: 10px; }
        .selector-subcategoria-visual h4 { margin: 0 0 8px; color: #9a3412; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
        .resumen-menu-dia { border-color: #fdba74; background: linear-gradient(180deg, #fff7ed, #fff); }
        .resumen-menu-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
        .resumen-clear-button { width: auto !important; padding: 8px 10px !important; font-size: 12px; opacity: 0.86; }
        .resumen-precios-lista { display: grid; gap: 8px; margin-top: 12px; }
        .resumen-plato-row { margin-top: 0; }
        .resumen-delete-button { width: 32px !important; height: 32px !important; min-height: 32px !important; padding: 0 !important; border-radius: 999px !important; font-size: 16px !important; line-height: 1 !important; justify-self: center; }
        .resumen-acompanantes-box { margin-top: 14px; padding: 12px; border: 1px dashed #fdba74; border-radius: 18px; background: #fff; }
        .resumen-acompanantes-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .acompanantes-manual-field textarea { min-height: 92px; }
        @media (max-width: 860px) {
          .generador-menu-grid { grid-template-columns: 1fr !important; gap: 16px; }
          .selector-catalogo-section-head { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .generador-menu.card-pad { padding: 14px !important; border-radius: 22px; }
          .generador-menu h2 { font-size: 24px; }
          .plato-menu-row { grid-template-columns: minmax(0, 1fr) 92px 34px; gap: 6px; }
          .box.soft input, .field input, .field textarea { padding: 10px 8px; font-size: 14px; }
          .acciones-generador .button, .generador-menu .button { width: 100%; justify-content: center; }
          .generador-menu .resumen-clear-button, .generador-menu .resumen-delete-button { width: auto !important; }
          .history-menu-item { align-items: flex-start; flex-direction: column; }
          .preview-menu-frame { border-radius: 18px; }
          .informe-menu-tabla { min-width: 1080px; }
          .informe-menu-tabla td { width: 165px; min-width: 165px; max-width: 165px; padding: 10px; }
        }
        @media (max-width: 420px) {
          .plato-menu-row { grid-template-columns: minmax(0, 1fr) 88px 30px; }
          .plato-menu-row .button.resumen-delete-button { width: 30px !important; height: 30px !important; min-height: 30px !important; }
        }
      `}</style>
      </section>
    </>
  );
}