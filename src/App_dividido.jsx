import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import SolicitudProductos from "./components/SolicitudProductos";
import GeneradorMenu from "./components/GeneradorMenu";

const VALOR_PARA_LLEVAR = 1500;
const MAX_ACOMPANANTES_CLIENTE = 3;
const INCLUIDOS_FIJOS = "Sopa + bebida incluida";
const WHATSAPP_RAFIKI = import.meta.env.VITE_WHATSAPP_RAFIKI || "573022915098";
const CLAVE_ADMIN = "rafiki1234";
const CLAVE_RAFA = "rafa1234*";

const estadosPedido = ["Pendiente", "Finalizado"];

const menuFallback = {
  id: null,
  fecha: new Date().toISOString().slice(0, 10),
  titulo: "Almuerzo ejecutivo Rafiki",
  descripcion: "Escoge tu plato del d铆a y m谩ximo 3 acompa帽antes. Incluye sopa y bebida.",
  precio: 0,
  proteinas: [],
  proteinas_detalle: [],
  platos_detalle: [],
  acompanantes: [],
  activo: true
};

function dinero(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
}

function formatoNumeroPedido(numero) {
  const valor = Number(numero) || 0;

  if (!valor) return "----";
  if (valor >= 10000) return "10000";

  return String(valor).padStart(4, "0");
}

function obtenerCodigoPedido(pedido) {
  const numeroBase = pedido?.numero_pedido;
  const numero = formatoNumeroPedido(numeroBase);

  if (numero === "----") return "Sin N掳";

  const ciclo = Number(pedido?.ciclo_pedido) || 1;

  return ciclo > 1 ? `C${ciclo}-${numero}` : numero;
}

function fechaISOColombia(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(fecha);
}

function formatearFechaHora(fecha) {
  if (!fecha) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(fecha));
}

function obtenerRangoPedidos(filtro = "hoy", fechaManual = fechaISOColombia()) {
  let baseTexto;

  if (filtro === "dia") {
    baseTexto = fechaManual || fechaISOColombia();
  } else {
    // Cualquier filtro distinto a "dia" se interpreta expl铆citamente como "hoy".
    baseTexto = fechaISOColombia();
  }

  const base = new Date(`${baseTexto}T00:00:00-05:00`);

  const inicio = new Date(base);
  const fin = new Date(base);
  fin.setDate(fin.getDate() + 1);

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString()
  };
}

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function esCategoriaSopa(categoria) {
  return normalizarTexto(categoria).includes("sopa");
}

function esSopaParaLlevarGratis(item) {
  const nombre = normalizarTexto(item?.plato || item?.proteina || item?.nombre);
  const categoria = normalizarTexto(item?.categoria);

  if (!categoria.includes("sopa")) return false;

  const nombresGratis = [
    "sopas medianas sin arroz",
    "sopas medianas con arroz",
    "sancocho de pollo con arroz"
  ];

  return nombresGratis.includes(nombre);
}

function valorParaLlevarItem(item) {
  if (!item?.paraLlevar) return 0;
  if (esSopaParaLlevarGratis(item)) return 0;
  return VALOR_PARA_LLEVAR;
}

function textoParaLlevarItem(item) {
  if (!item?.paraLlevar) return "Sin empaque para llevar";

  const valor = valorParaLlevarItem(item);

  if (valor === 0) return "Para llevar sin costo adicional";

  return `Para llevar +${dinero(valor)}`;
}

