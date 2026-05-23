import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  calcularTotalItem,
  dinero,
  fechaISOColombia,
  formatearFechaHora,
  normalizarTexto,
  obtenerCliente,
  obtenerCodigoPedido,
  obtenerEstadoPedido,
  obtenerItemsPedido
} from "../utils/pedidos";

const MESAS_VALIDAS_RAFA = ["1a", "1b", "2a", "2b", "3a", "3b", "4a", "4b", "5b"];

function obtenerMesaValidaRafaDesdeTexto(texto) {
  const normalizado = normalizarTexto(texto).replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalizado) return "";

  const tokens = normalizado.split(/\s+/);
  const encontrada = MESAS_VALIDAS_RAFA.find((mesa) => tokens.includes(mesa) || normalizado === mesa);
  return encontrada ? encontrada.toUpperCase() : "";
}

function obtenerMesaValidaRafaPedido(pedido) {
  const candidatos = [
    obtenerCliente(pedido),
    pedido.cliente,
    pedido.nombre_cliente,
    pedido.nombre,
    pedido.ubicacion,
    pedido.mesa,
    pedido.numero_mesa,
    pedido.mesa_numero
  ];

  for (const candidato of candidatos) {
    const mesa = obtenerMesaValidaRafaDesdeTexto(candidato);
    if (mesa) return mesa;
  }

  return "";
}

function obtenerLineaItemRafa(item) {
  return item?.categoria === "cafeteria" ? "Cafetería" : "Restaurante";
}

function crearResumenMesasVsLlevar(pedidos) {
  const resumen = {
    mesas: { restaurante: { total: 0, cantidad: 0 }, cafeteria: { total: 0, cantidad: 0 } },
    llevar: { restaurante: { total: 0, cantidad: 0 }, cafeteria: { total: 0, cantidad: 0 } },
    lista: new Map()
  };

  pedidos.forEach((pedido) => {
    const grupo = obtenerMesaValidaRafaPedido(pedido) ? "mesas" : "llevar";
    const grupoNombre = grupo === "mesas" ? "Pedidos en mesa" : "Pedidos para llevar";
    const items = obtenerItemsPedido(pedido);

    if (!items.length) {
      const totalPedido = Number(pedido.total) || 0;
      resumen[grupo].restaurante.total += totalPedido;
      resumen[grupo].restaurante.cantidad += 1;
      sumarEnMapa(resumen.lista, `${grupoNombre} · Restaurante`, 1, totalPedido);
      return;
    }

    items.forEach((item) => {
      const cantidad = Number(item.cantidad) || 1;
      const totalItem = calcularTotalItem(item);
      const linea = obtenerLineaItemRafa(item);
      const claveLinea = linea === "Cafetería" ? "cafeteria" : "restaurante";

      resumen[grupo][claveLinea].total += totalItem;
      resumen[grupo][claveLinea].cantidad += cantidad;
      sumarEnMapa(resumen.lista, `${grupoNombre} · ${linea}`, cantidad, totalItem);
    });
  });

  return {
    ...resumen,
    lista: ordenarResumen(resumen.lista)
  };
}


function sumarEnMapa(mapa, clave, cantidad, total) {
  const nombre = clave || "Sin clasificar";
  const actual = mapa.get(nombre) || { nombre, cantidad: 0, total: 0 };
  actual.cantidad += Number(cantidad) || 0;
  actual.total += Number(total) || 0;
  mapa.set(nombre, actual);
}

function ordenarResumen(mapa) {
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total || b.cantidad - a.cantidad);
}

function crearResumenVentas(pedidos) {
  const resumen = {
    restaurante: { total: 0, cantidad: 0 },
    cafeteria: { total: 0, cantidad: 0 },
    subcategoriasCafeteria: new Map(),
    proteinas: new Map(),
    acompanantes: new Map(),
    tabla: new Map()
  };

  pedidos.forEach((pedido) => {
    const items = obtenerItemsPedido(pedido);

    if (!items.length) {
      const totalPedido = Number(pedido.total) || 0;
      resumen.restaurante.total += totalPedido;
      resumen.restaurante.cantidad += 1;
      sumarEnMapa(resumen.tabla, "Restaurante · Sin detalle", 1, totalPedido);
      return;
    }

    items.forEach((item) => {
      const cantidad = Number(item.cantidad) || 1;
      const totalItem = calcularTotalItem(item);
      const esCafeteria = item.categoria === "cafeteria";

      if (esCafeteria) {
        const tipo = item.tipo || "Cafetería";
        resumen.cafeteria.total += totalItem;
        resumen.cafeteria.cantidad += cantidad;
        sumarEnMapa(resumen.subcategoriasCafeteria, tipo, cantidad, totalItem);
        sumarEnMapa(resumen.tabla, `Cafetería · ${tipo}`, cantidad, totalItem);
        return;
      }

      const proteina = item.plato || item.proteina || item.producto || "Almuerzo";
      resumen.restaurante.total += totalItem;
      resumen.restaurante.cantidad += cantidad;
      sumarEnMapa(resumen.proteinas, proteina, cantidad, totalItem);
      sumarEnMapa(resumen.tabla, "Restaurante · Almuerzos", cantidad, totalItem);

      if (Array.isArray(item.acompanantes)) {
        item.acompanantes.forEach((acompanante) => {
          if (!acompanante) return;
          if (normalizarTexto(acompanante) === "con todo") return;
          sumarEnMapa(resumen.acompanantes, acompanante, cantidad, 0);
        });
      }
    });
  });

  return {
    restaurante: resumen.restaurante,
    cafeteria: resumen.cafeteria,
    subcategoriasCafeteria: ordenarResumen(resumen.subcategoriasCafeteria),
    proteinas: ordenarResumen(resumen.proteinas),
    acompanantes: ordenarResumen(resumen.acompanantes).sort((a, b) => b.cantidad - a.cantidad),
    tabla: ordenarResumen(resumen.tabla)
  };
}


function esPagoPendiente(tipoPago) {
  const texto = normalizarTexto(tipoPago);
  return ["pendiente", "credito", "credito", "fiado", "debe", "despues", "pagar despues", "por pagar"].some((palabra) => texto.includes(palabra));
}

function obtenerNombreProductoCliente(item) {
  const base = item.producto || item.plato || item.proteina || item.nombre || "Producto";
  const detalles = [];

  if (item.tipo && item.categoria === "cafeteria") detalles.push(item.tipo);
  if (item.tamano) detalles.push(item.tamano);
  if (item.base) detalles.push(`Base ${item.base}`);
  if (item.acompanante) detalles.push(item.acompanante);
  if (item.bebida) detalles.push(`Bebida ${item.bebida}`);

  return detalles.length ? `${base} · ${detalles.join(" · ")}` : base;
}

