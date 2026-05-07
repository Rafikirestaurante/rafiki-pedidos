import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const WHATSAPP_SOLICITUD_PRODUCTOS = import.meta.env.VITE_WHATSAPP_SOLICITUD_PRODUCTOS || "573013707032";

const categoriasSolicitudProductos = [
  "Proteínas, lácteos y huevos",
  "Frutas, pulpas y congelados",
  "Verduras, hortalizas y tubérculos",
  "Abarrotes, secos y condimentos",
  "Empaques y desechables",
  "Aseo y limpieza"
];

const CATEGORIA_SOLICITUD_DEFECTO = "Abarrotes, secos y condimentos";
const STORAGE_PRODUCTOS_PENDIENTES = "rafiki_productos_pendientes_compra_v2";

const productosRestauranteBase = [
  { categoria: "Proteínas, lácteos y huevos", nombre: "Pollo" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Pechuga" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Carne" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Cerdo" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Chuleta" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Atún" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Carne para guisar" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Carne para posta" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Costilla" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Gallina" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Panza" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Pata de cerdo" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Pata de res" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Sobrebarriga" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Tocineta" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Leche" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Suero" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Queso mozzarella" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Queso parmesano" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Queso duro" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Mantequilla" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Crema de leche" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Jamón" },
  { categoria: "Proteínas, lácteos y huevos", nombre: "Huevos" },

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
  { categoria: "Abarrotes, secos y condimentos", nombre: "Ingredientes pulpa de café" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Aceite" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Sal" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Mayonesa" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Salsa de tomate" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Picante" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Finas hierbas" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Orégano" },
  { categoria: "Abarrotes, secos y condimentos", nombre: "Albahaca" },

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
  { categoria: "Empaques y desechables", nombre: "Bolsas plásticas 3K" },
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
  { categoria: "Aseo y limpieza", nombre: "Cinta pegante" }
];

const unidadesSolicitud = ["und", "kg", "g", "lb", "paquete", "bolsa", "caja", "litro", "botella"];

function fechaISOColombia(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(fecha);
}

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function crearLinkWhatsApp(numero, mensaje, { abrirApp = false } = {}) {
  const numeroLimpio = String(numero || "").replace(/\D/g, "");
  const texto = encodeURIComponent(mensaje || "");
  const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (abrirApp && esMovil) {
    return `whatsapp://send?phone=${numeroLimpio}&text=${texto}`;
  }

  return `https://wa.me/${numeroLimpio}?text=${texto}`;
}

function fechaMananaColombia() {
  const base = new Date(`${fechaISOColombia()}T00:00:00-05:00`);
  base.setDate(base.getDate() + 1);
  return fechaISOColombia(base);
}

function crearProductosSolicitudInicial() {
  return productosRestauranteBase.map((producto) => ({
    id: crypto?.randomUUID ? crypto.randomUUID() : `${producto.categoria}-${producto.nombre}-${Math.random()}`,
    categoria: producto.categoria,
    nombre: producto.nombre,
    cantidad: "",
    unidad: "und",
    nota: "",
    seleccionada: false
  }));
}

function agruparProductosSolicitud(productos) {
  return (productos || []).reduce((grupos, producto) => {
    const categoria = producto.categoria || "Productos";

    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }

    grupos[categoria].push(producto);
    return grupos;
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
    "Hola, esta es la solicitud de productos para Rafiki:",
    "",
    `Fecha de solicitud: ${fechaSolicitud}`,
    `Productos requeridos para: ${fechaPara}`,
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
    const guardado = localStorage.getItem(STORAGE_PRODUCTOS_PENDIENTES);
    return guardado ? JSON.parse(guardado) : {};
  } catch {
    return {};
  }
}

function guardarEstadoPendientesCompra(estado) {
  try {
    localStorage.setItem(STORAGE_PRODUCTOS_PENDIENTES, JSON.stringify(estado));
  } catch {
    // Si el navegador bloquea localStorage, la app sigue funcionando en memoria.
  }
}

function obtenerProductosPendientesDesdeSolicitudes(solicitudes, fechaBase = fechaISOColombia()) {
  const mapa = new Map();

  (solicitudes || []).forEach((solicitud) => {
    const productos = Array.isArray(solicitud.productos) ? solicitud.productos : [];

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

  return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function crearMensajeCompraProveedores(productos, fechaListado = fechaISOColombia()) {
  const lineas = [
    "Hola, esta es la lista de productos para cotizar/comprar para Rafiki:",
    "",
    `Fecha de solicitud consultada: ${fechaListado}`,
    "",
    "Productos:"
  ];

  productos.forEach((producto) => {
    const cantidad = String(producto.cantidadComprar || "").trim();
    lineas.push(`• ${producto.nombre}${cantidad ? ` — Cantidad a comprar: ${cantidad}` : ""}`);
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
  const [productosSolicitud, setProductosSolicitud] = useState(crearProductosSolicitudInicial);
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
    () => productosPendientesCompra.filter((producto) => !producto.comprado),
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
    try {
      const hoy = fechaISOColombia();
      const { data, error } = await supabase
        .from("solicitudes_productos")
        .select("id, fecha_solicitud")
        .eq("fecha_solicitud", hoy)
        .limit(1);

      if (!error) {
        setYaExisteSolicitudHoy((data || []).length > 0);
      }
    } catch {
      // Si no se puede verificar, no bloqueamos la app por error de conexión.
    }
  }

  async function cargarSolicitudesPendientesCompra(fecha = fechaConsultaSolicitudes) {
    setCargandoPendientes(true);
    setMensajePendientes({ texto: "", tipo: "info" });

    try {
      const { data, error } = await supabase
        .from("solicitudes_productos")
        .select("*")
        .eq("fecha_solicitud", fecha)
        .order("created_at", { ascending: false })
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
      setMensajePendientes({ texto: "No hay productos pendientes para enviar. Los productos están marcados como comprados.", tipo: "warning" });
      return;
    }

    const mensaje = crearMensajeCompraProveedores(productosParaEnviarProveedor, fechaConsultaSolicitudes);
    const link = crearLinkWhatsApp(WHATSAPP_SOLICITUD_PRODUCTOS, mensaje, { abrirApp: true });
    setMensajePendientes({ texto: "Se abrirá WhatsApp con el listado para proveedores.", tipo: "success" });
    window.location.href = link;
  }

  function limpiarCompradosPendientes() {
    const confirmar = window.confirm("¿Quieres desmarcar todos los productos comprados y borrar las cantidades escritas?");
    if (!confirmar) return;
    setEstadoPendientesCompra({});
    setMensajePendientes({ texto: "Lista de compras reiniciada.", tipo: "success" });
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
      setMensajeSolicitud({ texto: "Escribe el nombre del producto que quieres agregar.", tipo: "warning" });
      return;
    }

    const yaExiste = productosSolicitud.some(
      (producto) => normalizarTexto(producto.nombre) === normalizarTexto(nombre)
    );

    if (yaExiste) {
      setMensajeSolicitud({ texto: "Ese producto ya está en la lista.", tipo: "warning" });
      return;
    }

    const nuevoProducto = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
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
    setMensajeSolicitud({ texto: "Producto agregado a la lista.", tipo: "success" });
  }

  function quitarProductoSolicitudDeLista(id) {
    if (!id) {
      setMensajeSolicitud({ texto: "Selecciona el producto que quieres eliminar de la lista.", tipo: "warning" });
      return;
    }

    const producto = productosSolicitud.find((item) => item.id === id);
    const nombre = producto?.nombre || "este producto";
    const confirmar = window.confirm(`¿Eliminar ${nombre} de la lista principal? Esta acción solo afecta esta lista de solicitud.`);

    if (!confirmar) return;

    setProductosSolicitud((actual) => actual.filter((item) => item.id !== id));
    setProductoSolicitudEliminarId("");
    setSolicitudFinalizada(null);
    setMensajeSolicitud({ texto: "Producto eliminado de la lista principal.", tipo: "info" });
  }

  function construirSolicitudProductos() {
    const productos = obtenerProductosSolicitudSeleccionados(productosSolicitud);

    if (productos.length === 0) {
      return {
        error: "Selecciona al menos un producto para guardar la solicitud."
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
      productos,
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
        .from("solicitudes_productos")
        .select("id")
        .eq("fecha_solicitud", hoy)
        .limit(1);

      if (errorConsultaHoy) {
        setMensajeSolicitud({ texto: `No se pudo validar el límite diario: ${errorConsultaHoy.message}`, tipo: "error" });
        return;
      }

      if ((solicitudesHoy || []).length > 0) {
        setYaExisteSolicitudHoy(true);
        setMensajeSolicitud({
          texto: "Ya se realizó una solicitud de productos el día de hoy. Solo se permite una solicitud por día.",
          tipo: "warning"
        });
        return;
      }

      const { data, error } = await supabase
        .from("solicitudes_productos")
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
      setYaExisteSolicitudHoy(true);

      if (abrirWhatsApp) {
        const link = crearLinkWhatsApp(
          WHATSAPP_SOLICITUD_PRODUCTOS,
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
          <h2>🧺 Solicitud de productos</h2>
          <p className="muted small">Selecciona productos o revisa el consolidado pendiente para comprar.</p>
        </div>
      </div>

      <div className="admin-tabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={vistaSolicitud === "solicitar" ? "active" : ""}
          onClick={() => setVistaSolicitud("solicitar")}
        >
          Solicitar productos
        </button>
        <button
          type="button"
          className={vistaSolicitud === "pendientes" ? "active" : ""}
          onClick={() => setVistaSolicitud("pendientes")}
        >
          Productos pendientes
        </button>
      </div>

      {vistaSolicitud === "solicitar" && (
        <>
                      <div className="admin-top-row">
                        <div>
                          <h2>🧺 Solicitud de productos</h2>
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
                          <strong>{productosSolicitudSeleccionados.length} productos seleccionados</strong>
                        </div>
                      </div>

                      {yaExisteSolicitudHoy && (
                        <div className="alert alert-warning">
                          Ya se realizó una solicitud de productos hoy. Puedes revisar el consolidado en “Productos pendientes” o consultar días anteriores.
                        </div>
                      )}

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
                          <strong>Productos seleccionados</strong>

                          <div className="productos-seleccionados-lista">
                            {productosSolicitud
                              .filter((producto) => producto.seleccionada)
                              .map((producto) => (
                                <div key={producto.id} className="producto-seleccionado-row">
                                  <strong>{producto.nombre}</strong>

                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={producto.cantidad}
                                    onChange={(e) =>
                                      actualizarProductoSolicitud(producto.id, { cantidad: e.target.value })
                                    }
                                    placeholder="Cant."
                                  />

                                  <select
                                    value={producto.unidad}
                                    onChange={(e) =>
                                      actualizarProductoSolicitud(producto.id, { unidad: e.target.value })
                                    }
                                  >
                                    {unidadesSolicitud.map((unidad) => (
                                      <option key={unidad} value={unidad}>
                                        {unidad}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="text"
                                    value={producto.nota}
                                    onChange={(e) =>
                                      actualizarProductoSolicitud(producto.id, { nota: e.target.value })
                                    }
                                    placeholder="Nota"
                                  />

                                  <button
                                    type="button"
                                    className="button light"
                                    onClick={() => actualizarProductoSolicitud(producto.id, { seleccionada: false, cantidad: "", nota: "" })}
                                  >
                                    Quitar
                                  </button>
                                </div>
                              ))}
                          </div>
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
                        disabled={guardandoSolicitud || yaExisteSolicitudHoy}
                        className="button green"
                        style={{ width: "100%", marginTop: 14 }}
                      >
                        {guardandoSolicitud ? "Guardando solicitud..." : yaExisteSolicitudHoy ? "Solicitud del día ya realizada" : "Guardar solicitud y enviar por WhatsApp"}
                      </button>

                      <div className="box soft" style={{ marginTop: 18 }}>
                        <strong>Agregar producto a la lista</strong>
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
                        <strong>Eliminar producto de la lista</strong>
                        <p className="muted small" style={{ marginBottom: 8 }}>
                          Esta opción es solo para administrar el listado principal.
                        </p>
                        <div className="producto-delete-row">
                          <select
                            value={productoSolicitudEliminarId}
                            onChange={(e) => setProductoSolicitudEliminarId(e.target.value)}
                          >
                            <option value="">Selecciona un producto</option>
                            {productosSolicitud.map((producto) => (
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
              <h2>🛒 Productos pendientes</h2>
              <p className="muted small">
                Aquí solo verás los productos solicitados. La cantidad a comprar la defines tú.
              </p>
            </div>

            <div className="actions-inline">
              <button type="button" onClick={() => cargarSolicitudesPendientesCompra(fechaConsultaSolicitudes)} className="button light" disabled={cargandoPendientes}>
                {cargandoPendientes ? "Cargando..." : "Actualizar"}
              </button>
              <button type="button" onClick={limpiarCompradosPendientes} className="button light">
                Reiniciar marcas
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
            <strong>{productosParaEnviarProveedor.length} productos pendientes por comprar del día {fechaConsultaSolicitudes}</strong>
            <p className="muted small" style={{ marginTop: 6 }}>
              Los productos marcados como comprados quedan tachados y no se envían al proveedor.
            </p>
          </div>

          {productosPendientesCompra.length === 0 ? (
            <div className="box soft">
              {cargandoPendientes ? "Cargando solicitudes..." : "No hay productos pendientes por ahora."}
            </div>
          ) : (
            <div className="productos-seleccionados-lista">
              {productosPendientesCompra.map((producto) => (
                <div key={producto.id} className="producto-seleccionado-row">
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={producto.comprado}
                      onChange={(e) => actualizarPendienteCompra(producto.id, { comprado: e.target.checked })}
                    />
                    <strong style={{ textDecoration: producto.comprado ? "line-through" : "none", opacity: producto.comprado ? 0.55 : 1 }}>
                      {producto.nombre}
                    </strong>
                  </label>

                  <input
                    type="text"
                    value={producto.cantidadComprar}
                    onChange={(e) => actualizarPendienteCompra(producto.id, { cantidadComprar: e.target.value })}
                    placeholder="Cantidad a comprar"
                    disabled={producto.comprado}
                  />

                  <span className="muted small">
                    Solicitado {producto.vecesSolicitado} vez{producto.vecesSolicitado === 1 ? "" : "es"}
                  </span>
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
            Enviar listado a proveedores por WhatsApp
          </button>
        </div>
      )}
    </section>
  );
}