function listaPorLineas(texto) {
  return String(texto || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function limpiarAcompanantesMenu(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => item.toLowerCase() !== "sopa");
}

function limpiarAcompanantesCliente(lista) {
  return limpiarAcompanantesMenu(lista).slice(0, MAX_ACOMPANANTES_CLIENTE);
}

function textoAPlatosDetalle(texto, { estricto = false } = {}) {
  const lineas = String(texto || "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean);

  const platos = [];
  const errores = [];

  lineas.forEach((linea, index) => {
    const numeroLinea = index + 1;

    if (!linea.includes("|")) {
      if (estricto) {
        errores.push(`L铆nea ${numeroLinea}: falta el formato "Categor铆a | Plato:Precio".`);
      }
      return;
    }

    const partesCategoria = linea.split("|");
    const categoria = String(partesCategoria[0] || "Platos").trim() || "Platos";
    const resto = partesCategoria.slice(1).join("|").trim();

    if (!resto) {
      if (estricto) {
        errores.push(`L铆nea ${numeroLinea}: falta el nombre del plato y el precio.`);
      }
      return;
    }

    const indicePrecio = resto.lastIndexOf(":");

    if (indicePrecio === -1) {
      if (estricto) {
        errores.push(`L铆nea ${numeroLinea}: falta el precio despu茅s de ":".`);
      }
      return;
    }

    const nombre = resto.slice(0, indicePrecio).trim();
    const precioTextoOriginal = resto.slice(indicePrecio + 1).trim();
    const precioTexto = precioTextoOriginal.replace(/[^\d]/g, "");
    const precio = Number(precioTexto);

    if (!nombre) {
      if (estricto) {
        errores.push(`L铆nea ${numeroLinea}: el nombre del plato est谩 vac铆o.`);
      }
      return;
    }

    if (!precio || precio <= 0) {
      if (estricto) {
        errores.push(
          `L铆nea ${numeroLinea}: precio inv谩lido "${precioTextoOriginal || "vac铆o"}". Usa solo n煤meros, ejemplo 18000.`
        );
      }
      return;
    }

    platos.push({ categoria, nombre, precio });
  });

  return { platos, errores };
}

function platosATexto(platosDetalle) {
  return (platosDetalle || [])
    .map((item) => `${item.categoria || "Platos"} | ${item.nombre}:${Number(item.precio) || 0}`)
    .join("\n");
}

function acompanantesATexto(acompanantes) {
  return (acompanantes || []).join("\n");
}

function normalizarPlatos(menu) {
  if (Array.isArray(menu?.platos_detalle) && menu.platos_detalle.length > 0) {
    return menu.platos_detalle
      .map((item) => ({
        categoria: String(item.categoria || "Platos").trim() || "Platos",
        nombre: String(item.nombre || "").trim(),
        precio: Number(item.precio) || 0
      }))
      .filter((item) => item.nombre);
  }

  if (Array.isArray(menu?.proteinas_detalle) && menu.proteinas_detalle.length > 0) {
    return menu.proteinas_detalle
      .map((item) => ({
        categoria: "Platos",
        nombre: String(item.nombre || "").trim(),
        precio: Number(item.precio) || 0
      }))
      .filter((item) => item.nombre);
  }

  if (Array.isArray(menu?.proteinas) && menu.proteinas.length > 0) {
    return menu.proteinas
      .map((nombre) => ({
        categoria: "Platos",
        nombre: String(nombre || "").trim(),
        precio: Number(menu?.precio) || 0
      }))
      .filter((item) => item.nombre);
  }

  return [];
}

function normalizarMenu(menu) {
  const platosDetalle = normalizarPlatos(menu);
  const acompanantes = limpiarAcompanantesMenu(menu?.acompanantes || []);

  return {
    ...menuFallback,
    ...menu,
    platos_detalle: platosDetalle,
    proteinas_detalle: platosDetalle.map((item) => ({
      nombre: item.nombre,
      precio: item.precio
    })),
    proteinas: platosDetalle.map((item) => item.nombre),
    acompanantes
  };
}

function agruparPlatosPorCategoria(platos) {
  return (platos || []).reduce((grupos, plato) => {
    const categoria = plato.categoria || "Platos";

    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }

    grupos[categoria].push(plato);
    return grupos;
  }, {});
}

function obtenerEstadoPedido(pedido) {
  if (pedido.estado === "Finalizado" || pedido.estado === "Entregado") {
    return "Finalizado";
  }

  return "Pendiente";
}

function limpiarTelefonoWhatsApp(telefono) {
  const digitos = String(telefono || "").replace(/\D/g, "");

  if (!digitos) return "";
  if (digitos.startsWith("57")) return digitos;
  if (digitos.length === 10) return `57${digitos}`;

  return digitos;
}

function crearMensajePedidoListo(pedido) {
  const cliente = obtenerCliente(pedido);

  return [
    `Hola ${cliente}, su pedido est谩 listo.`,
    "",
    "Gracias por comprar en Rafiki 馃嵔锔�"
  ].join("\n");
}

function crearItemNuevo() {
  return {
    id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    cantidad: 1,
    categoria: "",
    plato: "",
    proteina: "",
    precioPlato: 0,
    precioProteina: 0,
    acompanantes: [],
    observacionAcompanantes: "",
    paraLlevar: true
  };
}

function calcularTotalItem(item) {
  const cantidad = Number(item.cantidad) || 0;
  const precio = Number(item.precioPlato || item.precioProteina || item.precio || 0);
  const adicional = valorParaLlevarItem(item);

  return cantidad * (precio + adicional);
}

function calcularTotalItems(items) {
  return items.reduce((suma, item) => suma + calcularTotalItem(item), 0);
}

function crearTextoItem(item) {
  const nombrePlato = item.plato || item.proteina || "Plato";
  const precio = Number(item.precioPlato || item.precioProteina || 0);
  const partes = [`${item.cantidad} ${nombrePlato} (${dinero(precio)})`];
  const esSopa = esCategoriaSopa(item.categoria);
  const acompanantes = esSopa ? [] : limpiarAcompanantesCliente(item.acompanantes || []);

  if (acompanantes.length > 0) {
    partes.push(acompanantes.join(", "));
  }

  if (!esSopa && item.observacionAcompanantes?.trim()) {
    partes.push(`Obs. acompa帽antes: ${item.observacionAcompanantes.trim()}`);
  }

  if (!esSopa) {
    partes.push(INCLUIDOS_FIJOS);
  }

  if (item.paraLlevar) {
    const valor = valorParaLlevarItem(item);
    partes.push(valor === 0 ? "Para llevar sin costo adicional" : `Para llevar +${dinero(valor)}`);
  }

  return partes.join(" + ");
}

function crearTextoPedido(items, observaciones) {
  let texto = items.map(crearTextoItem).join("\n");

  if (observaciones) {
    texto += `\nObservaciones: ${observaciones}`;
  }

  return texto;
}

function crearMensajeWhatsAppPedido(pedido) {
  return [
    "Hola Rafiki, quiero confirmar este pedido:",
    "",
    `Pedido N掳: ${obtenerCodigoPedido(pedido)}`,
    `Cliente: ${pedido.cliente || pedido.cliente_nombre || "Cliente"}`,
    `Tel茅fono: ${pedido.telefono || "Sin tel茅fono"}`,
    `Ubicaci贸n: ${pedido.ubicacion || "Sin ubicaci贸n"}`,
    `Tipo de pago: ${pedido.tipo_pago || "No especificado"}`,
    "",
    "Pedido:",
    pedido.pedido_texto || "",
    "",
    `Total: ${dinero(pedido.total)}`
  ].join("\n");
}

function esDispositivoMovil() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

function crearLinkWhatsApp(numero, mensaje, { abrirApp = false } = {}) {
  const telefono = limpiarTelefonoWhatsApp(numero);
  const texto = encodeURIComponent(mensaje || "");

  if (abrirApp && !esDispositivoMovil()) {
    return `https://web.whatsapp.com/send?phone=${telefono}&text=${texto}`;
  }

  return `https://api.whatsapp.com/send?phone=${telefono}&text=${texto}`;
}

function obtenerCliente(pedido) {
  return pedido.cliente || pedido.cliente_nombre || "Cliente";
}

function obtenerItemsPedido(pedido) {
  return Array.isArray(pedido.items) ? pedido.items : [];
}

function consolidarPedidos(pedidos) {
  const resumen = {};

  pedidos.forEach((pedido) => {
    obtenerItemsPedido(pedido).forEach((item) => {
      const nombre = item.plato || item.proteina;

      if (nombre) {
        resumen[nombre] = (resumen[nombre] || 0) + (Number(item.cantidad) || 0);
      }
    });
  });

  return resumen;
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

function EstadoBadge({ estado }) {
  const estadoNormalizado = obtenerEstadoPedido({ estado });
  const clase = `badge badge-${estadoNormalizado.toLowerCase()}`;

  return <span className={clase}>{estadoNormalizado}</span>;
}

function SelectorCantidad({ cantidad, onChange }) {
  return (
    <div className="quantity">
      <button type="button" onClick={() => onChange(Math.max(1, cantidad - 1))}>
        鈭�
      </button>
      <strong>{cantidad}</strong>
      <button type="button" onClick={() => onChange(cantidad + 1)}>
        +
      </button>
    </div>
  );
}

function PedidoCocina({ pedido, onCambiarEstado, guardandoEstado = false }) {
  const items = obtenerItemsPedido(pedido);
  const estadoNormalizado = obtenerEstadoPedido(pedido);
  const telefonoCliente = limpiarTelefonoWhatsApp(pedido.telefono);
  const mensajeCliente = crearMensajePedidoListo(pedido);
  const linkCliente = telefonoCliente ? crearLinkWhatsApp(telefonoCliente, mensajeCliente) : "#";

  return (
    <article className={`pedido-cocina ${estadoNormalizado === "Finalizado" ? "pedido-finalizado" : ""}`}>
      <div className={`pedido-header ${estadoNormalizado === "Finalizado" ? "pedido-header-finalizado" : "pedido-header-pending"}`}>
        <div className="pedido-header-title">
          Pedido #{obtenerCodigoPedido(pedido)}
        </div>
        <div className="pedido-header-right">
          <EstadoBadge estado={pedido.estado} />
          <strong style={{ color: "white", fontSize: 20, fontFamily: "'Fraunces', serif" }}>{dinero(pedido.total)}</strong>
        </div>
      </div>

      <div className="pedido-body">
        <div className="pedido-top">
          <div>
            <p className="pedido-cliente-nombre">{obtenerCliente(pedido)}</p>
            <div className="pedido-meta">
              <span>馃Ь Pedido N掳 {obtenerCodigoPedido(pedido)}</span>
              <span>馃晵 {formatearFechaHora(pedido.created_at)}</span>
              <span>馃搷 {pedido.ubicacion || "Sin ubicaci贸n"}</span>
              <span>馃摓 {pedido.telefono || "Sin tel茅fono"}</span>
              <span>馃挸 {pedido.tipo_pago || "Pago no especificado"}</span>
            </div>
          </div>
        </div>

      <div className="items-cocina">
        {items.length === 0 ? (
          <div className="pedido-text">{pedido.pedido_texto}</div>
        ) : (
          items.map((item, index) => {
            const nombre = item.plato || item.proteina || "Plato";
            const precio = item.precioPlato || item.precioProteina || 0;
            const esSopa = esCategoriaSopa(item.categoria);

            return (
              <div key={item.id || index} className="item-cocina">
                <div className="item-numero">#{index + 1}</div>

                <div className="item-detalle">
                  <h4>
                    {item.cantidad} x {nombre}
                  </h4>

                  {item.categoria && (
                    <p>
                      <strong>Categor铆a:</strong> {item.categoria}
                    </p>
                  )}

                  <p>
                    <strong>Precio:</strong> {dinero(precio)}
                  </p>

                  {!esSopa && (
                    <p>
                      <strong>Acompa帽antes:</strong>{" "}
                      {Array.isArray(item.acompanantes) && item.acompanantes.length > 0
                        ? item.acompanantes.join(", ")
                        : "Sin acompa帽antes"}
                    </p>
                  )}

                  {!esSopa && item.observacionAcompanantes?.trim() && (
                    <p className="obs-acompanantes-admin">
                      <strong>Obs. acompa帽antes:</strong> {item.observacionAcompanantes.trim()}
                    </p>
                  )}

                  {esSopa && (
                    <p>
                      <strong>Acompa帽antes:</strong> No aplica para sopas
                    </p>
                  )}

                  {!esSopa && (
                    <p>
                      <strong>Incluye:</strong> Sopa + bebida
                    </p>
                  )}

                  <p>
                    <strong>Empaque:</strong> {textoParaLlevarItem(item)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pedido.observaciones && (
        <div className="nota-cocina">
          <strong>Observaciones:</strong> {pedido.observaciones}
        </div>
      )}

      <div className="pedido-actions">
        <select
          value={estadoNormalizado}
          onChange={(e) => onCambiarEstado(pedido.id, e.target.value)}
          disabled={guardandoEstado}
        >
          {estadosPedido.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>

        {telefonoCliente ? (
          <a
            href={linkCliente}
            target="_blank"
            rel="noreferrer"
            className="button green link-button"
          >
            Avisar pedido listo
          </a>
        ) : (
          <button type="button" className="button light" disabled>
            Sin tel茅fono
          </button>
        )}
      </div>
      </div>
    </article>
  );
}


function PanelRafaPrivado() {
  const hoy = fechaISOColombia();
  const [modoFecha, setModoFecha] = useState("dia");
  const [fechaRafa, setFechaRafa] = useState(hoy);
  const [fechaInicioRafa, setFechaInicioRafa] = useState(hoy);
  const [fechaFinRafa, setFechaFinRafa] = useState(hoy);
  const [pedidosRafa, setPedidosRafa] = useState([]);
  const [cargandoRafa, setCargandoRafa] = useState(false);
  const [errorRafa, setErrorRafa] = useState("");

  const rangoRafa = useMemo(() => {
    const inicioTexto = modoFecha === "rango" ? (fechaInicioRafa || hoy) : (fechaRafa || hoy);
    const finTexto = modoFecha === "rango" ? (fechaFinRafa || inicioTexto) : inicioTexto;

    const inicio = new Date(`${inicioTexto}T00:00:00-05:00`);
    const fin = new Date(`${finTexto}T00:00:00-05:00`);
    fin.setDate(fin.getDate() + 1);

    return {
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      inicioTexto,
      finTexto
    };
  }, [modoFecha, fechaRafa, fechaInicioRafa, fechaFinRafa, hoy]);

  useEffect(() => {
    let cancelado = false;

    async function cargarPedidosRafa() {
      setCargandoRafa(true);
      setErrorRafa("");

      try {
        const { data, error } = await supabase
          .from("pedidos")
          .select("*")
          .gte("created_at", rangoRafa.inicio)
          .lt("created_at", rangoRafa.fin)
          .order("created_at", { ascending: true });

        if (cancelado) return;

        if (error) {
          setErrorRafa(`Error cargando informe: ${error.message}`);
          setPedidosRafa([]);
          return;
        }

        setPedidosRafa(data || []);
      } catch (error) {
        if (!cancelado) {
          setErrorRafa(`No se pudo cargar el informe. ${error.message || ""}`.trim());
          setPedidosRafa([]);
        }
      } finally {
        if (!cancelado) setCargandoRafa(false);
      }
    }

    cargarPedidosRafa();

    return () => {
      cancelado = true;
    };
  }, [rangoRafa]);

  const pedidosValidos = pedidosRafa.filter((pedido) => obtenerEstadoPedido(pedido) !== "Cancelado");
  const totalVentas = pedidosValidos.reduce((suma, pedido) => suma + (Number(pedido.total) || 0), 0);
  const totalPedidos = pedidosValidos.length;
  const pendientes = pedidosValidos.filter((pedido) => obtenerEstadoPedido(pedido) === "Pendiente").length;
  const finalizados = pedidosValidos.filter((pedido) => obtenerEstadoPedido(pedido) === "Finalizado").length;
  const resumenProductos = consolidarPedidos(pedidosValidos);
  const productosOrdenados = Object.entries(resumenProductos).sort((a, b) => b[1] - a[1]);
  const promedioPedido = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
  const tituloPeriodo = modoFecha === "rango"
    ? `${rangoRafa.inicioTexto} al ${rangoRafa.finTexto}`
    : rangoRafa.inicioTexto;

  return (
    <section className="card card-pad">
      <div className="admin-top-row">
        <div>
          <h2>馃敀 Panel Rafa</h2>
          <p className="muted">Espacio privado para revisar informaci贸n gerencial del restaurante.</p>
        </div>
      </div>

      <div className="soft-box" style={{ marginBottom: 16 }}>
        <h3>Seleccionar periodo</h3>
        <div className="filtros-historial" style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setModoFecha("dia")}
            className={modoFecha === "dia" ? "active" : ""}
          >
            Un d铆a
          </button>
          <button
            type="button"
            onClick={() => setModoFecha("rango")}
            className={modoFecha === "rango" ? "active" : ""}
          >
            Varios d铆as
          </button>

          {modoFecha === "dia" ? (
            <label className="calendario-filtro">
              <span>Fecha</span>
              <input
                type="date"
                value={fechaRafa}
                onChange={(e) => setFechaRafa(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label className="calendario-filtro">
                <span>Desde</span>
                <input
                  type="date"
                  value={fechaInicioRafa}
                  onChange={(e) => setFechaInicioRafa(e.target.value)}
                />
              </label>
              <label className="calendario-filtro">
                <span>Hasta</span>
                <input
                  type="date"
                  value={fechaFinRafa}
                  onChange={(e) => setFechaFinRafa(e.target.value)}
                />
              </label>
            </>
          )}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Informe seleccionado: <strong>{tituloPeriodo}</strong>
        </p>
      </div>

      {errorRafa && <div className="alert alert-error">{errorRafa}</div>}
      {cargandoRafa && <div className="alert alert-info">Cargando informe...</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <span>Ventas</span>
          <strong>{dinero(totalVentas)}</strong>
        </div>
        <div className="stat-card">
          <span>Pedidos</span>
          <strong>{totalPedidos}</strong>
        </div>
        <div className="stat-card">
          <span>Promedio</span>
          <strong>{dinero(promedioPedido)}</strong>
        </div>
        <div className="stat-card">
          <span>Pendientes</span>
          <strong>{pendientes}</strong>
        </div>
      </div>

      <div className="grid-2">
        <div className="soft-box">
          <h3>Resumen del periodo</h3>
          <p><strong>Finalizados:</strong> {finalizados}</p>
          <p><strong>Pendientes:</strong> {pendientes}</p>
          <p><strong>Total pedidos:</strong> {totalPedidos}</p>
          <p><strong>Total vendido:</strong> {dinero(totalVentas)}</p>
        </div>

        <div className="soft-box">
          <h3>Productos m谩s pedidos</h3>
          {productosOrdenados.length === 0 ? (
            <p className="muted">Todav铆a no hay productos para resumir en este periodo.</p>
          ) : (
            <ul className="simple-list">
              {productosOrdenados.slice(0, 12).map(([producto, cantidad]) => (
                <li key={producto}>
                  <span>{producto}</span>
                  <strong>{cantidad}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function obtenerVistaInicial() {
  const ruta = window.location.pathname.replace(/\/$/, "") || "/";
  const adminActivo = localStorage.getItem("rafikiAdminActivo") === "true";

  if (ruta === "/admin") {
    return adminActivo ? "admin" : "adminLogin";
  }

  if (ruta === "/pedido" || ruta === "/cliente") {
    return "cliente";
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
  const [adminAutenticado, setAdminAutenticado] = useState(() => localStorage.getItem("rafikiAdminActivo") === "true");
  const [claveAdmin, setClaveAdmin] = useState("");
  const [errorClaveAdmin, setErrorClaveAdmin] = useState("");
  const [rafaAutenticado, setRafaAutenticado] = useState(() => localStorage.getItem("rafikiRafaActivo") === "true");
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
  const [platosTexto, setPlatosTexto] = useState("");
  const [acompanantesTexto, setAcompanantesTexto] = useState("");
  const mensajeTimer = useRef(null);
  const mensajeMenuTimer = useRef(null);
  const menuHashRef = useRef("");

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
    return () => {
      if (mensajeTimer.current) {
        clearTimeout(mensajeTimer.current);
      }

      if (mensajeMenuTimer.current) {
        clearTimeout(mensajeMenuTimer.current);
      }
    };
  }, []);

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
          mostrarMensaje(`Error cargando men煤: ${menuError.message}`, "error");
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
            `No se pudo cargar el men煤. Revisa la conexi贸n e intenta recargar la p谩gina. ${error.message || ""}`.trim(),
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
            `No se pudieron cargar los pedidos. Revisa la conexi贸n y usa el bot贸n Actualizar pedidos. ${error.message || ""}`.trim(),
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
            `Solo puedes escoger ${MAX_ACOMPANANTES_CLIENTE} acompa帽antes por producto. La sopa y la bebida ya est谩n incluidas.`,
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
    if (!telefono.trim()) camposFaltantes.push("tel茅fono");
    if (!ubicacion.trim()) camposFaltantes.push("ubicaci贸n");

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

    const clienteNombre = cliente.trim();
    const pedidoTexto = crearTextoPedido(itemsValidos, observaciones.trim());
    const total = calcularTotalItems(itemsValidos);

    const nuevoPedido = {
      cliente: clienteNombre,
      cliente_nombre: clienteNombre,
      telefono: telefono.trim(),
      ubicacion: ubicacion.trim() || "Ubicaci贸n pendiente",
      tipo_pago: tipoPago,
      observaciones: observaciones.trim(),
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
      mostrarMensaje("Pedido guardado. Ahora puedes enviar el consolidado por WhatsApp.", "success");
      setVista("confirmacion");
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
        `No se puede guardar el men煤. Corrige:\n${resultadoPlatos.errores.slice(0, 5).join("\n")}`,
        "error"
      );
      return;
    }

    if (resultadoPlatos.platos.length === 0) {
      mostrarMensajeMenu(
        "Debes agregar al menos un plato del d铆a con el formato Categor铆a | Plato:Precio.",
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
          mostrarMensajeMenu(`Error guardando men煤: ${respuesta.error.message}`, "error");
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
          mostrarMensajeMenu(`Error creando men煤: ${respuesta.error.message}`, "error");
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
        mostrarMensajeMenu(`El men煤 se guard贸, pero no se pudieron desactivar men煤s anteriores: ${errorDesactivar.message}`, "warning");
      }

      const nuevoMenu = normalizarMenu(data);
      setMenu(nuevoMenu);
      setItemsPedido([crearItemNuevo()]);
      setPlatosTexto(platosATexto(nuevoMenu.platos_detalle));
      setAcompanantesTexto(acompanantesATexto(nuevoMenu.acompanantes));
      mostrarMensajeMenu(menu.id ? "Men煤 actualizado correctamente." : "Men煤 creado correctamente.", "success");
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
        `驴Marcar el pedido #${codigoPedido} como finalizado?`
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

    if (claveAdmin.trim() === CLAVE_ADMIN) {
      localStorage.setItem("rafikiAdminActivo", "true");
      setAdminAutenticado(true);
      setClaveAdmin("");
      setErrorClaveAdmin("");
      navegar("/admin", "admin");
      return;
    }

    setErrorClaveAdmin("Clave incorrecta. Int茅ntalo nuevamente.");
  }

  function validarClaveRafa(e) {
    e.preventDefault();

    if (claveRafa.trim() === CLAVE_RAFA) {
      localStorage.setItem("rafikiRafaActivo", "true");
      setRafaAutenticado(true);
      setClaveRafa("");
      setErrorClaveRafa("");
      return;
    }

    setErrorClaveRafa("Clave incorrecta. Int茅ntalo nuevamente.");
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
        .selected-dish::before { content: '鉁�'; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #22c55e; color: white; border-radius: 50%; font-size: 13px; flex-shrink: 0; }
        .category-block { margin-bottom: 20px; border: 1px solid #fed7aa; border-radius: 24px; padding: 16px; background: #fffaf0; }
        .category-title { font-size: 20px; margin-bottom: 12px; color: #c2410c; font-weight: 900; display: flex; align-items: center; gap: 8px; }
        .option-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .option { text-align: left; border: 1.5px solid #e7e5e4; background: #fff; border-radius: 18px; padding: 14px; font-weight: 900; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
        .option:hover { border-color: #fdba74; background: #fff7ed; }
        .option small { display: block; margin-top: 6px; color: #ea580c; font-size: 16px; font-weight: 900; }
        .option.selected { border-color: #f97316; color: #c2410c; background: #fff7ed; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
        .option.selected::after { content: '鉁�'; float: right; color: #f97316; font-size: 18px; }
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
        .summary-card span { color: #78716c; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
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
        .pedido-cocina { border: 1px solid #fed7aa; background: #fff; border-radius: 26px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); overflow: hidden; animation: fadeInUp 0.25s ease; }
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
        .pedido-total span { display: block; color: #78716c; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
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
        .progress-label { font-size: 11px; font-weight: 900; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.5px; }
        .progress-label.done { color: #f97316; }
        .sticky-total { position: sticky; bottom: 0; background: #1c1917; border-radius: 20px 20px 0 0; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin: 20px -24px -24px; box-shadow: 0 -8px 24px rgba(0,0,0,0.15); }
        .sticky-total-label { font-size: 12px; color: #a8a29e; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .sticky-total-amount { font-size: 24px; font-weight: 900; color: #fb923c; font-family: 'Fraunces', serif; }
        .finalizar-area { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; max-width: 230px; }
        .finalizar-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; border-radius: 12px; padding: 8px 10px; font-size: 12px; font-weight: 900; text-align: right; line-height: 1.2; box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .confirmacion-check { width: 72px; height: 72px; background: linear-gradient(135deg, #16a34a, #22c55e); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; margin: 0 auto 16px; box-shadow: 0 12px 28px rgba(34,197,94,0.35); animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        pre { white-space: pre-wrap; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 18px; padding: 16px; overflow: auto; font-size: 14px; }
        @media (max-width: 900px) {
          .topbar, .layout, .grid-2, .pedido-top, .pedido-actions, .bottom-summary, .admin-top-row, .admin-stats { grid-template-columns: 1fr; display: grid; }
          .topbar { display: block; }
          .nav { margin-top: 16px; }
          .option-grid, .productos-grid, .producto-controls, .producto-add-row, .producto-delete-row, .producto-seleccionado-row { grid-template-columns: 1fr; }
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
                <div className="brand">馃嵔锔� Rafiki Pedidos</div>
                <h1>Men煤 diario y pedidos por WhatsApp</h1>
                <p className="muted">App real conectada a Supabase.</p>
              </div>

              {(vista === "cliente" || vista === "confirmacion") && (
                <div className="nav">
                  <button
                    type="button"
                    onClick={() => navegar("/", "cliente")}
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
                <p>Escoge tu almuerzo del d铆a, selecciona tus acompa帽antes y env铆anos tu pedido por WhatsApp.</p>

                <button type="button" onClick={() => navegar("/", "cliente")} className="welcome-button">
                  馃泹锔� Haz tu pedido aqu铆
                </button>
              </section>
            </main>
          )}

          {!cargando && vista === "adminLogin" && (
            <main style={{ maxWidth: 520, margin: "0 auto" }}>
              <section className="card card-pad">
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div className="brand">馃攼 Panel Rafiki</div>
                  <h2>Acceso administrativo</h2>
                  <p className="muted">Ingresa la clave para ver pedidos y editar el men煤 diario.</p>
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
                      Todav铆a no hay platos configurados para el men煤 de hoy. Entra al panel administrativo y agrega los platos del d铆a.
                    </div>
                  ) : (
                  <>
                      <div style={{ marginBottom: 18 }}>
                        <h3>馃泹锔� Arma tu pedido paso a paso</h3>
                        <p className="muted">Primero selecciona tu prote铆na. Luego aparecer谩n los siguientes pasos.</p>
                      </div>

                      {itemsPedido.map((item, index) => {
                        const itemEsSopa = esCategoriaSopa(item.categoria);
                        const acompanantesItem = Array.isArray(item.acompanantes) ? item.acompanantes : [];
                        const tienePlato = Boolean(item.plato || item.proteina);
                        const tieneAcompanantes = itemEsSopa || acompanantesItem.length > 0;

                        const pasos = itemEsSopa
                          ? ["Prote铆na", "Datos"]
                          : ["Prote铆na", "Acomp.", "Datos"];
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
                                <h4>Primero selecciona tu prote铆na</h4>
                                <p className="muted" style={{ marginBottom: 0 }}>
                                  Toca una opci贸n para continuar.
                                </p>
                              </div>
                            </div>

                            {tienePlato && (
                              <div className="selected-dish">
                                Seleccionado: {item.plato || item.proteina} 鈥攞" "}
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
                                    <h4>Escoge tus acompa帽antes</h4>
                                    <p className="muted" style={{ marginBottom: 0 }}>
                                      Selecciona hasta {MAX_ACOMPANANTES_CLIENTE} opciones para completar tu almuerzo.
                                    </p>
                                  </div>
                                </div>

                                <div className="chips">
                                  {menu.acompanantes.length === 0 ? (
                                    <span className="muted">No hay acompa帽antes configurados.</span>
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
                                          {seleccionado ? "鉁� " : "+ "}
                                          {acompanante}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="box compact-info" style={{ marginTop: 12 }}>
                                  <strong>馃ィ Sopa y bebida incluida</strong>
                                </div>
                              </div>
                            )}

                            {tienePlato && itemEsSopa && (
                              <div className="box soft fade-step" style={{ marginTop: 18 }}>
                                <strong>馃ィ Producto de sopas</strong>
                                <p className="muted" style={{ marginBottom: 0 }}>
                                  Este producto no incluye acompa帽antes, sopa adicional ni bebida.
                                </p>
                              </div>
                            )}

                            {tienePlato && (
                              <div id={`paso-cantidad-${item.id}`} className="fade-step pedido-paso-compacto" style={{ marginTop: 12 }}>
                                <div className="box compact-box quantity-box">
                                  <strong>Cantidad de {item.plato || item.proteina || "prote铆na escogida"}</strong>
                                  <SelectorCantidad
                                    cantidad={item.cantidad}
                                    onChange={(cantidad) => actualizarItem(item.id, { cantidad })}
                                  />
                                </div>

                                {!itemEsSopa && (
                                  <CampoTexto
                                    etiqueta="Observaci贸n sobre tus acompa帽antes"
                                    value={item.observacionAcompanantes || ""}
                                    onChange={(valor) => actualizarItem(item.id, { observacionAcompanantes: valor })}
                                    placeholder="Ejemplo: sin ensalada, m谩s arroz..."
                                    multiline
                                    rows={2}
                                  />
                                )}

                                <label className="box row compact-box takeout-box">
                                  <div>
                                    <strong>馃ァ Para llevar</strong>
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
                    <strong>馃憟 Empieza seleccionando una prote铆na</strong>
                    <p className="muted" style={{ marginBottom: 0 }}>
                      Cuando selecciones un producto, aqu铆 aparecer谩 el resumen y los datos de entrega.
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

                              {item.categoria && <p>Categor铆a: {item.categoria}</p>}

                              {!itemEsSopa && <p>{acompanantesItem.join(", ") || "Sin acompa帽antes"}</p>}
                              {!itemEsSopa && item.observacionAcompanantes?.trim() && (
                                <p>Obs. acompa帽antes: {item.observacionAcompanantes.trim()}</p>
                              )}
                              {itemEsSopa && <p>Acompa帽antes: No aplica</p>}

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
                          As铆 sabremos a d贸nde llevar tu pedido.
                        </p>
                      </div>
                    </div>

                    <CampoTexto
                      etiqueta="馃懁 Nombre"
                      value={cliente}
                      onChange={(valor) => {
                        setCliente(valor);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: Laura P茅rez"
                    />

                    <CampoTexto
                      etiqueta="馃摓 Tel茅fono"
                      value={telefono}
                      onChange={(valor) => {
                        setTelefono(valor);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: 300 123 4567"
                    />

                    <CampoTexto
                      etiqueta="馃搷 Ubicaci贸n"
                      value={ubicacion}
                      onChange={(valor) => {
                        setUbicacion(valor);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: Edificio, oficina o barrio"
                    />

                    <label className="field">
                      <span>馃挸 Tipo de pago</span>
                      <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </label>

                    <CampoTexto
                      etiqueta="Observaciones generales"
                      value={observaciones}
                      onChange={setObservaciones}
                      placeholder="Ej: llevar a recepci贸n, sin cubiertos, pago en efectivo..."
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
                            disabled={guardandoPedido || menu.platos_detalle.length === 0}
                            className="button"
                            style={{ margin: 0, padding: "12px 20px", fontSize: 15 }}
                          >
                            {guardandoPedido ? "Guardando..." : "Finalizar 鈫�"}
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
            <main style={{ maxWidth: 760, margin: "0 auto" }}>
              <section className="card">
                <div className="hero green" style={{ textAlign: "center" }}>
                  <div className="confirmacion-check">鉁�</div>
                  <h2 style={{ fontFamily: "'Fraunces', serif" }}>隆Pedido confirmado!</h2>
                  <p>Revisa el consolidado y env铆alo a Rafiki por WhatsApp.</p>
                </div>

                <div className="card-pad">
                  <div className="box soft">
                    <h3>Consolidado del pedido</h3>
                    <p>
                      <strong>Pedido N掳:</strong> {obtenerCodigoPedido(pedidoFinalizado)}
                    </p>
                    <p>
                      <strong>Cliente:</strong> {obtenerCliente(pedidoFinalizado)}
                    </p>
                    <p>
                      <strong>Tel茅fono:</strong> {pedidoFinalizado.telefono || "Sin tel茅fono"}
                    </p>
                    <p>
                      <strong>Ubicaci贸n:</strong> {pedidoFinalizado.ubicacion}
                    </p>
                    <p>
                      <strong>Tipo de pago:</strong> {pedidoFinalizado.tipo_pago || "No especificado"}
                    </p>

                    <div className="pedido-text">{pedidoFinalizado.pedido_texto}</div>

                    <div className="total-row">
                      <span>Total</span>
                      <strong>{dinero(pedidoFinalizado.total)}</strong>
                    </div>
                  </div>

                  <pre>{mensajeWhatsAppFinal}</pre>

                  <a
                    href={linkWhatsAppFinal}
                    target="_blank"
                    rel="noreferrer"
                    className="button green link-button"
                  >
                    馃煝 Confirmar pedido por WhatsApp
                  </a>

                  <div className="grid-2" style={{ marginTop: 14 }}>
                    <button type="button" onClick={nuevoPedidoCliente} className="button light">
                      Hacer otro pedido
                    </button>

                    <button type="button" onClick={() => navegar("/", "inicio")} className="button light">
                      Volver al inicio
                    </button>
                  </div>
                </div>
              </section>
            </main>
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
                  Editar men煤 diario
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
                  Generador de men煤
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
                      <h2>馃搵 {tituloPedidos}</h2>
                      <p className="muted">Vista organizada para preparar pedidos y revisar historial.</p>
                    </div>

                    <button
                      type="button"
                      className="button light"
                      onClick={() => setRecargaPedidos((actual) => actual + 1)}
                    >
                      馃攧 Actualizar pedidos
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
                      <span>Buscar d铆a</span>
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
                        Limpiar b煤squeda
                      </button>
                    )}
                  </div>

                  <CampoTexto
                    etiqueta="Buscar pedido"
                    value={busqueda}
                    onChange={setBusqueda}
                    placeholder="Buscar por cliente, ubicaci贸n, pago o estado..."
                  />

                  <p className="muted small">
                    Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos cargados.
                  </p>

                  <div className="pedido-seccion">
                    <div className="section-heading">
                      <h3>馃煛 Pedidos pendientes</h3>
                      <span>{pedidosPendientes.length}</span>
                    </div>

                    {pedidosPendientes.length === 0 ? (
                      <div className="box soft">No hay pedidos pendientes.</div>
                    ) : (
                      pedidosPendientes.map((pedido, index) => (
                        <PedidoCocina
                          key={pedido.id}
                          pedido={pedido}
                          onCambiarEstado={cambiarEstadoPedido}
                          guardandoEstado={guardandoEstadoPedidoId === pedido.id}
                        />
                      ))
                    )}
                  </div>

                  <div className="pedido-seccion">
                    <div className="section-heading">
                      <h3>鉁� Finalizados</h3>
                      <span>{pedidosFinalizados.length}</span>
                    </div>

                    {pedidosFinalizados.length === 0 ? (
                      <div className="box soft">Todav铆a no hay pedidos finalizados.</div>
                    ) : (
                      pedidosFinalizados.map((pedido, index) => (
                        <PedidoCocina
                          key={pedido.id}
                          pedido={pedido}
                          onCambiarEstado={cambiarEstadoPedido}
                          guardandoEstado={guardandoEstadoPedidoId === pedido.id}
                        />
                      ))
                    )}
                  </div>

                  <div className="bottom-summary">
                    <div className="card card-pad">
                      <h3>Consolidado cocina</h3>
                      <p className="muted">Resumen total de platos del d铆a seleccionado.</p>

                      {Object.keys(consolidado).length === 0 ? (
                        <p className="muted">Todav铆a no hay productos para consolidar.</p>
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
                    <h2>馃敀 Rafa</h2>
                    <p className="muted">Esta secci贸n es privada. Ingresa la contrase帽a para continuar.</p>

                    {errorClaveRafa && (
                      <div className="alert alert-error">{errorClaveRafa}</div>
                    )}

                    <form onSubmit={validarClaveRafa}>
                      <label className="field">
                        <span>Contrase帽a</span>
                        <input
                          type="password"
                          value={claveRafa}
                          onChange={(e) => {
                            setClaveRafa(e.target.value);
                            setErrorClaveRafa("");
                          }}
                          placeholder="Contrase帽a de Rafa"
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
                  <h2>鉁忥笍 Editar men煤 diario</h2>
                  <p className="muted">
                    Aqu铆 modificas los platos, precios, categor铆as y acompa帽antes disponibles para los clientes.
                  </p>

                  <CampoTexto
                    etiqueta="Fecha"
                    value={menu.fecha || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, fecha: valor }))}
                  />

                  <CampoTexto
                    etiqueta="Nombre del men煤"
                    value={menu.titulo || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, titulo: valor }))}
                  />

                  <CampoTexto
                    etiqueta="Descripci贸n"
                    value={menu.descripcion || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, descripcion: valor }))}
                    multiline
                    rows={3}
                  />

                  <CampoTexto
                    etiqueta="Platos del d铆a"
                    value={platosTexto}
                    onChange={setPlatosTexto}
                    placeholder={
                      "Pechuga | Pechuga asada sin salsa:17500\nPechuga | Pechuga en salsa criolla:18500\nCerdo | Cerdo asado sin salsa:17000\nSopas | Sopas medianas sin arroz:7000\nSopas | Sopas medianas con arroz:9000\nSopas | Sancocho de pollo con arroz:15000\nCarnes | Carne guisada:19000"
                    }
                    multiline
                    rows={9}
                  />

                  <CampoTexto
                    etiqueta="Acompa帽antes del d铆a"
                    value={acompanantesTexto}
                    onChange={setAcompanantesTexto}
                    placeholder={"Arroz con coco\nEnsalada verde\nPur茅 de papa\nTajadas maduras\nYuca cocida"}
                    multiline
                    rows={7}
                  />

                  <div className="box soft small">
                    <strong>Platos:</strong> escribe un plato por l铆nea con este formato:
                    <br />
                    Categor铆a | Nombre del plato:Precio
                    <br />
                    <br />
                    <strong>Ejemplo:</strong> Pechuga | Pechuga en salsa criolla:18500
                    <br />
                    <br />
                    <strong>Sopas:</strong> los platos con categor铆a Sopas no permiten acompa帽antes ni incluyen sopa + bebida.
                    <br />
                    <br />
                    <strong>Para llevar:</strong> las sopas configuradas como 鈥淪opas medianas sin arroz鈥�, 鈥淪opas medianas con arroz鈥� y 鈥淪ancocho de pollo con arroz鈥� tienen empaque sin costo adicional.
                  </div>

                  <button
                    type="button"
                    onClick={guardarMenu}
                    disabled={guardandoMenu}
                    className="button"
                    style={{ width: "100%", marginTop: 14 }}
                  >
                    {guardandoMenu ? "Guardando men煤..." : "Guardar men煤 del d铆a"}
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