function crearFilasClientes(pedidos) {
  return pedidos.flatMap((pedido) => {
    const items = obtenerItemsPedido(pedido);
    const cliente = obtenerCliente(pedido);
    const telefono = pedido.telefono || "";
    const formaPago = pedido.tipo_pago || "No especificado";
    const estado = obtenerEstadoPedido(pedido);
    const base = {
      idPedido: pedido.id || pedido.numero_pedido || pedido.created_at,
      codigo: obtenerCodigoPedido(pedido),
      fecha: pedido.created_at,
      cliente,
      telefono,
      formaPago,
      estado,
      pagoPendiente: esPagoPendiente(formaPago),
      ubicacion: pedido.ubicacion || pedido.mesa || "",
      observaciones: pedido.observaciones || ""
    };

    if (!items.length) {
      return [{
        ...base,
        producto: pedido.pedido_texto || "Pedido sin detalle de productos",
        cantidad: 1,
        total: Number(pedido.total) || 0
      }];
    }

    return items.map((item, index) => ({
      ...base,
      idFila: `${base.idPedido}-${index}`,
      producto: obtenerNombreProductoCliente(item),
      cantidad: Number(item.cantidad) || 1,
      total: calcularTotalItem(item),
      observaciones: item.observacionesItem || item.observacionAcompanantes || base.observaciones
    }));
  });
}

function crearResumenClientes(filas) {
  const mapa = new Map();

  filas.forEach((fila) => {
    const clave = `${normalizarTexto(fila.cliente)}|${normalizarTexto(fila.telefono)}`;
    const actual = mapa.get(clave) || {
      clave,
      cliente: fila.cliente || "Cliente",
      telefono: fila.telefono || "",
      pedidos: new Set(),
      cantidad: 0,
      total: 0,
      pendiente: 0,
      ultimaCompra: fila.fecha
    };

    actual.pedidos.add(fila.codigo);
    actual.cantidad += Number(fila.cantidad) || 0;
    actual.total += Number(fila.total) || 0;
    if (fila.pagoPendiente) actual.pendiente += Number(fila.total) || 0;
    if (fila.fecha && (!actual.ultimaCompra || new Date(fila.fecha) > new Date(actual.ultimaCompra))) {
      actual.ultimaCompra = fila.fecha;
    }

    mapa.set(clave, actual);
  });

  return Array.from(mapa.values())
    .map((cliente) => ({ ...cliente, pedidos: cliente.pedidos.size }))
    .sort((a, b) => b.total - a.total || b.cantidad - a.cantidad);
}

function filtrarFilasClientes(filas, busqueda) {
  const texto = normalizarTexto(busqueda);
  if (!texto) return filas;

  return filas.filter((fila) => {
    const contenido = [fila.cliente, fila.telefono, fila.producto, fila.formaPago, fila.ubicacion, fila.codigo]
      .map(normalizarTexto)
      .join(" ");
    return contenido.includes(texto);
  });
}



function obtenerMesaPedido(pedido) {
  return obtenerMesaValidaRafaPedido(pedido);
}

function obtenerEtiquetaOrigenPedido(pedido) {
  return obtenerMesaValidaRafaPedido(pedido) ? "Pedidos en mesa" : "Pedidos para llevar";
}

function obtenerEtiquetaPagoPedido(pedido) {
  const pago = String(pedido.tipo_pago || pedido.forma_pago || pedido.metodo_pago || "No especificado").trim();
  return pago || "No especificado";
}

function obtenerHoraColombia(fecha) {
  if (!fecha) return null;
  try {
    const hora = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      hour: "2-digit",
      hour12: false
    }).format(new Date(fecha));
    const numero = Number(hora);
    return Number.isFinite(numero) ? numero : null;
  } catch {
    return null;
  }
}

function etiquetaHoraDashboard(hora) {
  const sufijo = hora < 12 ? "a. m." : "p. m.";
  const hora12 = hora === 12 ? 12 : hora > 12 ? hora - 12 : hora;
  return `${hora12}:00 ${sufijo}`;
}

function crearMapaHorasDashboard() {
  const mapa = new Map();
  for (let hora = 7; hora <= 18; hora += 1) {
    const nombre = etiquetaHoraDashboard(hora);
    mapa.set(nombre, { nombre, cantidad: 0, total: 0, orden: hora });
  }
  return mapa;
}

function crearDashboardRafa(pedidos, filasClientes, resumenClientes, resumenVentas) {
  const porHora = crearMapaHorasDashboard();
  const porPago = new Map();
  const porOrigen = new Map();
  const porEstado = new Map();
  const porProducto = new Map();
  const porMesa = new Map();
  const resumenMesasVsLlevar = crearResumenMesasVsLlevar(pedidos);

  pedidos.forEach((pedido) => {
    const totalPedido = Number(pedido.total) || obtenerItemsPedido(pedido).reduce((suma, item) => suma + calcularTotalItem(item), 0);
    const horaPedido = obtenerHoraColombia(pedido.created_at);
    if (horaPedido >= 7 && horaPedido <= 18) {
      sumarEnMapa(porHora, etiquetaHoraDashboard(horaPedido), 1, totalPedido);
    }
    sumarEnMapa(porPago, obtenerEtiquetaPagoPedido(pedido), 1, totalPedido);
    sumarEnMapa(porOrigen, obtenerEtiquetaOrigenPedido(pedido), 1, totalPedido);
    sumarEnMapa(porEstado, obtenerEstadoPedido(pedido), 1, totalPedido);
    const mesa = obtenerMesaPedido(pedido);
    if (mesa) sumarEnMapa(porMesa, mesa, 1, totalPedido);
  });

  filasClientes.forEach((fila) => {
    sumarEnMapa(porProducto, fila.producto, Number(fila.cantidad) || 1, Number(fila.total) || 0);
  });

  const horas = Array.from(porHora.values()).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const ventasPorPago = ordenarResumen(porPago);
  const ventasPorOrigen = ordenarResumen(porOrigen);
  const ventasPorEstado = ordenarResumen(porEstado);
  const productosTop = ordenarResumen(porProducto).slice(0, 10);
  const mesasTop = ordenarResumen(porMesa).slice(0, 10);
  const mejorHora = ordenarResumen(porHora)[0] || null;
  const productoTop = productosTop[0] || null;
  const clienteTop = resumenClientes[0] || null;
  const mesaTop = mesasTop[0] || null;
  const totalVentas = (resumenVentas?.restaurante?.total || 0) + (resumenVentas?.cafeteria?.total || 0);
  const participacionRestaurante = totalVentas > 0 ? Math.round(((resumenVentas.restaurante.total || 0) / totalVentas) * 100) : 0;
  const participacionCafeteria = totalVentas > 0 ? Math.round(((resumenVentas.cafeteria.total || 0) / totalVentas) * 100) : 0;

  return {
    horas,
    ventasPorPago,
    ventasPorOrigen,
    ventasPorEstado,
    productosTop,
    mesasTop,
    mejorHora,
    productoTop,
    clienteTop,
    mesaTop,
    resumenMesasVsLlevar,
    participacionRestaurante,
    participacionCafeteria
  };
}

