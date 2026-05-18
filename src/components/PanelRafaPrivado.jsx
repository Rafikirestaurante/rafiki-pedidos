import React, { useEffect, useMemo, useState } from "react";
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
        <button type="button" className="button" onClick={generarInformePdfRafa} disabled={cargandoRafa || pedidosValidos.length === 0}>
          📄 Generar PDF
        </button>
      </div>

      <div className="soft-box" style={{ marginBottom: 16 }}>
        <h3>Seleccionar periodo</h3>
        <div className="filtros-historial" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => setModoFecha("dia")} className={modoFecha === "dia" ? "active" : ""}>
            Un día
          </button>
          <button type="button" onClick={() => setModoFecha("rango")} className={modoFecha === "rango" ? "active" : ""}>
            Varios días
          </button>

          {modoFecha === "dia" ? (
            <label className="calendario-filtro">
              <span>Fecha</span>
              <input type="date" value={fechaRafa} onChange={(e) => setFechaRafa(e.target.value)} />
            </label>
          ) : (
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
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Informe seleccionado: <strong>{tituloPeriodo}</strong>
        </p>
      </div>

      {errorRafa && <div className="alert alert-error">{errorRafa}</div>}
      {cargandoRafa && <div className="alert alert-info">Cargando informe...</div>}

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

      <div className="soft-box" style={{ marginTop: 22 }}>
        <h3>Tabla consolidada</h3>
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
    </section>
  );
}
