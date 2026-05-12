import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  calcularTotalItem,
  dinero,
  fechaISOColombia,
  obtenerEstadoPedido,
  obtenerItemsPedido
} from "../utils/pedidos";

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