function MiniBarra({ label, valor, total, detalle }) {
  const porcentaje = total > 0 ? Math.max(4, Math.round((Number(valor) || 0) * 100 / total)) : 0;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
        <strong>{label}</strong>
        <span>{detalle}</span>
      </div>
      <div style={{ height: 9, background: "#f3f4f6", borderRadius: 999, overflow: "hidden", marginTop: 5 }}>
        <div style={{ width: `${porcentaje}%`, height: "100%", background: "#f97316", borderRadius: 999 }} />
      </div>
    </div>
  );
}

function ListaDashboard({ items, totalBase, modo = "dinero", limite = 6 }) {
  const visibles = items.slice(0, limite);
  if (!visibles.length) return <p className="muted">Sin datos en este periodo.</p>;

  return (
    <div>
      {visibles.map((item) => (
        <MiniBarra
          key={item.nombre}
          label={item.nombre}
          valor={modo === "cantidad" ? item.cantidad : item.total}
          total={totalBase}
          detalle={modo === "cantidad" ? `${item.cantidad}` : `${item.cantidad} · ${dinero(item.total)}`}
        />
      ))}
    </div>
  );
}


function TarjetaDashboard({ titulo, valor, onClick, activa = false }) {
  return (
    <button
      type="button"
      className="stat-card"
      onClick={onClick}
      style={{
        textAlign: "left",
        cursor: "pointer",
        border: activa ? "2px solid #f97316" : undefined,
        boxShadow: activa ? "0 8px 20px rgba(249, 115, 22, 0.18)" : undefined
      }}
      title="Ver detalle"
    >
      <span>{titulo}</span>
      <strong>{valor}</strong>
      <small className="muted">Ver detalle</small>
    </button>
  );
}

function CajaDashboard({ children, activa = false, onClick }) {
  return (
    <button
      type="button"
      className="soft-box"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: activa ? "2px solid #f97316" : undefined,
        boxShadow: activa ? "0 8px 20px rgba(249, 115, 22, 0.18)" : undefined
      }}
      title="Ver detalle"
    >
      {children}
      <small className="muted" style={{ display: "block", marginTop: 8 }}>Ver detalle</small>
    </button>
  );
}

