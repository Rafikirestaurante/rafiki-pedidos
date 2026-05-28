import React from "react";
import { dinero } from "../../../utils/pedidos";

function porcentaje(valor, total) {
  return total > 0 ? Math.round(((Number(valor) || 0) * 100) / total) : 0;
}

function MiniBarra({ label, valor, total, detalle }) {
  const pct = porcentaje(valor, total);
  const ancho = total > 0 ? Math.max(4, pct) : 0;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
        <strong>{label}</strong>
        <span>{detalle}</span>
      </div>
      <div style={{ height: 9, background: "#f3f4f6", borderRadius: 999, overflow: "hidden", marginTop: 5 }}>
        <div style={{ width: `${ancho}%`, height: "100%", background: "#f97316", borderRadius: 999 }} />
      </div>
    </div>
  );
}

function totalizar(items) {
  return (items || []).reduce((acc, item) => ({
    cantidad: acc.cantidad + (Number(item.cantidad) || 0),
    total: acc.total + (Number(item.total) || 0)
  }), { cantidad: 0, total: 0 });
}

function SumatorioDashboard({ cantidad, total, textoCantidad = "Cantidad" }) {
  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
      <strong>Total</strong>
      <strong>{textoCantidad}: {Number(cantidad) || 0} · {dinero(total)}</strong>
    </div>
  );
}

function ListaDashboard({ items, totalBase, modo = "dinero", limite = 6, textoCantidad = "Cant." }) {
  const visibles = items.slice(0, limite);
  if (!visibles.length) return <p className="muted">Sin datos en este periodo.</p>;
  const sumatorio = totalizar(visibles);

  return (
    <div>
      {visibles.map((item) => {
        const valorBarra = modo === "cantidad" ? item.cantidad : item.total;
        const pct = porcentaje(valorBarra, totalBase);
        return (
          <MiniBarra
            key={item.nombre}
            label={item.nombre}
            valor={valorBarra}
            total={totalBase}
            detalle={`${textoCantidad}: ${Number(item.cantidad) || 0} · ${pct}% · ${dinero(item.total)}`}
          />
        );
      })}
      <SumatorioDashboard cantidad={sumatorio.cantidad} total={sumatorio.total} textoCantidad={textoCantidad} />
    </div>
  );
}


