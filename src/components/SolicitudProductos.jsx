import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { crearLinkWhatsApp, fechaISOColombia, generarId, normalizarTexto } from "../utils/pedidos";

const WHATSAPP_SOLICITUD_INSUMOS = import.meta.env.VITE_WHATSAPP_SOLICITUD_INSUMOS || "";

const categoriasSolicitudProductos = [
  "Proteínas",
  "Lácteos y huevos",
  "Frutas, pulpas y congelados",
  "Verduras, hortalizas y tubérculos",
  "Abarrotes, secos y condimentos",
  "Empaques y desechables",
  "Aseo y limpieza"
];

const CATEGORIA_SOLICITUD_DEFECTO = "Abarrotes, secos y condimentos";
const STORAGE_INSUMOS_PENDIENTES = "rafiki_insumos_pendientes_compra_v1";

const productosRestauranteBase = [
  { categoria: "Proteínas", nombre: "Pollo" },
  { categoria: "Proteínas", nombre: "Pechuga" },
  { categoria: "Proteínas", nombre: "Carne" },
  { categoria: "Proteínas", nombre: "Cerdo" },
  { categoria: "Proteínas", nombre: "Chuleta" },
  { categoria: "Proteínas", nombre: "Atún" },
  { categoria: "Proteínas", nombre: "Carne para guisar" },
  { categoria: "Proteínas", nombre: "Carne para posta" },
  { categoria: "Proteínas", nombre: "Costilla" },
  { categoria: "Proteínas", nombre: "Gallina" },
  { categoria: "Proteínas", nombre: "Panza" },
  { categoria: "Proteínas", nombre: "Pata de cerdo" },
  { categoria: "Proteínas", nombre: "Pata de res" },
  { categoria: "Proteínas", nombre: "Sobrebarriga" },
  { categoria: "Proteínas", nombre: "Tocineta" },
  { categoria: "Lácteos y huevos", nombre: "Leche" },
  { categoria: "Lácteos y huevos", nombre: "Suero" },
  { categoria: "Lácteos y huevos", nombre: "Queso mozzarella" },
  { categoria: "Lácteos y huevos", nombre: "Queso parmesano" },
  { categoria: "Lácteos y huevos", nombre: "Queso duro" },
  { categoria: "Lácteos y huevos", nombre: "Mantequilla" },
  { categoria: "Lácteos y huevos", nombre: "Crema de leche" },
  { categoria: "Proteínas", nombre: "Jamón" },
  { categoria: "Lácteos y huevos", nombre: "Huevos" },

  { categoria: "Frutas, pulpas y congelados", nombre: "Mango" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Arándanos" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Uva" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Fresa" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Kiwi" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Piña" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Banano" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Mora" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Melón" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Tomate de árbol" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Papaya" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Patilla" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Limón" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Pulpa de guanábana" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Pulpa de zapote" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Pulpa de níspero" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Pulpa de maracuyá" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Pulpa de mango" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Fresas para congelar" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Fresas para parfait" },
  { categoria: "Frutas, pulpas y congelados", nombre: "Polvo chantillí" },

  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Ahuyama" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Ajo" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Apio" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Cebolla blanca" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Cebolla larga" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Cebolla puerro" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Cebolla roja" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Cilantro" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Espinaca" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Guineo verde" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Habichuela corta" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Lechuga batavia" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Lechuga crespa" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Lechuga romana" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Ñame" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Papa sucia" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Papa amarilla" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Pepino" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Perejil" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Pimentón amarillo" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Pimentón rojo" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Pimentón verde" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Plátano amarillo" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Plátano verde" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Ají topito" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Remolacha" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Yuca" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Zanahoria" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Tomate" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Mazorcas" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Guascas" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Champiñones" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Mix de verduras" },
  { categoria: "Verduras, hortalizas y tubérculos", nombre: "Maíz" },

  { categoria: "Abarrotes, secos y condimentos", nombre: "Arroz" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Zaragosa" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Garbanzo" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Lentejas" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Pasta" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Fideos" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Harina de trigo" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Harina amarilla" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Avena" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Granola y tostadas" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Tostadas" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Pan" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Arepas" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Papas fritas" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Stevia" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Azúcar" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Azúcar en tubitos" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Panela" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Jugo de naranja" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Jugo de mandarina" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Jugo de uva" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Ingredientes pulpa de café" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Aceite" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Sal" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Mayonesa" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Salsa de tomate" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Picante" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Finas hierbas" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Orégano" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Albahaca" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Mostaza" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Pimienta" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Fécula" },

  { categoria: "Empaques y desechables", nombre: "Sopero 12 oz" },
  { categoria: "Empaques y desechables", nombre: "Sopero 24 oz" },
  { categoria: "Empaques y desechables", nombre: "Sopero 32 oz" },
  { categoria: "Empaques y desechables", nombre: "Contenedor 3 divisiones negro" },
  { categoria: "Empaques y desechables", nombre: "Contenedor C1" },
  { categoria: "Empaques y desechables", nombre: "Contenedor J1 dorado" },
  { categoria: "Empaques y desechables", nombre: "Tarinas 12 oz" },
  { categoria: "Empaques y desechables", nombre: "Vasos Darnel 12 oz" },
  { categoria: "Empaques y desechables", nombre: "Vasos Darnel 16 oz" },
  { categoria: "Empaques y desechables", nombre: "Vasos Gold Carvajal 22 oz" },
  { categoria: "Empaques y desechables", nombre: "Vasos de tinto 9 oz" },
  { categoria: "Empaques y desechables", nombre: "Vasos de capuchino 12 oz" },
  { categoria: "Empaques y desechables", nombre: "Tapa Darnel plana" },
  { categoria: "Empaques y desechables", nombre: "Tapas Darnel domo" },
  { categoria: "Empaques y desechables", nombre: "Tapas verdes" },
  { categoria: "Empaques y desechables", nombre: "Pitillos batido 7 mm" },
  { categoria: "Empaques y desechables", nombre: "Bolsas plásticas 2K" },
  { categoria: "Empaques y desechables", nombre: "Bolsas plásticas 10K" },
  { categoria: "Empaques y desechables", nombre: "Bolsas plásticas 15K" },
  { categoria: "Empaques y desechables", nombre: "Bolsas para cubiertos" },
  { categoria: "Empaques y desechables", nombre: "Bolsas de porcionar" },
  { categoria: "Empaques y desechables", nombre: "Papel para sándwich" },
  { categoria: "Empaques y desechables", nombre: "Servilletas" },
  { categoria: "Empaques y desechables", nombre: "Comandas" },

  { categoria: "Aseo y limpieza", nombre: "Cloro" },
  { categoria: "Aseo y limpieza", nombre: "Detergente FAB" },
  { categoria: "Aseo y limpieza", nombre: "Desinfectante" },
  { categoria: "Aseo y limpieza", nombre: "Bolsas de basura normales" },
  { categoria: "Aseo y limpieza", nombre: "Bolsas de basura grandes" },
  { categoria: "Aseo y limpieza", nombre: "Papel higiénico" },
  { categoria: "Aseo y limpieza", nombre: "Cinta pegante" },
  { categoria: "Aseo y limpieza", nombre: "Esponjas" }
];

const unidadesSolicitud = ["und", "kg", "g", "lb", "paquete", "bolsa", "caja", "litro", "botella"];



function ordenarProductosPorNombre(productos) {
  return [...(productos || [])].sort((a, b) =>
    String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" })
  );
}

function ordenarCategoriasPorLista(categorias) {
  return [...categorias].sort((a, b) => {
    const indiceA = categoriasSolicitudProductos.indexOf(a);
    const indiceB = categoriasSolicitudProductos.indexOf(b);
    if (indiceA !== -1 && indiceB !== -1) return indiceA - indiceB;
    if (indiceA !== -1) return -1;
    if (indiceB !== -1) return 1;
    return String(a).localeCompare(String(b), "es", { sensitivity: "base" });
  });
}


function fechaMananaColombia() {
  const base = new Date(`${fechaISOColombia()}T00:00:00-05:00`);
  base.setDate(base.getDate() + 1);
  return fechaISOColombia(base);
}

function crearProductosSolicitudInicial() {
  return ordenarProductosPorNombre(productosRestauranteBase).map((producto) => ({
    id: generarId("insumo-base"),
    categoria: producto.categoria,
    nombre: producto.nombre,
    cantidad: "",
    unidad: "und",
    nota: "",
    seleccionada: false
  }));
}

function agruparProductosSolicitud(productos) {
  const grupos = (productos || []).reduce((resultado, producto) => {
    const categoria = producto.categoria || "Productos";

    if (!resultado[categoria]) {
      resultado[categoria] = [];
    }

    resultado[categoria].push(producto);
    return resultado;
  }, {});

  return ordenarCategoriasPorLista(Object.keys(grupos)).reduce((ordenado, categoria) => {
    ordenado[categoria] = ordenarProductosPorNombre(grupos[categoria]);
    return ordenado;
  }, {});
}


function obtenerProductosSolicitudSeleccionados(productos) {
  return (productos || [])
    .map((producto) => ({
      ...producto,
      seleccionada: Boolean(producto.seleccionada),
      cantidad: String(producto.cantidad || "").trim(),
      unidad: String(producto.unidad || "und").trim(),
      nota: String(producto.nota || "").trim()
    }))
    .filter((producto) => producto.seleccionada);
}

function crearMensajeSolicitudProductos({ fechaSolicitud, fechaPara, productos, observaciones }) {
  const grupos = agruparProductosSolicitud(productos);
  const lineas = [
    "Hola, esta es la solicitud de insumos para Rafiki:",
    "",
    `Fecha de solicitud: ${fechaSolicitud}`,
    `Insumos requeridos para: ${fechaPara}`,
    "",
    "Listado solicitado:"
  ];

  Object.entries(grupos).forEach(([categoria, items]) => {
    lineas.push("", `*${categoria}*`);

    items.forEach((item) => {
      const cantidad = String(item.cantidad || "").trim();
      const unidad = String(item.unidad || "und").trim();
      const cantidadTexto = cantidad ? `: ${cantidad}${unidad ? ` ${unidad}` : ""}` : "";
      const nota = item.nota ? ` — ${item.nota}` : "";
      lineas.push(`• ${item.nombre}${cantidadTexto}${nota}`);
    });
  });

  if (observaciones) {
    lineas.push("", `Observaciones: ${observaciones}`);
  }

  return lineas.join("\n");
}


function crearClaveProducto(nombre) {
  return normalizarTexto(nombre).replace(/\s+/g, "-");
}

function cargarEstadoPendientesCompra() {
  try {
    const guardado = localStorage.getItem(STORAGE_INSUMOS_PENDIENTES);
    return guardado ? JSON.parse(guardado) : {};
  } catch {
    return {};
  }
}

function guardarEstadoPendientesCompra(estado) {
  try {
    localStorage.setItem(STORAGE_INSUMOS_PENDIENTES, JSON.stringify(estado));
  } catch {
    // Si el navegador bloquea localStorage, la app sigue funcionando en memoria.
  }
}

function obtenerInsumosDeSolicitud(solicitud) {
  if (Array.isArray(solicitud?.insumos)) return solicitud.insumos;
  // Compatibilidad temporal por si existe alguna solicitud antigua con columna productos.
  if (Array.isArray(solicitud?.productos)) return solicitud.productos;
  return [];
}

function obtenerProductosPendientesDesdeSolicitudes(solicitudes, fechaBase = fechaISOColombia()) {
  const mapa = new Map();

  (solicitudes || []).forEach((solicitud) => {
    const productos = obtenerInsumosDeSolicitud(solicitud);

    productos.forEach((producto) => {
      const nombre = String(producto.nombre || "").trim();
      if (!nombre) return;

      const fechaSolicitudBase = String(solicitud.fecha_solicitud || solicitud.created_at || fechaBase).slice(0, 10);
      const claveProducto = crearClaveProducto(nombre);
      const clave = `${fechaSolicitudBase}-${claveProducto}`;
      const existente = mapa.get(clave) || {
        id: clave,
        nombre,
        categoria: producto.categoria || "Productos",
        vecesSolicitado: 0,
        fechas: [],
        fechaSolicitud: fechaSolicitudBase
      };

      existente.vecesSolicitado += 1;

      const fecha = solicitud.fecha_para || solicitud.fecha_solicitud || solicitud.created_at;
      if (fecha && !existente.fechas.includes(fecha)) {
        existente.fechas.push(fecha);
      }

      mapa.set(clave, existente);
    });
  });

  return Array.from(mapa.values()).sort((a, b) => {
    const categoriaA = categoriasSolicitudProductos.indexOf(a.categoria);
    const categoriaB = categoriasSolicitudProductos.indexOf(b.categoria);
    const ordenCategoriaA = categoriaA === -1 ? 999 : categoriaA;
    const ordenCategoriaB = categoriaB === -1 ? 999 : categoriaB;

    if (ordenCategoriaA !== ordenCategoriaB) return ordenCategoriaA - ordenCategoriaB;
    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
  });
}

function crearMensajeCompraProveedores(productos, fechaListado = fechaISOColombia()) {
  const grupos = agruparProductosSolicitud(productos);
  const lineas = [
    "Hola, esta es la lista de insumos para cotizar/comprar para Rafiki:",
    "",
    `Fecha de solicitud consultada: ${fechaListado}`,
    "",
    "Insumos:"
  ];

  Object.entries(grupos).forEach(([categoria, items]) => {
    lineas.push("", `*${categoria}*`);

    items.forEach((producto) => {
      const cantidad = String(producto.cantidadComprar || "").trim();
      lineas.push(`• ${producto.nombre}${cantidad ? ` : ${cantidad}` : ""}`);
    });
  });

  return lineas.join("\n");
}


function CampoTexto({
  etiqueta,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  rows = 3
}) {
  return (
    <label className="field">
      <span>{etiqueta}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

export default function SolicitudProductos() {
  const [productosSolicitud, setProductosSolicitud] = useState(() => crearProductosSolicitudInicial());
  const [fechaParaSolicitud, setFechaParaSolicitud] = useState(fechaMananaColombia());
  const [observacionesSolicitud, setObservacionesSolicitud] = useState("");
  const [mensajeSolicitud, setMensajeSolicitud] = useState({ texto: "", tipo: "info" });
  const [guardandoSolicitud, setGuardandoSolicitud] = useState(false);
  const [solicitudFinalizada, setSolicitudFinalizada] = useState(null);
  const [nuevoProductoSolicitudNombre, setNuevoProductoSolicitudNombre] = useState("");
  const [nuevoProductoSolicitudCategoria, setNuevoProductoSolicitudCategoria] = useState(CATEGORIA_SOLICITUD_DEFECTO);
  const [productoSolicitudEliminarId, setProductoSolicitudEliminarId] = useState("");
  const [vistaSolicitud, setVistaSolicitud] = useState("solicitar");
  const [solicitudesGuardadas, setSolicitudesGuardadas] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [estadoPendientesCompra, setEstadoPendientesCompra] = useState(cargarEstadoPendientesCompra);
  const [mensajePendientes, setMensajePendientes] = useState({ texto: "", tipo: "info" });
  const [fechaConsultaSolicitudes, setFechaConsultaSolicitudes] = useState(fechaISOColombia());
  const [yaExisteSolicitudHoy, setYaExisteSolicitudHoy] = useState(false);

  const productosSolicitudSeleccionados = useMemo(
    () => obtenerProductosSolicitudSeleccionados(productosSolicitud),
    [productosSolicitud]
  );

  const productosSolicitudAgrupados = useMemo(
    () => agruparProductosSolicitud(productosSolicitud),
    [productosSolicitud]
  );

  const productosPendientesCompra = useMemo(() => {
    const pendientesBase = obtenerProductosPendientesDesdeSolicitudes(solicitudesGuardadas, fechaConsultaSolicitudes);

    return pendientesBase.map((producto) => ({
      ...producto,
      comprado: Boolean(estadoPendientesCompra[producto.id]?.comprado),
      cantidadComprar: estadoPendientesCompra[producto.id]?.cantidadComprar || ""
    }));
  }, [solicitudesGuardadas, estadoPendientesCompra, fechaConsultaSolicitudes]);

  const productosParaEnviarProveedor = useMemo(
    () => productosPendientesCompra.filter((producto) => !producto.comprado && estadoPendientesCompra[producto.id]?.enviarProveedor !== false),
    [productosPendientesCompra, estadoPendientesCompra]
  );

  const productosPendientesAgrupados = useMemo(
    () => agruparProductosSolicitud(productosPendientesCompra),
    [productosPendientesCompra]
  );

  const mensajeWhatsAppSolicitud = useMemo(
    () =>
      crearMensajeSolicitudProductos({
        fechaSolicitud: fechaISOColombia(),
        fechaPara: fechaParaSolicitud,
        productos: productosSolicitudSeleccionados,
        observaciones: observacionesSolicitud.trim()
      }),
    [fechaParaSolicitud, productosSolicitudSeleccionados, observacionesSolicitud]
  );

  useEffect(() => {
    guardarEstadoPendientesCompra(estadoPendientesCompra);
  }, [estadoPendientesCompra]);

  useEffect(() => {
    verificarSolicitudDelDia();
  }, []);

  useEffect(() => {
    if (vistaSolicitud === "pendientes") {
      cargarSolicitudesPendientesCompra(fechaConsultaSolicitudes);
    }
  }, [vistaSolicitud, fechaConsultaSolicitudes]);

  async function verificarSolicitudDelDia() {
    // Ya no se bloquea toda la solicitud del día.
    // La validación se hace producto por producto al guardar.
    setYaExisteSolicitudHoy(false);
  }

  function obtenerProductosRepetidosDelDia(solicitudesDelDia, productosSeleccionados) {
    const productosYaSolicitados = new Set();

    (solicitudesDelDia || []).forEach((solicitud) => {
      const productos = obtenerInsumosDeSolicitud(solicitud);
      productos.forEach((producto) => {
        const nombre = normalizarTexto(producto?.nombre || "");
        if (nombre) productosYaSolicitados.add(nombre);
      });
    });

    return productosSeleccionados.filter((producto) =>
      productosYaSolicitados.has(normalizarTexto(producto.nombre))
    );
  }

  async function cargarSolicitudesPendientesCompra(fecha = fechaConsultaSolicitudes) {
    setCargandoPendientes(true);
    setMensajePendientes({ texto: "", tipo: "info" });

    try {
      const { data, error } = await supabase
        .from("solicitudes_insumos")
        .select("*")
        .eq("fecha_solicitud", fecha)
        .order("id", { ascending: false })
        .limit(80);

      if (error) {
        setMensajePendientes({ texto: `Error cargando solicitudes: ${error.message}`, tipo: "error" });
        return;
      }

      setSolicitudesGuardadas(data || []);

      if (!data || data.length === 0) {
        setMensajePendientes({ texto: `No hay solicitudes guardadas para el día ${fecha}.`, tipo: "info" });
      }
    } catch (error) {
      setMensajePendientes({
        texto: `Error inesperado cargando pendientes: ${error.message || "revisa la conexión."}`,
        tipo: "error"
      });
    } finally {
      setCargandoPendientes(false);
    }
  }

  function actualizarPendienteCompra(id, cambios) {
    setEstadoPendientesCompra((actual) => ({
      ...actual,
      [id]: {
        ...(actual[id] || {}),
        ...cambios
      }
    }));
    setMensajePendientes({ texto: "", tipo: "info" });
  }

  function enviarListadoProveedores() {
    if (productosParaEnviarProveedor.length === 0) {
      setMensajePendientes({ texto: "No hay insumos pendientes para enviar. Los insumos están marcados como comprados.", tipo: "warning" });
      return;
    }

    const mensaje = crearMensajeCompraProveedores(productosParaEnviarProveedor, fechaConsultaSolicitudes);
    const link = crearLinkWhatsApp(WHATSAPP_SOLICITUD_INSUMOS, mensaje, { abrirApp: true });
    setMensajePendientes({ texto: "Se abrirá WhatsApp con el listado para proveedores.", tipo: "success" });
    window.location.href = link;
  }

  function limpiarCompradosPendientes() {
    const confirmar = window.confirm("¿Quieres desmarcar todos los insumos comprados y borrar las cantidades escritas?");
    if (!confirmar) return;
    setEstadoPendientesCompra({});
    setMensajePendientes({ texto: "Lista de compras reiniciada.", tipo: "success" });
  }

  async function borrarSolicitudesDelDia() {
    const fecha = fechaConsultaSolicitudes || fechaISOColombia();
    const confirmar = window.confirm(
      `¿Seguro que deseas borrar todas las solicitudes del día ${fecha}? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    setCargandoPendientes(true);
    setMensajePendientes({ texto: "Borrando solicitudes del día...", tipo: "info" });

    try {
      const { error } = await supabase
        .from("solicitudes_insumos")
        .delete()
        .eq("fecha_solicitud", fecha);

      if (error) {
        setMensajePendientes({ texto: `Error borrando solicitudes: ${error.message}`, tipo: "error" });
        return;
      }

      setSolicitudesGuardadas([]);

      setEstadoPendientesCompra((actual) => {
        const nuevoEstado = { ...actual };
        Object.keys(nuevoEstado).forEach((clave) => {
          if (clave.startsWith(`${fecha}-`)) {
            delete nuevoEstado[clave];
          }
        });
        return nuevoEstado;
      });

      if (fecha === fechaISOColombia()) {
        setYaExisteSolicitudHoy(false);
      }

      setMensajePendientes({ texto: `Solicitudes del día ${fecha} borradas correctamente.`, tipo: "success" });
    } catch (error) {
      setMensajePendientes({
        texto: `Error inesperado borrando solicitudes: ${error.message || "revisa la conexión."}`,
        tipo: "error"
      });
    } finally {
      setCargandoPendientes(false);
    }
  }

  function actualizarProductoSolicitud(id, cambios) {
    setProductosSolicitud((actual) =>
      actual.map((producto) => (producto.id === id ? { ...producto, ...cambios } : producto))
    );
    setMensajeSolicitud({ texto: "", tipo: "info" });
    setSolicitudFinalizada(null);
  }

  function alternarProductoSolicitud(id) {
    setProductosSolicitud((actual) =>
      actual.map((producto) => {
        if (producto.id !== id) return producto;

        const seleccionado = Boolean(producto.seleccionada);

        return {
          ...producto,
          seleccionada: !seleccionado,
          cantidad: seleccionado ? "" : producto.cantidad || "",
          nota: seleccionado ? "" : producto.nota
        };
      })
    );
    setMensajeSolicitud({ texto: "", tipo: "info" });
    setSolicitudFinalizada(null);
  }

  function agregarProductoSolicitudALista() {
    const nombre = nuevoProductoSolicitudNombre.trim();
    const categoria = nuevoProductoSolicitudCategoria.trim() || CATEGORIA_SOLICITUD_DEFECTO;

    if (!nombre) {
      setMensajeSolicitud({ texto: "Escribe el nombre del insumo que quieres agregar.", tipo: "warning" });
      return;
    }

    const yaExiste = productosSolicitud.some(
      (producto) => normalizarTexto(producto.nombre) === normalizarTexto(nombre)
    );

    if (yaExiste) {
      setMensajeSolicitud({ texto: "Ese insumo ya está en la lista.", tipo: "warning" });
      return;
    }

    const nuevoProducto = {
      id: generarId("insumo"),
      categoria,
      nombre,
      cantidad: "",
      unidad: "und",
      nota: "",
      seleccionada: true
    };

    setProductosSolicitud((actual) => [...actual, nuevoProducto]);
    setProductoSolicitudEliminarId(nuevoProducto.id);
    setNuevoProductoSolicitudNombre("");
    setNuevoProductoSolicitudCategoria(categoria);
    setSolicitudFinalizada(null);
    setMensajeSolicitud({ texto: "Insumo agregado a la lista.", tipo: "success" });
  }

  function quitarProductoSolicitudDeLista(id) {
    if (!id) {
      setMensajeSolicitud({ texto: "Selecciona el insumo que quieres eliminar de la lista.", tipo: "warning" });
      return;
    }

    const producto = productosSolicitud.find((item) => item.id === id);
    const nombre = producto?.nombre || "este insumo";
    const confirmar = window.confirm(`¿Eliminar ${nombre} de la lista principal? Esta acción solo afecta esta lista de solicitud.`);

    if (!confirmar) return;

    setProductosSolicitud((actual) => actual.filter((item) => item.id !== id));
    setProductoSolicitudEliminarId("");
    setSolicitudFinalizada(null);
    setMensajeSolicitud({ texto: "Insumo eliminado de la lista principal.", tipo: "info" });
  }

  function construirSolicitudProductos() {
    const productos = obtenerProductosSolicitudSeleccionados(productosSolicitud);

    if (productos.length === 0) {
      return {
        error: "Selecciona al menos un insumo para guardar la solicitud."
      };
    }

    const fechaSolicitud = fechaISOColombia();
    const mensajeFinal = crearMensajeSolicitudProductos({
      fechaSolicitud,
      fechaPara: fechaParaSolicitud,
      productos,
      observaciones: observacionesSolicitud.trim()
    });

    const nuevaSolicitud = {
      fecha_solicitud: fechaSolicitud,
      fecha_para: fechaParaSolicitud,
      insumos: productos,
      observaciones: observacionesSolicitud.trim(),
      mensaje: mensajeFinal
    };

    return { nuevaSolicitud, mensajeFinal };
  }

  async function guardarSolicitudProductos({ abrirWhatsApp = false } = {}) {
    if (guardandoSolicitud) return;

    const { nuevaSolicitud, mensajeFinal, error: errorValidacion } = construirSolicitudProductos();

    if (errorValidacion) {
      setMensajeSolicitud({ texto: errorValidacion, tipo: "warning" });
      return;
    }

    setGuardandoSolicitud(true);

    try {
      const hoy = fechaISOColombia();
      const { data: solicitudesHoy, error: errorConsultaHoy } = await supabase
        .from("solicitudes_insumos")
        .select("id, insumos")
        .eq("fecha_solicitud", hoy)
        .order("id", { ascending: false })
        .limit(200);

      if (errorConsultaHoy) {
        setMensajeSolicitud({ texto: `No se pudo validar si hay insumos repetidos hoy: ${errorConsultaHoy.message}`, tipo: "error" });
        return;
      }

      const productosRepetidos = obtenerProductosRepetidosDelDia(solicitudesHoy || [], nuevaSolicitud.insumos);

      if (productosRepetidos.length > 0) {
        const nombresRepetidos = productosRepetidos.map((producto) => producto.nombre).join(", ");
        setMensajeSolicitud({
          texto: `Estos insumos ya fueron solicitados hoy y no se pueden repetir: ${nombresRepetidos}. Puedes quitar esos insumos y guardar los demás.`,
          tipo: "warning"
        });
        return;
      }

      const { data, error } = await supabase
        .from("solicitudes_insumos")
        .insert(nuevaSolicitud)
        .select()
        .single();

      if (error) {
        setMensajeSolicitud({ texto: `Error guardando solicitud: ${error.message}`, tipo: "error" });
        return;
      }

      const solicitudGuardada = data || nuevaSolicitud;
      setSolicitudFinalizada(solicitudGuardada);
      setSolicitudesGuardadas((actual) => [solicitudGuardada, ...actual]);
      setYaExisteSolicitudHoy(false);

      if (abrirWhatsApp) {
        const link = crearLinkWhatsApp(
          WHATSAPP_SOLICITUD_INSUMOS,
          solicitudGuardada.mensaje || mensajeFinal,
          { abrirApp: true }
        );

        setMensajeSolicitud({
          texto: "Solicitud guardada. Se abrirá WhatsApp con el consolidado.",
          tipo: "success"
        });

        window.location.href = link;
      } else {
        setMensajeSolicitud({
          texto: "Solicitud guardada. Ahora puedes enviar el consolidado por WhatsApp.",
          tipo: "success"
        });
      }
    } catch (error) {
      setMensajeSolicitud({
        texto: `Error inesperado guardando solicitud: ${error.message || "revisa la conexión e intenta nuevamente."}`,
        tipo: "error"
      });
    } finally {
      setGuardandoSolicitud(false);
    }
  }

  function limpiarSolicitudProductos() {
    setProductosSolicitud(crearProductosSolicitudInicial());
    setFechaParaSolicitud(fechaMananaColombia());
    setObservacionesSolicitud("");
    setNuevoProductoSolicitudNombre("");
    setNuevoProductoSolicitudCategoria(CATEGORIA_SOLICITUD_DEFECTO);
    setProductoSolicitudEliminarId("");
    setMensajeSolicitud({ texto: "", tipo: "info" });
    setSolicitudFinalizada(null);
  }

  return (
    <section className="card card-pad">
      <div className="admin-top-row">
        <div>
          <h2>🧺 Solicitud de insumos</h2>
          <p className="muted small">Selecciona insumos o revisa el consolidado pendiente para comprar.</p>
        </div>
      </div>

      <div className="admin-tabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={vistaSolicitud === "solicitar" ? "active" : ""}
          onClick={() => setVistaSolicitud("solicitar")}
        >
          Solicitar insumos
        </button>
        <button
          type="button"
          className={vistaSolicitud === "pendientes" ? "active" : ""}
          onClick={() => setVistaSolicitud("pendientes")}
        >
          Insumos pendientes
        </button>
      </div>

      {vistaSolicitud === "solicitar" && (
        <>
                      <div className="admin-top-row">
                        <div>
                          <h2>🧺 Solicitud de insumos</h2>
                        </div>

                        <button type="button" onClick={limpiarSolicitudProductos} className="button light">
                          Limpiar
                        </button>
                      </div>

                      <div className="grid-2">
                        <CampoTexto
                          etiqueta="Fecha para la que se necesitan"
                          type="date"
                          value={fechaParaSolicitud}
                          onChange={(valor) => {
                            setFechaParaSolicitud(valor);
                            setSolicitudFinalizada(null);
                            setMensajeSolicitud({ texto: "", tipo: "info" });
                          }}
                        />

                        <div className="box soft">
                          <strong>{productosSolicitudSeleccionados.length} insumos seleccionados</strong>
                        </div>
                      </div>

                      <div className="alert alert-info">
                        Puedes hacer varias solicitudes en el día, siempre que no repitas el mismo insumo.
                      </div>

                      {mensajeSolicitud.texto && (
                        <div className={`alert alert-${mensajeSolicitud.tipo}`}>
                          {mensajeSolicitud.texto}
                        </div>
                      )}

                      {Object.entries(productosSolicitudAgrupados).map(([categoria, productos]) => (
                        <div key={categoria} className="category-block">
                          <h3 className="category-title">{categoria}</h3>

                          <div className="productos-chips">
                            {productos.map((producto) => {
                              const seleccionado = Boolean(producto.seleccionada);

                              return (
                                <span key={producto.id} className="producto-chip-wrap">
                                  <button
                                    type="button"
                                    onClick={() => alternarProductoSolicitud(producto.id)}
                                    className={`producto-chip ${seleccionado ? "selected" : ""}`}
                                  >
                                    {seleccionado ? "✓ " : "+ "}
                                    {producto.nombre}
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {productosSolicitudSeleccionados.length > 0 && (
                        <div className="box soft">
                          <strong>Insumos seleccionados:</strong>
                          <p className="muted small" style={{ marginTop: 6, marginBottom: 0 }}>
                            {productosSolicitudSeleccionados.map((producto) => producto.nombre).join(", ")}
                          </p>
                        </div>
                      )}

                      <CampoTexto
                        etiqueta="Observaciones generales"
                        value={observacionesSolicitud}
                        onChange={(valor) => {
                          setObservacionesSolicitud(valor);
                          setSolicitudFinalizada(null);
                          setMensajeSolicitud({ texto: "", tipo: "info" });
                        }}
                        placeholder="Ej: comprar temprano, revisar calidad, priorizar verduras frescas..."
                        multiline
                        rows={2}
                      />

                      {productosSolicitudSeleccionados.length > 0 && (
                        <div className="box soft">
                          <strong>Vista previa del mensaje</strong>
                          <div className="solicitud-preview">{mensajeWhatsAppSolicitud}</div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => guardarSolicitudProductos({ abrirWhatsApp: true })}
                        disabled={guardandoSolicitud}
                        className="button green"
                        style={{ width: "100%", marginTop: 14 }}
                      >
                        {guardandoSolicitud ? "Guardando solicitud..." : "Guardar solicitud y enviar por WhatsApp"}
                      </button>

                      <div className="box soft" style={{ marginTop: 18 }}>
                        <strong>Agregar insumo a la lista</strong>
                        <div className="producto-add-row">
                          <input
                            type="text"
                            value={nuevoProductoSolicitudNombre}
                            onChange={(e) => setNuevoProductoSolicitudNombre(e.target.value)}
                            placeholder="Ej: Maíz tierno"
                          />

                          <select
                            value={nuevoProductoSolicitudCategoria}
                            onChange={(e) => setNuevoProductoSolicitudCategoria(e.target.value)}
                          >
                            {categoriasSolicitudProductos.map((categoria) => (
                              <option key={categoria} value={categoria}>
                                {categoria}
                              </option>
                            ))}
                          </select>

                          <button type="button" className="button green" onClick={agregarProductoSolicitudALista}>
                            Agregar
                          </button>
                        </div>
                      </div>

                      <div className="box soft" style={{ marginTop: 12 }}>
                        <strong>Eliminar insumo de la lista</strong>
                        <p className="muted small" style={{ marginBottom: 8 }}>
                          Esta opción es solo para administrar el listado principal.
                        </p>
                        <div className="producto-delete-row">
                          <select
                            value={productoSolicitudEliminarId}
                            onChange={(e) => setProductoSolicitudEliminarId(e.target.value)}
                          >
                            <option value="">Selecciona un insumo</option>
                            {ordenarProductosPorNombre(productosSolicitud).map((producto) => (
                              <option key={producto.id} value={producto.id}>
                                {producto.categoria} - {producto.nombre}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="button danger"
                            onClick={() => quitarProductoSolicitudDeLista(productoSolicitudEliminarId)}
                          >
                            Eliminar de la lista
                          </button>
                        </div>
                      </div>
        </>
      )}

      {vistaSolicitud === "pendientes" && (
        <div>
          <div className="admin-top-row">
            <div>
              <h2>🛒 Insumos pendientes</h2>
              <p className="muted small">
                Aquí solo verás los insumos solicitados. La cantidad a comprar la defines tú.
              </p>
            </div>

            <div className="actions-inline">
              <button type="button" onClick={() => cargarSolicitudesPendientesCompra(fechaConsultaSolicitudes)} className="button light" disabled={cargandoPendientes}>
                {cargandoPendientes ? "Cargando..." : "Actualizar"}
              </button>
              <button type="button" onClick={limpiarCompradosPendientes} className="button light">
                Reiniciar marcas
              </button>
              <button
                type="button"
                onClick={borrarSolicitudesDelDia}
                className="button danger"
                disabled={cargandoPendientes}
              >
                Borrar solicitudes del día
              </button>
            </div>
          </div>

          <div className="box soft" style={{ marginBottom: 12 }}>
            <CampoTexto
              etiqueta="Ver solicitudes del día"
              type="date"
              value={fechaConsultaSolicitudes}
              onChange={(valor) => {
                setFechaConsultaSolicitudes(valor || fechaISOColombia());
                setMensajePendientes({ texto: "", tipo: "info" });
              }}
            />
            <p className="muted small" style={{ marginTop: 6 }}>
              Cambia la fecha para consultar solicitudes anteriores y consolidar solo ese día.
            </p>
          </div>

          {mensajePendientes.texto && (
            <div className={`alert alert-${mensajePendientes.tipo}`}>
              {mensajePendientes.texto}
            </div>
          )}

          <div className="box soft" style={{ marginBottom: 12 }}>
            <strong>{productosParaEnviarProveedor.length} insumos seleccionados para enviar del día {fechaConsultaSolicitudes}</strong>
            <p className="muted small" style={{ marginTop: 6 }}>
              Marca la columna Enviar para escoger qué insumos van por WhatsApp. Los insumos comprados no se envían.
            </p>
            {productosPendientesCompra.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button
                  type="button"
                  className="button secondary"
                  style={{ padding: "8px 10px", fontSize: 12 }}
                  onClick={() => {
                    productosPendientesCompra.forEach((producto) => {
                      if (!producto.comprado) actualizarPendienteCompra(producto.id, { enviarProveedor: true });
                    });
                  }}
                >
                  Seleccionar todos
                </button>
                <button
                  type="button"
                  className="button secondary"
                  style={{ padding: "8px 10px", fontSize: 12 }}
                  onClick={() => {
                    productosPendientesCompra.forEach((producto) => {
                      if (!producto.comprado) actualizarPendienteCompra(producto.id, { enviarProveedor: false });
                    });
                  }}
                >
                  Quitar selección
                </button>
              </div>
            )}
          </div>

          {productosPendientesCompra.length === 0 ? (
            <div className="box soft">
              {cargandoPendientes ? "Cargando solicitudes..." : "No hay insumos pendientes por ahora."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {Object.entries(productosPendientesAgrupados).map(([categoria, productos]) => (
                <div key={categoria} className="box soft" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <h3 className="category-title" style={{ margin: 0 }}>{categoria}</h3>
                    <span className="muted small">{productos.length} insumo{productos.length === 1 ? "" : "s"}</span>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {productos.map((producto) => (
                      <div
                        key={producto.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "34px minmax(0, 1fr) 76px 34px",
                          gap: 8,
                          alignItems: "center",
                          padding: "10px",
                          borderRadius: 14,
                          background: producto.comprado ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.75)",
                          border: "1px solid rgba(0,0,0,0.06)"
                        }}
                      >
                        <label
                          title={producto.comprado ? "Comprado: no se envía" : "Enviar por WhatsApp"}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: producto.comprado
                              ? "rgba(0,0,0,0.04)"
                              : estadoPendientesCompra[producto.id]?.enviarProveedor === false
                                ? "rgba(0,0,0,0.04)"
                                : "rgba(46,125,50,0.12)"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!producto.comprado && estadoPendientesCompra[producto.id]?.enviarProveedor !== false}
                            disabled={producto.comprado}
                            onChange={(e) => actualizarPendienteCompra(producto.id, { enviarProveedor: e.target.checked })}
                            aria-label={`Enviar ${producto.nombre} por WhatsApp`}
                          />
                        </label>

                        <strong
                          style={{
                            display: "block",
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textDecoration: producto.comprado ? "line-through" : "none",
                            opacity: producto.comprado ? 0.55 : 1
                          }}
                          title={producto.nombre}
                        >
                          {producto.nombre}
                        </strong>

                        <input
                          type="text"
                          value={producto.cantidadComprar}
                          onChange={(e) => actualizarPendienteCompra(producto.id, { cantidadComprar: e.target.value })}
                          placeholder="Cant."
                          disabled={producto.comprado}
                          style={{ width: "100%", minWidth: 0, padding: "8px 6px", textAlign: "center", fontSize: 13 }}
                        />

                        <label
                          title={producto.comprado ? "Comprado" : "Marcar comprado"}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: producto.comprado ? "rgba(46,125,50,0.12)" : "rgba(0,0,0,0.04)"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={producto.comprado}
                            onChange={(e) => actualizarPendienteCompra(producto.id, { comprado: e.target.checked })}
                            aria-label={`Marcar ${producto.nombre} como comprado`}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={enviarListadoProveedores}
            className="button green"
            style={{ width: "100%", marginTop: 14 }}
            disabled={productosParaEnviarProveedor.length === 0}
          >
            Enviar seleccionados por WhatsApp
          </button>
        </div>
      )}
    </section>
  );
}
