import React, { useEffect, useMemo, useState } from "react";
import RafikiModal from "../../../shared/components/RafikiModal";
import { dinero } from "../../../shared/utils/pedidos";
import { formatearFechaColombia } from "../../../shared/utils/fechasColombia";
import { describirErrorSupabase, registrarErrorSupabase } from "../../../shared/utils/supabaseErrors";
import { cargarGastosDashboardRango, cargarPedidosDashboardRango } from "../../../services/dashboardService";
import {
  crearResumenVentasMensuales,
  desplazarMes,
  obtenerMesColombia,
  obtenerNivelVentaDia,
  obtenerRangoMesColombia
} from "../utils/ventasMensuales";

function TarjetaMetrica({ etiqueta, valor, ayuda }) {
  return (
    <article className="ventas-mes-metrica">
      <span>{etiqueta}</span>
      <strong>{valor}</strong>
      {ayuda ? <small>{ayuda}</small> : null}
    </article>
  );
}

function CalendarioVentas({ resumen, onSeleccionarDia }) {
  const celdasVacias = Array.from({ length: resumen.offsetInicio }, (_, index) => `vacio-${index}`);

  return (
    <section className="ventas-mes-panel" aria-label={`Calendario de ventas de ${resumen.nombreMes}`}>
      <div className="ventas-mes-panel-heading">
        <div>
          <h4>Calendario de ventas</h4>
          <p>Cada casilla muestra el total vendido y la cantidad de pedidos del día.</p>
        </div>
        <div className="ventas-mes-leyenda" aria-label="Intensidad de ventas">
          <span>Baja</span>
          {[1, 2, 3, 4].map((nivel) => <i key={nivel} className={`nivel-${nivel}`} />)}
          <span>Alta</span>
        </div>
      </div>

      <div className="ventas-calendario-scroll">
        <div className="ventas-calendario">
          {resumen.encabezados.map((dia) => (
            <div key={dia} className="ventas-calendario-dia-semana">{dia}</div>
          ))}

          {celdasVacias.map((clave) => <div key={clave} className="ventas-calendario-vacio" aria-hidden="true" />)}

          {resumen.dias.map((dia) => {
            const nivel = obtenerNivelVentaDia(dia.total, resumen.maximoDiario);
            const esMejorDia = resumen.mejorDia?.fecha === dia.fecha && dia.total > 0;
            return (
              <button
                key={dia.fecha}
                type="button"
                className={`ventas-calendario-celda nivel-${nivel}${esMejorDia ? " es-mejor-dia" : ""}`}
                onClick={() => onSeleccionarDia(dia)}
                aria-label={`${formatearFechaColombia(dia.fecha)}: ${dinero(dia.total)}, ${dia.pedidos} pedidos`}
              >
                <span className="ventas-calendario-numero">{dia.dia}</span>
                {esMejorDia ? <span className="ventas-calendario-mejor">★ Mejor</span> : null}
                <strong>{dinero(dia.total)}</strong>
                <small>{dia.pedidos} {dia.pedidos === 1 ? "pedido" : "pedidos"}</small>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GraficaBarrasVentas({ resumen, onSeleccionarDia }) {
  const maximo = Math.max(resumen.maximoDiario, 1);

  return (
    <section className="ventas-mes-panel" aria-label={`Gráfica de barras de ${resumen.nombreMes}`}>
      <div className="ventas-mes-panel-heading">
        <div>
          <h4>Ventas diarias en barras</h4>
          <p>Compara visualmente los días del mes. Toca una barra para consultar el detalle.</p>
        </div>
      </div>

      <div className="ventas-barras-scroll">
        <div className="ventas-barras" style={{ "--ventas-dias": resumen.dias.length }}>
          {resumen.dias.map((dia) => {
            const altura = dia.total > 0 ? Math.max((dia.total / maximo) * 100, 4) : 0;
            const esMejorDia = resumen.mejorDia?.fecha === dia.fecha && dia.total > 0;
            return (
              <button
                type="button"
                key={dia.fecha}
                className={`ventas-barra-columna${esMejorDia ? " es-mejor-dia" : ""}`}
                onClick={() => onSeleccionarDia(dia)}
                title={`${formatearFechaColombia(dia.fecha)} · ${dinero(dia.total)} · ${dia.pedidos} pedidos`}
              >
                <span className="ventas-barra-valor">{dia.total > 0 ? dinero(dia.total) : ""}</span>
                <span className="ventas-barra-pista">
                  <i style={{ height: `${altura}%` }} />
                </span>
                <strong>{dia.dia}</strong>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DetalleDiaVentas({ dia, onClose, onAbrirInforme }) {
  return (
    <RafikiModal
      open={Boolean(dia)}
      title={dia ? `Ventas del ${formatearFechaColombia(dia.fecha)}` : "Detalle de ventas"}
      description="Resumen comercial del día seleccionado."
      onClose={onClose}
      size="sm"
      className="ventas-dia-modal"
      footer={(
        <>
          <button type="button" className="button-secondary" onClick={onClose}>Cerrar</button>
          <button type="button" className="button" onClick={() => onAbrirInforme(dia?.fecha)}>
            Abrir informe del día
          </button>
        </>
      )}
    >
      {dia ? (
        <div className="ventas-dia-detalle">
          <div className="ventas-dia-destacado">
            <span>Total vendido</span>
            <strong>{dinero(dia.total)}</strong>
          </div>
          <div className="ventas-dia-resumen-grid">
            <div><span>Total de gastos</span><strong>{dinero(dia.gastos)}</strong></div>
            <div><span>Resultado ventas - gastos</span><strong>{dinero(dia.resultado)}</strong></div>
            <div><span>Pedidos</span><strong>{dia.pedidos}</strong></div>
            <div><span>Ticket promedio</span><strong>{dinero(dia.ticketPromedio)}</strong></div>
          </div>
          {dia.pedidos === 0 && dia.gastos === 0 ? (
            <p className="muted">Este día no tiene ventas ni gastos registrados.</p>
          ) : null}
        </div>
      ) : null}
    </RafikiModal>
  );
}

export default function VentasMensualesDashboard({ onSeleccionarDia }) {
  const mesActual = obtenerMesColombia();
  const [mes, setMes] = useState(mesActual);
  const [pedidos, setPedidos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("ambos");
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarVentasMes() {
      setCargando(true);
      setError("");
      const rango = obtenerRangoMesColombia(mes);

      try {
        const [resultadoPedidos, resultadoGastos] = await Promise.allSettled([
          cargarPedidosDashboardRango(rango.inicio, rango.fin),
          cargarGastosDashboardRango(rango.inicioTexto, rango.finTexto)
        ]);
        if (cancelado) return;

        const mensajes = [];

        if (resultadoPedidos.status === "fulfilled") {
          const { data, error: errorConsulta, completo = true, advertencia = "" } = resultadoPedidos.value;
          if (errorConsulta) {
            registrarErrorSupabase("cargar calendario mensual de ventas", errorConsulta);
            setPedidos([]);
            mensajes.push(describirErrorSupabase(errorConsulta, "cargar las ventas mensuales"));
          } else {
            setPedidos(data || []);
            if (!completo && advertencia) mensajes.push(advertencia);
          }
        } else {
          registrarErrorSupabase("cargar calendario mensual de ventas", resultadoPedidos.reason);
          setPedidos([]);
          mensajes.push(describirErrorSupabase(resultadoPedidos.reason, "cargar las ventas mensuales"));
        }

        if (resultadoGastos.status === "fulfilled") {
          setGastos(resultadoGastos.value || []);
        } else {
          registrarErrorSupabase("cargar gastos mensuales del dashboard", resultadoGastos.reason);
          setGastos([]);
          mensajes.push(describirErrorSupabase(resultadoGastos.reason, "cargar los gastos mensuales"));
        }

        setError(mensajes.join(" "));
      } catch (errorCarga) {
        if (!cancelado) {
          registrarErrorSupabase("cargar calendario mensual de ventas y gastos", errorCarga);
          setPedidos([]);
          setGastos([]);
          setError(describirErrorSupabase(errorCarga, "cargar las ventas y gastos mensuales"));
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarVentasMes();
    return () => { cancelado = true; };
  }, [mes]);

  const resumen = useMemo(() => crearResumenVentasMensuales(pedidos, gastos, mes), [pedidos, gastos, mes]);

  function abrirInformeDia(fecha) {
    setDiaSeleccionado(null);
    onSeleccionarDia?.(fecha);
  }

  return (
    <section className="ventas-mes-dashboard">
      <div className="ventas-mes-header">
        <div>
          <span className="ventas-mes-kicker">Fase 36B.1</span>
          <h3>📅 Ventas del mes</h3>
          <p>Calendario y comparativo diario de ventas válidas, con los gastos registrados del mes.</p>
        </div>
        <div className="ventas-mes-navegacion">
          <button type="button" className="mini-btn" onClick={() => setMes((actual) => desplazarMes(actual, -1))} aria-label="Mes anterior">‹</button>
          <strong>{resumen.nombreMes}</strong>
          <button type="button" className="mini-btn" onClick={() => setMes((actual) => desplazarMes(actual, 1))} aria-label="Mes siguiente">›</button>
          {mes !== mesActual ? (
            <button type="button" className="button-secondary ventas-mes-actual" onClick={() => setMes(mesActual)}>Mes actual</button>
          ) : null}
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {cargando ? <div className="alert alert-info">Cargando ventas de {resumen.nombreMes}...</div> : null}

      <div className="ventas-mes-metricas">
        <TarjetaMetrica etiqueta="Ventas del mes" valor={dinero(resumen.totalMes)} ayuda={`${resumen.diasConVenta} días con ventas`} />
        <TarjetaMetrica etiqueta="Gastos del mes" valor={dinero(resumen.totalGastos)} ayuda={`Resultado ${dinero(resumen.resultadoMes)}`} />
        <TarjetaMetrica etiqueta="Promedio diario" valor={dinero(resumen.promedioDiario)} ayuda="Sobre días con ventas" />
        <TarjetaMetrica
          etiqueta="Mejor día"
          valor={resumen.mejorDia ? dinero(resumen.mejorDia.total) : dinero(0)}
          ayuda={resumen.mejorDia ? formatearFechaColombia(resumen.mejorDia.fecha) : "Sin ventas"}
        />
        <TarjetaMetrica etiqueta="Pedidos del mes" valor={resumen.totalPedidos} ayuda={`Ticket promedio ${dinero(resumen.ticketPromedio)}`} />
      </div>

      <div className="ventas-mes-selector" role="group" aria-label="Vista del informe mensual">
        <button type="button" className={vista === "calendario" ? "active" : ""} onClick={() => setVista("calendario")}>Calendario</button>
        <button type="button" className={vista === "barras" ? "active" : ""} onClick={() => setVista("barras")}>Barras</button>
        <button type="button" className={vista === "ambos" ? "active" : ""} onClick={() => setVista("ambos")}>Ambos</button>
      </div>

      {!cargando && resumen.totalPedidos === 0 ? (
        <div className="ventas-mes-vacio">
          <strong>No hay ventas registradas en {resumen.nombreMes}.</strong>
          <span>Puedes navegar a otro mes usando las flechas.</span>
        </div>
      ) : null}

      {(vista === "calendario" || vista === "ambos") ? (
        <CalendarioVentas resumen={resumen} onSeleccionarDia={setDiaSeleccionado} />
      ) : null}

      {(vista === "barras" || vista === "ambos") ? (
        <GraficaBarrasVentas resumen={resumen} onSeleccionarDia={setDiaSeleccionado} />
      ) : null}

      <p className="ventas-mes-nota">
        Se excluyen pedidos borrados. El total de gastos se toma de los gastos diarios registrados para cada fecha.
      </p>

      <DetalleDiaVentas
        dia={diaSeleccionado}
        onClose={() => setDiaSeleccionado(null)}
        onAbrirInforme={abrirInformeDia}
      />
    </section>
  );
}
