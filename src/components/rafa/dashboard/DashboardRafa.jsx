import React from "react";
import { dinero } from "../../../utils/pedidos";

function MiniBarra({ label, valor, total, detalle }) {
  const porcentaje = total > 0 ? Math.max(4, Math.round(((Number(valor) || 0) * 100) / total)) : 0;

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

export default function DashboardRafa({
  dashboardRafa,
  resumenVentas,
  totalVentas,
  totalItemsVendidos,
  totalBaseHoras,
  totalBaseProductos,
  totalBaseMesas,
  mostrarTablasDashboard,
  detalleDashboard,
  detalleDashboardRef,
  alternarTablasDashboard,
  seleccionarDetalleDashboard,
  crearDetalleDashboardSeleccionado,
  onCerrarDetalle
}) {
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

          <DetalleDashboard detalle={crearDetalleDashboardSeleccionado(detalleDashboard)} onCerrar={onCerrarDetalle} detalleRef={detalleDashboardRef} />
        </>
      )}
    </div>
  );
}