function DetalleDashboard({ detalle, onCerrar, detalleRef }) {
  if (!detalle) return null;

  return (
    <div ref={detalleRef} className="soft-box" style={{ marginTop: 20, borderColor: "#fdba74", background: "#fff7ed" }}>
      <div className="admin-top-row">
        <div>
          <h3>{detalle.titulo}</h3>
          {detalle.descripcion && <p className="muted">{detalle.descripcion}</p>}
        </div>
        <button type="button" className="button button-secondary" onClick={onCerrar}>
          Cerrar
        </button>
      </div>

      {detalle.resumen && (
        <div className="admin-stats" style={{ marginTop: 12 }}>
          {detalle.resumen.map((item) => (
            <div className="stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.valor}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="tabla-scroll" style={{ marginTop: 14 }}>
        <table className="tabla-admin">
          <thead>
            <tr>
              {detalle.columnas.map((columna) => <th key={columna}>{columna}</th>)}
            </tr>
          </thead>
          <tbody>
            {detalle.filas.length ? detalle.filas.map((fila, index) => (
              <tr key={`${detalle.titulo}-${index}`}>
                {fila.map((celda, idx) => <td key={idx}>{celda}</td>)}
              </tr>
            )) : (
              <tr>
                <td colSpan={detalle.columnas.length}>Sin datos en este periodo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListaResumen({ items, vacio = "Sin datos en este periodo.", mostrarTotal = true }) {
  if (!items.length) return <p className="muted">{vacio}</p>;

  return (
    <ul className="simple-list">
      {items.map((item) => (
        <li key={item.nombre}>
          <span>{item.nombre}</span>
          <strong>{item.cantidad} {mostrarTotal ? `· ${dinero(item.total)}` : ""}</strong>
        </li>
      ))}
    </ul>
  );
}

export default function PanelRafaPrivado() {
  const hoy = fechaISOColombia();
  const [modoFecha, setModoFecha] = useState("dia");
  const [fechaRafa, setFechaRafa] = useState(hoy);
  const [fechaInicioRafa, setFechaInicioRafa] = useState(hoy);
  const [fechaFinRafa, setFechaFinRafa] = useState(hoy);
  const [pedidosRafa, setPedidosRafa] = useState([]);
  const [cargandoRafa, setCargandoRafa] = useState(false);
  const [errorRafa, setErrorRafa] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [pestanaRafa, setPestanaRafa] = useState("informe");
  const [detalleDashboard, setDetalleDashboard] = useState("");
  const [mostrarTablasDashboard, setMostrarTablasDashboard] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("rafikiMostrarTablasDashboard") === "true";
  });
  const detalleDashboardRef = useRef(null);

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

  const pedidosValidos = pedidosRafa.filter((pedido) => obtenerEstadoPedido(pedido) !== "Borrado");
  const resumenVentas = crearResumenVentas(pedidosValidos);
  const totalVentas = resumenVentas.restaurante.total + resumenVentas.cafeteria.total;
  const totalPedidos = pedidosValidos.length;
  const pendientes = pedidosValidos.filter((pedido) => obtenerEstadoPedido(pedido) === "Pendiente").length;
  const finalizados = pedidosValidos.filter((pedido) => obtenerEstadoPedido(pedido) === "Finalizado").length;
  const promedioPedido = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
  const tituloPeriodo = modoFecha === "rango"
    ? `${rangoRafa.inicioTexto} al ${rangoRafa.finTexto}`
    : rangoRafa.inicioTexto;
  const filasClientes = crearFilasClientes(pedidosValidos);
  const filasClientesFiltradas = filtrarFilasClientes(filasClientes, busquedaCliente);
  const resumenClientes = crearResumenClientes(filasClientesFiltradas);
  const totalClientesFiltrados = resumenClientes.length;
  const totalComprasCliente = filasClientesFiltradas.reduce((suma, fila) => suma + (Number(fila.total) || 0), 0);
  const totalCantidadCliente = filasClientesFiltradas.reduce((suma, fila) => suma + (Number(fila.cantidad) || 0), 0);
  const totalPendienteCliente = filasClientesFiltradas.reduce((suma, fila) => suma + (fila.pagoPendiente ? (Number(fila.total) || 0) : 0), 0);
  const dashboardRafa = crearDashboardRafa(pedidosValidos, filasClientes, crearResumenClientes(filasClientes), resumenVentas);
  const totalItemsVendidos = filasClientes.reduce((suma, fila) => suma + (Number(fila.cantidad) || 0), 0);
  const totalBaseHoras = Math.max(...dashboardRafa.horas.map((item) => item.total), 0);
  const totalBaseProductos = Math.max(...dashboardRafa.productosTop.map((item) => item.cantidad), 0);
  const totalBaseMesas = Math.max(...dashboardRafa.mesasTop.map((item) => item.total), 0);

  function obtenerFechaAyer() {
    const ayer = new Date(`${hoy}T00:00:00-05:00`);
    ayer.setDate(ayer.getDate() - 1);
    return fechaISOColombia(ayer);
  }

  function aplicarPeriodoRapido(tipo) {
    const base = new Date(`${hoy}T00:00:00-05:00`);
    const iso = (fecha) => fechaISOColombia(fecha);

    if (tipo === "hoy") {
      setModoFecha("dia");
      setFechaRafa(hoy);
      return;
    }

    if (tipo === "ayer") {
      setModoFecha("dia");
      setFechaRafa(obtenerFechaAyer());
      return;
    }
  }


  function alternarTablasDashboard(valor) {
    setMostrarTablasDashboard(valor);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rafikiMostrarTablasDashboard", valor ? "true" : "false");
    }
    if (!valor) setDetalleDashboard("");
  }

  function seleccionarDetalleDashboard(tipo) {
    setDetalleDashboard(tipo);
    window.setTimeout(() => {
      detalleDashboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function obtenerTotalPedidoRafa(pedido) {
    return Number(pedido.total) || obtenerItemsPedido(pedido).reduce((suma, item) => suma + calcularTotalItem(item), 0);
  }

  function obtenerProductosTextoPedido(pedido) {
    const items = obtenerItemsPedido(pedido);
    if (!items.length) return pedido.pedido_texto || "Sin detalle";
    return items.map((item) => {
      const cantidad = Number(item.cantidad) || 1;
      return `${cantidad} x ${obtenerNombreProductoCliente(item)}`;
    }).join(" · ");
  }

  function obtenerObservacionesPedidoRafa(pedido, item = null) {
    return item?.observacionesItem || item?.observacionAcompanantes || pedido.observaciones || pedido.nota || "";
  }

  function crearFilaPedidoProfunda(pedido) {
    const mesa = obtenerMesaValidaRafaPedido(pedido);
    return [
      obtenerCodigoPedido(pedido),
      formatearFechaHora(pedido.created_at),
      obtenerCliente(pedido),
      mesa || "Para llevar",
      obtenerProductosTextoPedido(pedido),
      obtenerEstadoPedido(pedido),
      obtenerEtiquetaPagoPedido(pedido),
      dinero(obtenerTotalPedidoRafa(pedido))
    ];
  }

  function crearFilasItemsProfundas(filtro = () => true) {
    return pedidosValidos
      .slice()
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .flatMap((pedido) => {
        const items = obtenerItemsPedido(pedido);
        const mesa = obtenerMesaValidaRafaPedido(pedido);
        const base = {
          codigo: obtenerCodigoPedido(pedido),
          fecha: formatearFechaHora(pedido.created_at),
          cliente: obtenerCliente(pedido),
          ubicacion: mesa || "Para llevar",
          estado: obtenerEstadoPedido(pedido),
          pago: obtenerEtiquetaPagoPedido(pedido)
        };

        if (!items.length) {
          const filaVirtual = { categoria: "restaurante", producto: pedido.pedido_texto || "Pedido sin detalle" };
          if (!filtro(pedido, filaVirtual)) return [];
          return [[base.codigo, base.fecha, base.cliente, base.ubicacion, "Restaurante", obtenerNombreProductoCliente(filaVirtual), 1, base.estado, base.pago, dinero(obtenerTotalPedidoRafa(pedido)), obtenerObservacionesPedidoRafa(pedido)]];
        }

        return items.filter((item) => filtro(pedido, item)).map((item) => [
          base.codigo,
          base.fecha,
          base.cliente,
          base.ubicacion,
          obtenerLineaItemRafa(item),
          obtenerNombreProductoCliente(item),
          Number(item.cantidad) || 1,
          base.estado,
          base.pago,
          dinero(calcularTotalItem(item)),
          obtenerObservacionesPedidoRafa(pedido, item)
        ]);
      });
  }

  function crearFilasPedidosProfundas(filtro = () => true) {
    return pedidosValidos
      .slice()
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .filter(filtro)
      .map(crearFilaPedidoProfunda);
  }

  function crearDetalleDashboardSeleccionado(tipo) {
    if (!tipo) return null;

    const columnasPedidos = ["Pedido", "Fecha", "Cliente", "Ubicación", "Productos", "Estado", "Pago", "Total"];
    const columnasItems = ["Pedido", "Fecha", "Cliente", "Ubicación", "Línea", "Producto", "Cant.", "Estado", "Pago", "Total", "Obs."];

    if (tipo === "venta-linea") {
      return {
        titulo: "Detalle profundo · Venta por línea",
        descripcion: "Cada fila muestra los productos vendidos, separados por restaurante y cafetería.",
        resumen: [
          { label: "Restaurante", valor: `${resumenVentas.restaurante.cantidad} · ${dinero(resumenVentas.restaurante.total)}` },
          { label: "Cafetería", valor: `${resumenVentas.cafeteria.cantidad} · ${dinero(resumenVentas.cafeteria.total)}` },
          { label: "Total", valor: dinero(totalVentas) }
        ],
        columnas: columnasItems,
        filas: crearFilasItemsProfundas()
      };
    }

    if (tipo === "mesa-linea" || tipo === "llevar-linea") {
      const esMesa = tipo === "mesa-linea";
      const grupo = esMesa ? dashboardRafa.resumenMesasVsLlevar.mesas : dashboardRafa.resumenMesasVsLlevar.llevar;
      return {
        titulo: `Detalle profundo · ${esMesa ? "Pedidos en mesa" : "Pedidos para llevar"}`,
        descripcion: esMesa
          ? "Pedidos detectados como mesas válidas: 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B y 5B."
          : "Pedidos que no corresponden a las mesas válidas y se clasifican como para llevar.",
        resumen: [
          { label: "Restaurante", valor: `${grupo.restaurante.cantidad} · ${dinero(grupo.restaurante.total)}` },
          { label: "Cafetería", valor: `${grupo.cafeteria.cantidad} · ${dinero(grupo.cafeteria.total)}` },
          { label: "Total", valor: dinero(grupo.restaurante.total + grupo.cafeteria.total) }
        ],
        columnas: columnasItems,
        filas: crearFilasItemsProfundas((pedido) => Boolean(obtenerMesaValidaRafaPedido(pedido)) === esMesa)
      };
    }

    if (tipo === "horas") {
      return {
        titulo: "Detalle profundo · Ventas por hora",
        descripcion: "Pedidos reales del periodo, ordenados del más reciente al más antiguo, con hora y detalle del pedido.",
        resumen: [
          { label: "Total vendido", valor: dinero(totalVentas) },
          { label: "Horas con venta", valor: dashboardRafa.horas.length },
          { label: "Mejor hora", valor: dashboardRafa.mejorHora ? `${dashboardRafa.mejorHora.nombre} · ${dinero(dashboardRafa.mejorHora.total)}` : "Sin datos" }
        ],
        columnas: ["Hora", ...columnasPedidos],
        filas: pedidosValidos
          .slice()
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .map((pedido) => [`${obtenerHoraColombia(pedido.created_at)}:00`, ...crearFilaPedidoProfunda(pedido)])
      };
    }

    if (tipo === "productos") {
      return {
        titulo: "Detalle profundo · Top productos",
        descripcion: "Productos vendidos con el pedido, cliente, ubicación y observación asociada.",
        resumen: [
          { label: "Unidades", valor: totalItemsVendidos },
          { label: "Productos diferentes", valor: dashboardRafa.productosTop.length },
          { label: "Total vendido", valor: dinero(totalVentas) }
        ],
        columnas: columnasItems,
        filas: crearFilasItemsProfundas()
      };
    }

    if (tipo === "mesas-top") {
      return {
        titulo: "Detalle profundo · Mesas que más venden",
        descripcion: "Pedidos de mesas válidas con productos, cliente, estado, pago y total.",
        resumen: [
          { label: "Mesas con venta", valor: dashboardRafa.mesasTop.length },
          { label: "Mesa líder", valor: dashboardRafa.mesaTop ? `${dashboardRafa.mesaTop.nombre} · ${dinero(dashboardRafa.mesaTop.total)}` : "Sin datos" }
        ],
        columnas: ["Mesa", ...columnasPedidos],
        filas: pedidosValidos
          .slice()
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .filter((pedido) => obtenerMesaValidaRafaPedido(pedido))
          .map((pedido) => [obtenerMesaValidaRafaPedido(pedido), ...crearFilaPedidoProfunda(pedido)])
      };
    }

    if (tipo === "estados") {
      return {
        titulo: "Detalle profundo · Estados",
        descripcion: "Pedidos reales separados por estado para revisar pendientes, finalizados o inconsistencias.",
        resumen: [
          { label: "Finalizados", valor: finalizados },
          { label: "Pendientes", valor: pendientes },
          { label: "Pedidos", valor: totalPedidos }
        ],
        columnas: columnasPedidos,
        filas: crearFilasPedidosProfundas()
      };
    }

    if (tipo === "pagos") {
      return {
        titulo: "Detalle profundo · Métodos de pago",
        descripcion: "Pedidos reales con método de pago para revisar efectivo, transferencia, pendientes o no especificados.",
        resumen: [
          { label: "Métodos detectados", valor: dashboardRafa.ventasPorPago.length },
          { label: "Total vendido", valor: dinero(totalVentas) }
        ],
        columnas: columnasPedidos,
        filas: crearFilasPedidosProfundas()
      };
    }

    if (tipo === "origen") {
      return {
        titulo: "Detalle profundo · Origen de pedidos",
        descripcion: "Pedidos reales clasificados como mesa o para llevar según cliente/ubicación.",
        resumen: [
          { label: "Pedidos en mesa", valor: dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.cantidad + dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.cantidad },
          { label: "Para llevar", valor: dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.cantidad + dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.cantidad },
          { label: "Total vendido", valor: dinero(totalVentas) }
        ],
        columnas: columnasPedidos,
        filas: crearFilasPedidosProfundas()
      };
    }

    return null;
  }


  function escaparHtml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function filasResumenPdf(items, mostrarTotal = true) {
    if (!items.length) {
      return `<tr><td colspan="${mostrarTotal ? 3 : 2}">Sin datos en este periodo.</td></tr>`;
    }

    return items.map((item) => `
      <tr>
        <td>${escaparHtml(item.nombre)}</td>
        <td>${Number(item.cantidad) || 0}</td>
        ${mostrarTotal ? `<td>${dinero(item.total)}</td>` : ""}
      </tr>
    `).join("");
  }


  function generarTextoWhatsappInformeRafa() {
    const lineas = [
      `📋 *Informe Rafa*`,
      `Periodo: ${tituloPeriodo}`,
      ``,
      `💰 *Total vendido:* ${dinero(totalVentas)}`,
      `🍽️ Restaurante: ${resumenVentas.restaurante.cantidad} · ${dinero(resumenVentas.restaurante.total)}`,
      `☕ Cafetería: ${resumenVentas.cafeteria.cantidad} · ${dinero(resumenVentas.cafeteria.total)}`,
      `🧾 Pedidos válidos: ${totalPedidos}`,
      `✅ Finalizados: ${finalizados}`,
      `⏳ Pendientes: ${pendientes}`,
      `📊 Promedio por pedido: ${dinero(promedioPedido)}`
    ];

    if (resumenVentas.proteinas.length) {
      lineas.push(``, `🥇 *Proteínas más vendidas:*`);
      resumenVentas.proteinas.slice(0, 6).forEach((item) => {
        lineas.push(`• ${item.nombre}: ${item.cantidad} · ${dinero(item.total)}`);
      });
    }

    if (resumenVentas.acompanantes.length) {
      lineas.push(``, `🥗 *Acompañantes más usados:*`);
      resumenVentas.acompanantes.slice(0, 6).forEach((item) => {
        lineas.push(`• ${item.nombre}: ${item.cantidad}`);
      });
    }

    if (resumenVentas.subcategoriasCafeteria.length) {
      lineas.push(``, `☕ *Cafetería por subcategoría:*`);
      resumenVentas.subcategoriasCafeteria.slice(0, 6).forEach((item) => {
        lineas.push(`• ${item.nombre}: ${item.cantidad} · ${dinero(item.total)}`);
      });
    }

    lineas.push(``, `_Generado desde Rafiki Pedidos_`);
    return lineas.join("\n");
  }

  async function compartirInformeWhatsappRafa() {
    if (!pedidosValidos.length) {
      setErrorRafa("No hay pedidos válidos para compartir en este periodo.");
      return;
    }

    const texto = generarTextoWhatsappInformeRafa();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
      }
    } catch {
      // Si el navegador no permite copiar, igual abrimos WhatsApp con el texto.
    }

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function generarInformePdfRafa() {
    const fechaGeneracion = new Date().toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short"
    });

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Informe Rafa - ${escaparHtml(tituloPeriodo)}</title>
          <style>
            @page { size: A4; margin: 14mm; }
            body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; }
            .header { border-bottom: 3px solid #f97316; padding-bottom: 12px; margin-bottom: 16px; }
            h1 { margin: 0; color: #c2410c; font-size: 24px; }
            h2 { color: #c2410c; font-size: 17px; margin: 22px 0 8px; }
            .muted { color: #6b7280; font-size: 12px; margin-top: 5px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 14px 0; }
            .stat { border: 1px solid #fed7aa; background: #fff7ed; border-radius: 12px; padding: 10px; }
            .stat span { display: block; font-size: 11px; color: #7c2d12; font-weight: bold; text-transform: uppercase; }
            .stat strong { display: block; font-size: 18px; margin-top: 4px; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid; }
            th { background: #f97316; color: white; text-align: left; padding: 8px; font-size: 12px; }
            td { border: 1px solid #e5e7eb; padding: 7px 8px; font-size: 12px; }
            tr:nth-child(even) td { background: #fff7ed; }
            .footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Informe Rafa · Rafiki Pedidos</h1>
            <div class="muted">Periodo: ${escaparHtml(tituloPeriodo)} · Generado: ${escaparHtml(fechaGeneracion)}</div>
          </div>

          <div class="stats">
            <div class="stat"><span>Total vendido</span><strong>${dinero(totalVentas)}</strong></div>
            <div class="stat"><span>Restaurante</span><strong>${dinero(resumenVentas.restaurante.total)}</strong></div>
            <div class="stat"><span>Cafetería</span><strong>${dinero(resumenVentas.cafeteria.total)}</strong></div>
            <div class="stat"><span>Pedidos válidos</span><strong>${totalPedidos}</strong></div>
            <div class="stat"><span>Promedio por pedido</span><strong>${dinero(promedioPedido)}</strong></div>
            <div class="stat"><span>Finalizados</span><strong>${finalizados}</strong></div>
          </div>

          <h2>Resumen Restaurante</h2>
          <table>
            <tbody>
              <tr><td><strong>Total vendido restaurante</strong></td><td>${dinero(resumenVentas.restaurante.total)}</td></tr>
              <tr><td><strong>Almuerzos vendidos</strong></td><td>${resumenVentas.restaurante.cantidad}</td></tr>
              <tr><td><strong>Pendientes</strong></td><td>${pendientes}</td></tr>
              <tr><td><strong>Finalizados</strong></td><td>${finalizados}</td></tr>
            </tbody>
          </table>

          <h2>Resumen Cafetería</h2>
          <table>
            <thead><tr><th>Subcategoría</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>${filasResumenPdf(resumenVentas.subcategoriasCafeteria)}</tbody>
          </table>

          <h2>Proteínas más vendidas</h2>
          <table>
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>${filasResumenPdf(resumenVentas.proteinas.slice(0, 20))}</tbody>
          </table>

          <h2>Acompañantes más usados</h2>
          <table>
            <thead><tr><th>Acompañante</th><th>Cantidad</th></tr></thead>
            <tbody>${filasResumenPdf(resumenVentas.acompanantes.slice(0, 20), false)}</tbody>
          </table>

          <h2>Tabla consolidada</h2>
          <table>
            <thead><tr><th>Categoría</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>${filasResumenPdf(resumenVentas.tabla)}</tbody>
          </table>

          <div class="footer">Los pedidos en estado Borrado no se incluyen en este informe ni en las estadísticas.</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `;

    const ventana = window.open("", "_blank", "width=900,height=700");
    if (!ventana) {
      setErrorRafa("El navegador bloqueó la ventana del PDF. Permite ventanas emergentes e intenta de nuevo.");
      return;
    }

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  }

  return (
    <section className="card card-pad">
      <div className="admin-top-row">
        <div>
          <h2>🔒 Panel Rafa</h2>
          <p className="muted">Resumen gerencial de ventas por restaurante, cafetería y subcategorías.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" className="button-secondary" onClick={compartirInformeWhatsappRafa} disabled={cargandoRafa || pedidosValidos.length === 0}>
            📲 Compartir WhatsApp
          </button>
          <button type="button" className="button" onClick={generarInformePdfRafa} disabled={cargandoRafa || pedidosValidos.length === 0}>
            📄 Generar PDF
          </button>
        </div>
      </div>

      <div className="soft-box" style={{ marginBottom: 16 }}>
        <h3>Seleccionar periodo</h3>
        <div className="filtros-historial" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => aplicarPeriodoRapido("hoy")} className={modoFecha === "dia" && fechaRafa === hoy ? "active" : ""}>
            Hoy
          </button>
          <button type="button" onClick={() => aplicarPeriodoRapido("ayer")} className={modoFecha === "dia" && fechaRafa === obtenerFechaAyer() ? "active" : ""}>
            Ayer
          </button>
          <button type="button" onClick={() => setModoFecha("rango")} className={modoFecha === "rango" ? "active" : ""}>
            Rango manual
          </button>

          {modoFecha === "rango" && (
            <>
              <label className="calendario-filtro">
                <span>Desde</span>
                <input type="date" value={fechaInicioRafa} onChange={(e) => setFechaInicioRafa(e.target.value)} />
              </label>
              <label className="calendario-filtro">
                <span>Hasta</span>
                <input type="date" value={fechaFinRafa} onChange={(e) => setFechaFinRafa(e.target.value)} />
              </label>
            </>
          )}

          <label className="calendario-filtro">
            <span>Día</span>
            <input
              type="date"
              value={fechaRafa}
              onChange={(e) => {
                setModoFecha("dia");
                setFechaRafa(e.target.value);
              }}
            />
          </label>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Informe seleccionado: <strong>{tituloPeriodo}</strong>
        </p>
      </div>

      <div className="filtros-historial" style={{ marginBottom: 16 }}>
        <button type="button" onClick={() => setPestanaRafa("informe")} className={pestanaRafa === "informe" ? "active" : ""}>
          📋 Informe
        </button>
        <button type="button" onClick={() => setPestanaRafa("dashboard")} className={pestanaRafa === "dashboard" ? "active" : ""}>
          📊 Dashboard
        </button>
        <button type="button" onClick={() => setPestanaRafa("clientes")} className={pestanaRafa === "clientes" ? "active" : ""}>
          👤 Clientes
        </button>
      </div>

      {errorRafa && <div className="alert alert-error">{errorRafa}</div>}
      {cargandoRafa && <div className="alert alert-info">Cargando informe...</div>}

      {pestanaRafa === "dashboard" && (
      <div className="soft-box" style={{ marginBottom: 22, borderColor: "#fed7aa", background: "linear-gradient(135deg, #fff7ed, #ffffff)" }}>
        <div className="admin-top-row">
          <div>
            <h3>📊 Dashboard Rafa</h3>
            <p className="muted">Vista ejecutiva rápida del periodo seleccionado, sin modificar pedidos ni menú.</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="badge badge-finalizado">Solo lectura</span>
            <p className="muted" style={{ marginTop: 6 }}>Pedidos borrados excluidos</p>
            <label className="field-label" style={{ marginTop: 10, alignItems: "flex-end" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={mostrarTablasDashboard}
                  onChange={(e) => alternarTablasDashboard(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                Mostrar tablas
              </span>
            </label>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 18 }}>
          <CajaDashboard activa={detalleDashboard === "venta-linea"} onClick={() => seleccionarDetalleDashboard("venta-linea")}>
            <h3>🧾 Venta por línea</h3>
            <MiniBarra label="Restaurante" valor={resumenVentas.restaurante.total} total={totalVentas} detalle={`${resumenVentas.restaurante.cantidad} · ${dinero(resumenVentas.restaurante.total)}`} />
            <MiniBarra label="Cafetería" valor={resumenVentas.cafeteria.total} total={totalVentas} detalle={`${resumenVentas.cafeteria.cantidad} · ${dinero(resumenVentas.cafeteria.total)}`} />
          </CajaDashboard>

          <CajaDashboard activa={detalleDashboard === "mesa-linea"} onClick={() => seleccionarDetalleDashboard("mesa-linea")}>
            <h3>🪑 Pedidos en mesa</h3>
            <MiniBarra label="Restaurante" valor={dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.total} total={totalVentas} detalle={`${dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.cantidad} · ${dinero(dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.total)}`} />
            <MiniBarra label="Cafetería" valor={dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.total} total={totalVentas} detalle={`${dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.cantidad} · ${dinero(dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.total)}`} />
          </CajaDashboard>
        </div>

        <div className="grid-2" style={{ marginTop: 18 }}>
          <CajaDashboard activa={detalleDashboard === "llevar-linea"} onClick={() => seleccionarDetalleDashboard("llevar-linea")}>
            <h3>🥡 Pedidos para llevar</h3>
            <MiniBarra label="Restaurante" valor={dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.total} total={totalVentas} detalle={`${dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.cantidad} · ${dinero(dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.total)}`} />
            <MiniBarra label="Cafetería" valor={dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.total} total={totalVentas} detalle={`${dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.cantidad} · ${dinero(dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.total)}`} />
          </CajaDashboard>
        </div>

        <div className="grid-2" style={{ marginTop: 18 }}>
          <CajaDashboard activa={detalleDashboard === "horas"} onClick={() => seleccionarDetalleDashboard("horas")}>
            <h3>⏱️ Ventas por hora</h3>
            <ListaDashboard items={dashboardRafa.horas} totalBase={totalBaseHoras || totalVentas} limite={12} />
          </CajaDashboard>

          {mostrarTablasDashboard ? (
            <CajaDashboard activa={detalleDashboard === "productos"} onClick={() => seleccionarDetalleDashboard("productos")}>
              <h3>🥇 Top productos</h3>
              <ListaDashboard items={dashboardRafa.productosTop} totalBase={totalBaseProductos || totalItemsVendidos} modo="cantidad" limite={8} />
            </CajaDashboard>
          ) : (
            <div className="soft-box" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
              <h3>📋 Tablas del dashboard ocultas</h3>
              <p className="muted">Activa “Mostrar tablas” cuando quieras revisar top productos, mesas, estados, métodos de pago y origen.</p>
            </div>
          )}
        </div>

        {mostrarTablasDashboard && (
          <>
            <div className="grid-2" style={{ marginTop: 18 }}>
              <CajaDashboard activa={detalleDashboard === "mesas-top"} onClick={() => seleccionarDetalleDashboard("mesas-top")}>
                <h3>🪑 Mesas que más venden</h3>
                <ListaDashboard items={dashboardRafa.mesasTop} totalBase={totalBaseMesas || totalVentas} limite={8} />
              </CajaDashboard>

              <CajaDashboard activa={detalleDashboard === "estados"} onClick={() => seleccionarDetalleDashboard("estados")}>
                <h3>📌 Estados</h3>
                <ListaDashboard items={dashboardRafa.ventasPorEstado} totalBase={totalVentas} limite={6} />
              </CajaDashboard>
            </div>

            <div className="grid-2" style={{ marginTop: 18 }}>
              <CajaDashboard activa={detalleDashboard === "pagos"} onClick={() => seleccionarDetalleDashboard("pagos")}>
                <h3>💳 Métodos de pago</h3>
                <ListaDashboard items={dashboardRafa.ventasPorPago} totalBase={totalVentas} limite={6} />
              </CajaDashboard>

              <CajaDashboard activa={detalleDashboard === "origen"} onClick={() => seleccionarDetalleDashboard("origen")}>
                <h3>📍 Origen de pedidos</h3>
                <ListaDashboard items={dashboardRafa.ventasPorOrigen} totalBase={totalVentas} limite={6} />
              </CajaDashboard>
            </div>

            <DetalleDashboard detalle={crearDetalleDashboardSeleccionado(detalleDashboard)} onCerrar={() => setDetalleDashboard("")} detalleRef={detalleDashboardRef} />
          </>
        )}
      </div>
      )}

      {pestanaRafa === "informe" && (
      <>
      <div className="admin-stats">
        <div className="stat-card"><span>Total vendido</span><strong>{dinero(totalVentas)}</strong></div>
        <div className="stat-card"><span>Restaurante</span><strong>{dinero(resumenVentas.restaurante.total)}</strong></div>
        <div className="stat-card"><span>Cafetería</span><strong>{dinero(resumenVentas.cafeteria.total)}</strong></div>
        <div className="stat-card"><span>Pedidos</span><strong>{totalPedidos}</strong></div>
        <div className="stat-card"><span>Promedio</span><strong>{dinero(promedioPedido)}</strong></div>
        <div className="stat-card"><span>Finalizados</span><strong>{finalizados}</strong></div>
      </div>

      <div className="grid-2">
        <div className="soft-box">
          <h3>🍽️ Restaurante</h3>
          <p><strong>Total vendido:</strong> {dinero(resumenVentas.restaurante.total)}</p>
          <p><strong>Almuerzos vendidos:</strong> {resumenVentas.restaurante.cantidad}</p>
          <p><strong>Pendientes:</strong> {pendientes} · <strong>Finalizados:</strong> {finalizados}</p>
        </div>

        <div className="soft-box">
          <h3>☕ Cafetería</h3>
          <p><strong>Total vendido:</strong> {dinero(resumenVentas.cafeteria.total)}</p>
          <p><strong>Productos vendidos:</strong> {resumenVentas.cafeteria.cantidad}</p>
          <ListaResumen items={resumenVentas.subcategoriasCafeteria} />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 22 }}>
        <div className="soft-box">
          <h3>Proteínas más vendidas</h3>
          <ListaResumen items={resumenVentas.proteinas.slice(0, 12)} />
        </div>

        <div className="soft-box">
          <h3>Acompañantes más usados</h3>
          <ListaResumen items={resumenVentas.acompanantes.slice(0, 12)} mostrarTotal={false} />
        </div>
      </div>

      <div className="soft-box" style={{ marginTop: 22 }}>
        <h3>🧾 Consolidado</h3>
        {resumenVentas.tabla.length === 0 ? (
          <p className="muted">Todavía no hay ventas para este periodo.</p>
        ) : (
          <div className="pedidos-tabla-wrap">
            <table className="pedidos-tabla-compacta">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {resumenVentas.tabla.map((fila) => (
                  <tr key={fila.nombre}>
                    <td><strong>{fila.nombre}</strong></td>
                    <td>{fila.cantidad}</td>
                    <td className="td-total">{dinero(fila.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </>
      )}

      {pestanaRafa === "clientes" && (
      <div className="soft-box" style={{ marginTop: 22 }}>
        <div className="admin-top-row">
          <div>
            <h3>👤 Historial de clientes</h3>
            <p className="muted">Busca por nombre, teléfono, producto, forma de pago o número de pedido.</p>
          </div>
        </div>

        <label className="field" style={{ marginTop: 10 }}>
          <span>Buscar cliente o compra</span>
          <input
            type="search"
            value={busquedaCliente}
            onChange={(e) => setBusquedaCliente(e.target.value)}
            placeholder="Ej: Laura, pechuga, pendiente, 3001234567..."
          />
        </label>

        <div className="admin-stats" style={{ marginTop: 14 }}>
          <div className="stat-card"><span>Clientes encontrados</span><strong>{totalClientesFiltrados}</strong></div>
          <div className="stat-card"><span>Productos comprados</span><strong>{totalCantidadCliente}</strong></div>
          <div className="stat-card"><span>Total comprado</span><strong>{dinero(totalComprasCliente)}</strong></div>
          <div className="stat-card"><span>Posible pendiente</span><strong>{dinero(totalPendienteCliente)}</strong></div>
        </div>

        {busquedaCliente.trim() && resumenClientes.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <h4>Resumen del cliente</h4>
            <div className="pedidos-tabla-wrap">
              <table className="pedidos-tabla-compacta">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Pedidos</th>
                    <th>Cantidad</th>
                    <th>Total comprado</th>
                    <th>Posible pendiente</th>
                    <th>Última compra</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenClientes.slice(0, 12).map((cliente) => (
                    <tr key={cliente.clave}>
                      <td><strong>{cliente.cliente}</strong></td>
                      <td>{cliente.telefono || "—"}</td>
                      <td>{cliente.pedidos}</td>
                      <td>{cliente.cantidad}</td>
                      <td className="td-total">{dinero(cliente.total)}</td>
                      <td className={cliente.pendiente > 0 ? "td-total" : ""}>{cliente.pendiente > 0 ? dinero(cliente.pendiente) : "—"}</td>
                      <td>{formatearFechaHora(cliente.ultimaCompra)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <h4>Detalle de compras</h4>
          {filasClientesFiltradas.length === 0 ? (
            <p className="muted">No se encontraron compras con ese criterio en el periodo seleccionado.</p>
          ) : (
            <div className="pedidos-tabla-wrap">
              <table className="pedidos-tabla-compacta">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filasClientesFiltradas.slice(0, 80).map((fila, index) => (
                    <tr key={fila.idFila || `${fila.codigo}-${index}`}>
                      <td>{formatearFechaHora(fila.fecha)}</td>
                      <td><strong>{fila.codigo}</strong></td>
                      <td>
                        <strong>{fila.cliente}</strong>
                        {fila.telefono && <small style={{ display: "block" }}>{fila.telefono}</small>}
                      </td>
                      <td>{fila.producto}</td>
                      <td>{fila.cantidad}</td>
                      <td className="td-total">{dinero(fila.total)}</td>
                      <td>{fila.pagoPendiente ? "⚠️ " : ""}{fila.formaPago}</td>
                      <td>{fila.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filasClientesFiltradas.length > 80 && (
            <p className="muted" style={{ marginTop: 8 }}>Se muestran las primeras 80 líneas. Usa una búsqueda más específica para ver menos resultados.</p>
          )}
          <p className="muted" style={{ marginTop: 8 }}>
            Nota: “Posible pendiente” se calcula según la forma de pago cuando contiene palabras como pendiente, crédito, fiado, debe o pagar después.
          </p>
        </div>
      </div>
      )}

    </section>
  );
}