function ListaMeserosDashboard({ items, totalBase, limite = 8 }) {
  const visibles = (items || []).slice(0, limite);
  if (!visibles.length) return <p className="muted">Sin datos en este periodo.</p>;
  const sumatorio = totalizar(visibles);

  return (
    <div>
      {visibles.map((item) => {
        const pct = porcentaje(item.total, totalBase);
        return (
          <MiniBarra
            key={item.nombre}
            label={item.nombre}
            valor={item.total}
            total={totalBase}
            detalle={`${Number(item.cantidad) || 0} pedidos · ${pct}% · ${dinero(item.total)}`}
          />
        );
      })}
      <SumatorioDashboard cantidad={sumatorio.cantidad} total={sumatorio.total} textoCantidad="Pedidos" />
    </div>
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

function LineaVenta({ nombre, resumen, totalVentas }) {
  const pct = porcentaje(resumen.total, totalVentas);
  return (
    <MiniBarra
      label={`${nombre} (${pct}%)`}
      valor={resumen.total}
      total={totalVentas}
      detalle={`${resumen.cantidad} vendidos · ${dinero(resumen.total)}`}
    />
  );
}

export default function DashboardRafa({
  dashboardRafa,
  resumenVentas,
  totalVentas,
  totalItemsVendidos,
  totalBaseHoras,
  totalBaseProductos,
  totalBaseMesas,
  totalGastos = 0,
  utilidadAproximada = 0,
  gastosPorCategoria = {},
  detalleDashboard,
  detalleDashboardRef,
  seleccionarDetalleDashboard,
  crearDetalleDashboardSeleccionado,
  onCerrarDetalle
}) {
  const totalPedidosMesa = dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.cantidad + dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.cantidad;
  const totalVentaMesa = dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.total + dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.total;
  const totalPedidosLlevar = dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.cantidad + dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.cantidad;
  const totalVentaLlevar = dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.total + dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.total;
  return (
    <div className="soft-box" style={{ marginBottom: 22, borderColor: "#fed7aa", background: "linear-gradient(135deg, #fff7ed, #ffffff)" }}>
      <div className="admin-top-row">
        <div>
          <h3>📊 Dashboard Rafa</h3>
          <p className="muted">Vista ejecutiva rápida del periodo seleccionado, sin modificar pedidos ni menú.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="badge badge-finalizado">Solo lectura</span>
          <p className="muted" style={{ marginTop: 6 }}>Pedidos borrados excluidos</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="soft-box" style={{ borderColor: "#bbf7d0", background: "#f0fdf4" }}>
          <h3>🧮 Control financiero 23A</h3>
          <div className="admin-stats" style={{ marginTop: 12 }}>
            <div className="stat-card"><span>Ventas</span><strong>{dinero(totalVentas)}</strong></div>
            <div className="stat-card"><span>Gastos</span><strong>{dinero(totalGastos)}</strong></div>
            <div className="stat-card"><span>Utilidad aprox.</span><strong>{dinero(utilidadAproximada)}</strong></div>
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>Utilidad aproximada = ventas del periodo - gastos registrados. No incluye inventario ni receta todavía.</p>
        </div>

        <div className="soft-box" style={{ borderColor: "#bfdbfe", background: "#eff6ff" }}>
          <h3>💸 Gastos por categoría</h3>
          {Object.keys(gastosPorCategoria || {}).length ? (
            <div style={{ marginTop: 8 }}>
              {Object.entries(gastosPorCategoria).slice(0, 6).map(([categoria, total]) => (
                <MiniBarra key={categoria} label={categoria} valor={total} total={totalGastos} detalle={dinero(total)} />
              ))}
            </div>
          ) : <p className="muted">Sin gastos registrados en este periodo.</p>}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <CajaDashboard activa={detalleDashboard === "venta-linea"} onClick={() => seleccionarDetalleDashboard("venta-linea")}>
          <h3>🧾 Venta por línea</h3>
          <LineaVenta nombre="Restaurante" resumen={resumenVentas.restaurante} totalVentas={totalVentas} />
          <LineaVenta nombre="Cafetería" resumen={resumenVentas.cafeteria} totalVentas={totalVentas} />
          <SumatorioDashboard cantidad={totalItemsVendidos} total={totalVentas} textoCantidad="Vendidos" />
        </CajaDashboard>

        <CajaDashboard activa={detalleDashboard === "origen-linea"} onClick={() => seleccionarDetalleDashboard("origen-linea")}>
          <h3>🪑🥡 Pedidos por línea y origen</h3>
          <MiniBarra label="Restaurante en mesa" valor={dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.total} total={totalVentas} detalle={`${dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.cantidad} pedidos · ${dinero(dashboardRafa.resumenMesasVsLlevar.mesas.restaurante.total)}`} />
          <MiniBarra label="Restaurante para llevar" valor={dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.total} total={totalVentas} detalle={`${dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.cantidad} pedidos · ${dinero(dashboardRafa.resumenMesasVsLlevar.llevar.restaurante.total)}`} />
          <MiniBarra label="Cafetería en mesa" valor={dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.total} total={totalVentas} detalle={`${dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.cantidad} pedidos · ${dinero(dashboardRafa.resumenMesasVsLlevar.mesas.cafeteria.total)}`} />
          <MiniBarra label="Cafetería para llevar" valor={dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.total} total={totalVentas} detalle={`${dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.cantidad} pedidos · ${dinero(dashboardRafa.resumenMesasVsLlevar.llevar.cafeteria.total)}`} />
          <SumatorioDashboard cantidad={totalPedidosMesa + totalPedidosLlevar} total={totalVentaMesa + totalVentaLlevar} textoCantidad="Pedidos" />
        </CajaDashboard>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <CajaDashboard activa={detalleDashboard === "horas"} onClick={() => seleccionarDetalleDashboard("horas")}>
          <h3>⏱️ Ventas por hora</h3>
          <ListaDashboard items={dashboardRafa.horas} totalBase={totalBaseHoras || totalVentas} limite={12} textoCantidad="Pedidos" />
        </CajaDashboard>

        <CajaDashboard activa={detalleDashboard === "productos"} onClick={() => seleccionarDetalleDashboard("productos")}>
          <h3>🥇 Top productos</h3>
          <ListaDashboard items={dashboardRafa.productosTop} totalBase={totalBaseProductos || totalItemsVendidos} modo="cantidad" limite={8} textoCantidad="Vendidos" />
        </CajaDashboard>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <CajaDashboard activa={detalleDashboard === "mesas-top"} onClick={() => seleccionarDetalleDashboard("mesas-top")}>
          <h3>🪑 Mesas que más venden</h3>
          <ListaDashboard items={dashboardRafa.mesasTop} totalBase={totalBaseMesas || totalVentas} limite={8} textoCantidad="Pedidos" />
        </CajaDashboard>

        <CajaDashboard activa={detalleDashboard === "meseros"} onClick={() => seleccionarDetalleDashboard("meseros")}>
          <h3>🙋 Ventas por mesero</h3>
          <ListaMeserosDashboard items={dashboardRafa.ventasPorMesero || []} totalBase={Math.max(...(dashboardRafa.ventasPorMesero || []).map((item) => item.total), 0) || totalVentas} limite={8} />
        </CajaDashboard>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <CajaDashboard activa={detalleDashboard === "pagos"} onClick={() => seleccionarDetalleDashboard("pagos")}>
          <h3>💳 Métodos de pago</h3>
          <ListaDashboard items={dashboardRafa.ventasPorPago} totalBase={totalVentas} limite={6} textoCantidad="Pedidos" />
        </CajaDashboard>

        <CajaDashboard activa={detalleDashboard === "origen"} onClick={() => seleccionarDetalleDashboard("origen")}>
          <h3>📍 Origen de pedidos</h3>
          <ListaDashboard items={dashboardRafa.ventasPorOrigen} totalBase={totalVentas} limite={6} textoCantidad="Pedidos" />
        </CajaDashboard>
      </div>

      <DetalleDashboard detalle={crearDetalleDashboardSeleccionado(detalleDashboard)} onCerrar={onCerrarDetalle} detalleRef={detalleDashboardRef} />
    </div>
  );
}
