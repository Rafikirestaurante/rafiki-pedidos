import React, { useEffect, useMemo, useState } from "react";
import { dinero } from "../../../shared/utils/pedidos";
import { cargarCajaArqueoPorFecha, cargarCuadreRealCaja, cargarHistorialArqueosCaja, guardarFinCaja, guardarInicioCaja, obtenerFechaCajaHoy } from "../../../services/cajaService";

const DENOMINACIONES = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
const CUENTAS_INICIALES = [
  { id: "bancolombia", nombre: "Bancolombia" },
  { id: "nequi", nombre: "Nequi" },
  { id: "rafa", nombre: "Rafa" },
  { id: "datafono", nombre: "Datafono" },
];

function limpiarNumero(valor) {
  const soloNumeros = String(valor ?? "").replace(/[^0-9]/g, "");
  return soloNumeros ? Number(soloNumeros) : 0;
}

function formatearFechaHoraColombia(valor) {
  if (!valor) return "Sin hora";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(valor));
  } catch {
    return String(valor);
  }
}

function descargarArchivo(nombreArchivo, contenido, tipo = "text/plain;charset=utf-8") {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function textoCsv(valor) {
  const texto = String(valor ?? "").replace(/"/g, '""');
  return `"${texto}"`;
}

function crearCajaVacia() {
  return {
    billetes: DENOMINACIONES.reduce((acc, denominacion) => ({ ...acc, [denominacion]: "" }), {}),
    moneditas: "",
  };
}

function calcularTotalCaja(caja) {
  const totalBilletes = DENOMINACIONES.reduce((total, denominacion) => total + denominacion * limpiarNumero(caja.billetes?.[denominacion]), 0);
  return totalBilletes + limpiarNumero(caja.moneditas);
}

function crearEstadoArqueo() {
  return {
    cajaRegistradora: crearCajaVacia(),
    cajaAzul: crearCajaVacia(),
    cuentas: CUENTAS_INICIALES.reduce((acc, cuenta) => ({ ...acc, [cuenta.id]: "" }), {}),
  };
}

function normalizarEstadoArqueo(estado) {
  const base = crearEstadoArqueo();
  if (!estado || typeof estado !== "object") return base;

  return {
    cajaRegistradora: {
      ...base.cajaRegistradora,
      ...(estado.cajaRegistradora || {}),
      billetes: { ...base.cajaRegistradora.billetes, ...(estado.cajaRegistradora?.billetes || {}) },
    },
    cajaAzul: {
      ...base.cajaAzul,
      ...(estado.cajaAzul || {}),
      billetes: { ...base.cajaAzul.billetes, ...(estado.cajaAzul?.billetes || {}) },
    },
    cuentas: { ...base.cuentas, ...(estado.cuentas || {}) },
  };
}

function totalCuentas(cuentas) {
  return CUENTAS_INICIALES.reduce((total, cuenta) => total + limpiarNumero(cuentas[cuenta.id]), 0);
}

function totalArqueo(estado) {
  return calcularTotalCaja(estado.cajaRegistradora) + calcularTotalCaja(estado.cajaAzul) + totalCuentas(estado.cuentas);
}

function actualizarConteoCaja(setEstado, cajaId, campo, valor) {
  setEstado((actual) => ({ ...actual, [cajaId]: { ...actual[cajaId], [campo]: valor } }));
}

function actualizarBilleteCaja(setEstado, cajaId, denominacion, valor) {
  setEstado((actual) => ({
    ...actual,
    [cajaId]: { ...actual[cajaId], billetes: { ...actual[cajaId].billetes, [denominacion]: valor } },
  }));
}

function actualizarCuenta(setEstado, cuentaId, valor) {
  setEstado((actual) => ({ ...actual, cuentas: { ...actual.cuentas, [cuentaId]: valor } }));
}

function BloqueCaja({ titulo, cajaId, estado, setEstado }) {
  const caja = estado[cajaId];
  return (
    <section className="card card-pad caja-bloque">
      <div className="section-title-row caja-section-title">
        <div><h3>{titulo}</h3><p className="muted small">Escribe la cantidad de billetes; el valor se calcula automáticamente.</p></div>
        <strong className="caja-total-bloque">{dinero(calcularTotalCaja(caja))}</strong>
      </div>
      <div className="caja-denominaciones">
        {DENOMINACIONES.map((denominacion) => {
          const cantidad = caja.billetes[denominacion] ?? "";
          const subtotal = denominacion * limpiarNumero(cantidad);
          return (
            <label className="caja-denominacion-row" key={denominacion}>
              <span>{dinero(denominacion)} x</span>
              <input type="number" min="0" inputMode="numeric" value={cantidad} onChange={(event) => actualizarBilleteCaja(setEstado, cajaId, denominacion, event.target.value)} placeholder="0" />
              <span>=</span>
              <strong>{dinero(subtotal)}</strong>
            </label>
          );
        })}
        <label className="caja-denominacion-row caja-moneditas-row">
          <span>Moneditas</span>
          <input type="number" min="0" inputMode="numeric" value={caja.moneditas} onChange={(event) => actualizarConteoCaja(setEstado, cajaId, "moneditas", event.target.value)} placeholder="0" />
          <span>=</span>
          <strong>{dinero(limpiarNumero(caja.moneditas))}</strong>
        </label>
      </div>
    </section>
  );
}

function BloqueCuentas({ estado, setEstado }) {
  return (
    <section className="card card-pad caja-bloque">
      <div className="section-title-row caja-section-title">
        <div><h3>Bancos / cuentas</h3><p className="muted small">Registra el saldo visible al momento del conteo.</p></div>
        <strong className="caja-total-bloque">{dinero(totalCuentas(estado.cuentas))}</strong>
      </div>
      <div className="caja-cuentas-grid">
        {CUENTAS_INICIALES.map((cuenta) => (
          <label className="field" key={cuenta.id}>
            <span>{cuenta.nombre}</span>
            <input type="number" min="0" inputMode="numeric" value={estado.cuentas[cuenta.id] ?? ""} onChange={(event) => actualizarCuenta(setEstado, cuenta.id, event.target.value)} placeholder="0" />
          </label>
        ))}
      </div>
    </section>
  );
}

function FormularioArqueo({ titulo, descripcion, estado, setEstado, guardando, onGuardar }) {
  return (
    <div className="caja-formulario">
      <section className="card card-pad caja-intro"><h2>{titulo}</h2><p className="muted">{descripcion}</p></section>
      <div className="caja-grid-principal">
        <BloqueCaja titulo="Caja Registradora" cajaId="cajaRegistradora" estado={estado} setEstado={setEstado} />
        <BloqueCaja titulo="Caja Azul" cajaId="cajaAzul" estado={estado} setEstado={setEstado} />
      </div>
      <BloqueCuentas estado={estado} setEstado={setEstado} />
      <div className="caja-actions"><button type="button" className="btn primary" onClick={onGuardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button></div>
    </div>
  );
}

function estadoDiferenciaCaja(diferencia) {
  if (Math.abs(Number(diferencia || 0)) < 1) return { texto: "Cuadrado", clase: "ok", etiqueta: "Diferencia" };
  if (Number(diferencia || 0) > 0) return { texto: "Sobra dinero", clase: "warning", etiqueta: "Sobra dinero" };
  return { texto: "Falta dinero", clase: "danger", etiqueta: "Falta dinero" };
}

function FilaInforme({ etiqueta, valor, fuerte = false, estado = "" }) {
  return <div className={`caja-informe-row ${fuerte ? "fuerte" : ""} ${estado ? `caja-informe-${estado}` : ""}`}><span>{etiqueta}</span><strong>{dinero(valor)}</strong></div>;
}

function DetalleGastos({ gastos = [], total }) {
  return (
    <section className="caja-informe-bloque">
      <FilaInforme etiqueta="Gastos del día" valor={total} fuerte />
      {gastos.length ? gastos.map((gasto) => (
        <div className="caja-gasto-detalle-row caja-gasto-detalle-sub" key={gasto.id || `${gasto.proveedor}-${gasto.valor}-${gasto.creadoEn}`}>
          <div>
            <strong>{gasto.proveedor || "Sin proveedor"}</strong>
            {(gasto.categoria || gasto.articulos) && <span>{[gasto.categoria, gasto.articulos].filter(Boolean).join(" · ")}</span>}
          </div>
          <strong>{dinero(gasto.valor)}</strong>
        </div>
      )) : <p className="muted small caja-sin-movimientos">Sin gastos registrados para esta fecha.</p>}
    </section>
  );
}

function HistorialArqueos({ historial = [] }) {
  return (
    <section className="caja-informe-bloque caja-historial-arqueos">
      <div className="caja-informe-row fuerte"><span>Arqueos realizados</span><strong>{historial.length}</strong></div>
      {historial.length ? historial.map((arqueo, index) => (
        <div className="caja-arqueo-historial-row" key={arqueo.id || `${arqueo.creadoEn}-${index}`}>
          <div>
            <strong>{index === 0 ? "Último arqueo" : `Arqueo ${historial.length - index}`}</strong>
            <span>{formatearFechaHoraColombia(arqueo.creadoEn)}</span>
          </div>
          <strong>{dinero(arqueo.arqueoTotal)}</strong>
        </div>
      )) : <p className="muted small caja-sin-movimientos">Sin arqueos guardados para esta fecha.</p>}
    </section>
  );
}

export default function CajaAdmin() {
  const [tabCaja, setTabCaja] = useState("inicio");
  const [fechaCaja, setFechaCaja] = useState(() => obtenerFechaCajaHoy());
  const [inicioDia, setInicioDia] = useState(() => crearEstadoArqueo());
  const [finDia, setFinDia] = useState(() => crearEstadoArqueo());
  const [cargando, setCargando] = useState(true);
  const [guardandoInicio, setGuardandoInicio] = useState(false);
  const [guardandoFin, setGuardandoFin] = useState(false);
  const [cuadreReal, setCuadreReal] = useState(null);
  const [historialArqueos, setHistorialArqueos] = useState([]);
  const [cargandoCuadre, setCargandoCuadre] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const totalInicio = useMemo(() => totalArqueo(inicioDia), [inicioDia]);
  const totalFin = useMemo(() => totalArqueo(finDia), [finDia]);
  const ventasTotal = useMemo(() => Number(cuadreReal?.ventasTotal || 0), [cuadreReal]);
  const gastosTotal = useMemo(() => Number(cuadreReal?.gastosTotal || 0), [cuadreReal]);
  const dineroEsperado = useMemo(() => totalInicio + ventasTotal - gastosTotal, [totalInicio, ventasTotal, gastosTotal]);
  const diferenciaReal = useMemo(() => totalFin - dineroEsperado, [totalFin, dineroEsperado]);
  const estadoDiferencia = useMemo(() => estadoDiferenciaCaja(diferenciaReal), [diferenciaReal]);

  useEffect(() => {
    let activo = true;
    async function cargarArqueo() {
      setCargando(true); setError(""); setMensaje("");
      setInicioDia(crearEstadoArqueo()); setFinDia(crearEstadoArqueo());
      try {
        const registro = await cargarCajaArqueoPorFecha(fechaCaja);
        if (!activo) return;
        if (registro?.inicioData) setInicioDia(normalizarEstadoArqueo(registro.inicioData));
        if (registro?.finData) setFinDia(normalizarEstadoArqueo(registro.finData));
      } catch (err) {
        if (activo) setError(err?.message || "No se pudo cargar la caja de la fecha seleccionada.");
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargarArqueo();
    return () => { activo = false; };
  }, [fechaCaja]);

  useEffect(() => {
    let activo = true;
    async function cargarDatosCuadre() {
      setCargandoCuadre(true);
      try {
        const [resumen, historial] = await Promise.all([
          cargarCuadreRealCaja(fechaCaja),
          cargarHistorialArqueosCaja(fechaCaja),
        ]);
        if (activo) {
          setCuadreReal(resumen);
          setHistorialArqueos(historial);
        }
      } catch (err) {
        if (activo) setError((prev) => prev || err?.message || "No se pudieron cargar ventas, gastos o arqueos del día.");
      } finally {
        if (activo) setCargandoCuadre(false);
      }
    }
    cargarDatosCuadre();
    return () => { activo = false; };
  }, [fechaCaja]);

  async function guardarInicio() {
    setGuardandoInicio(true); setMensaje(""); setError("");
    try { await guardarInicioCaja({ fecha: fechaCaja, estado: inicioDia, total: totalInicio }); setMensaje("Inicio del día guardado correctamente."); }
    catch (err) { setError(err?.message || "No se pudo guardar el inicio del día."); }
    finally { setGuardandoInicio(false); }
  }

  async function guardarFin() {
    setGuardandoFin(true); setMensaje(""); setError("");
    try {
      await guardarFinCaja({ fecha: fechaCaja, estado: finDia, total: totalFin });
      setMensaje("Arqueo guardado correctamente.");
      const historial = await cargarHistorialArqueosCaja(fechaCaja);
      setHistorialArqueos(historial);
    }
    catch (err) { setError(err?.message || "No se pudo guardar el arqueo."); }
    finally { setGuardandoFin(false); }
  }

  function construirTextoInformeCaja() {
    const lineas = [
      `*Informe Caja Rafiki*`,
      `Fecha: ${fechaCaja}`,
      "",
      `Inicio del día: ${dinero(totalInicio)}`,
      `Ventas del día (${cuadreReal?.pedidosCantidad || 0} pedidos): ${dinero(ventasTotal)}`,
      `Gastos del día: ${dinero(gastosTotal)}`,
    ];

    const gastos = cuadreReal?.gastosDetalle || [];
    if (gastos.length) {
      lineas.push("", "*Detalle gastos*");
      gastos.forEach((gasto) => {
        lineas.push(`- ${gasto.proveedor || "Sin proveedor"}: ${dinero(gasto.valor)}`);
      });
    }

    lineas.push(
      "",
      `Dinero esperado: ${dinero(dineroEsperado)}`,
      `Arqueo contado: ${dinero(totalFin)}`,
      `${estadoDiferencia.etiqueta}: ${dinero(Math.abs(diferenciaReal))}`,
    );

    if (historialArqueos.length) {
      lineas.push("", "*Arqueos realizados*");
      historialArqueos.forEach((arqueo, index) => {
        lineas.push(`- ${index === 0 ? "Último arqueo" : `Arqueo ${historialArqueos.length - index}`}: ${formatearFechaHoraColombia(arqueo.creadoEn)} · ${dinero(arqueo.arqueoTotal)}`);
      });
    }

    return lineas.join("\n");
  }

  function compartirInformeWhatsApp() {
    const texto = construirTextoInformeCaja();
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function exportarInformeExcel() {
    const filas = [
      ["Informe Caja Rafiki", ""],
      ["Fecha", fechaCaja],
      ["", ""],
      ["Concepto", "Valor"],
      ["Inicio del día", totalInicio],
      [`Ventas del día (${cuadreReal?.pedidosCantidad || 0} pedidos)`, ventasTotal],
      ["Gastos del día", gastosTotal],
      ["Dinero esperado", dineroEsperado],
      ["Arqueo contado", totalFin],
      [estadoDiferencia.etiqueta, Math.abs(diferenciaReal)],
      ["", ""],
      ["Detalle gastos", ""],
      ["Proveedor", "Valor", "Categoría / artículos"],
      ...((cuadreReal?.gastosDetalle || []).map((gasto) => [gasto.proveedor || "Sin proveedor", gasto.valor, [gasto.categoria, gasto.articulos].filter(Boolean).join(" · ")])),
      ["", ""],
      ["Arqueos realizados", ""],
      ["Fecha y hora", "Valor"],
      ...historialArqueos.map((arqueo) => [formatearFechaHoraColombia(arqueo.creadoEn), arqueo.arqueoTotal]),
    ];

    const csv = filas.map((fila) => fila.map(textoCsv).join(";")).join("\n");
    descargarArchivo(`informe-caja-${fechaCaja}.csv`, `\ufeff${csv}`, "text/csv;charset=utf-8");
  }

  return (
    <section className="caja-admin">
      <div className="card card-pad caja-header">
        <div>
          <h2>💵 Caja</h2>
          <p className="muted">Arqueo para controlar Caja Registradora, Caja Azul y saldos de Bancolombia, Nequi, Rafa y Datafono.</p>
        </div>
        <label className="field caja-fecha-field">
          <span>Fecha</span>
          <input type="date" value={fechaCaja} onChange={(event) => setFechaCaja(event.target.value || obtenerFechaCajaHoy())} />
        </label>
      </div>

      {mensaje && <div className="alert alert-success caja-alert">{mensaje}</div>}
      {error && <div className="alert alert-error caja-alert">{error}</div>}
      {cargando && <div className="card card-pad muted small">Cargando caja guardada...</div>}

      <div className="admin-tabs caja-tabs">
        <button type="button" className={tabCaja === "inicio" ? "active" : ""} onClick={() => setTabCaja("inicio")}>Inicio del día</button>
        <button type="button" className={tabCaja === "fin" ? "active" : ""} onClick={() => setTabCaja("fin")}>Arqueo</button>
        <button type="button" className={tabCaja === "informe" ? "active" : ""} onClick={() => setTabCaja("informe")}>Informe Caja</button>
      </div>

      {tabCaja === "inicio" && <FormularioArqueo titulo="Inicio del día" descripcion="Registra la base inicial antes de empezar la operación." estado={inicioDia} setEstado={setInicioDia} guardando={guardandoInicio} onGuardar={guardarInicio} />}
      {tabCaja === "fin" && <FormularioArqueo titulo="Arqueo" descripcion="Cuenta cajas y bancos en cualquier momento del día. Por ahora queda guardado como último arqueo de la fecha." estado={finDia} setEstado={setFinDia} guardando={guardandoFin} onGuardar={guardarFin} />}

      {tabCaja === "informe" && (
        <div className="caja-formulario">
          <section className="card card-pad caja-informe-card">
            <div className="section-title-row caja-section-title caja-informe-title-row">
              <div><h2>Informe Caja</h2><p className="muted">Resumen limpio de ventas, gastos, dinero esperado y arqueos realizados.</p></div>
              <div className="caja-informe-actions">
                {cargandoCuadre && <span className="muted small">Actualizando...</span>}
                <button type="button" className="btn secondary" onClick={compartirInformeWhatsApp}>Compartir WhatsApp</button>
                <button type="button" className="btn secondary" onClick={exportarInformeExcel}>Exportar Excel</button>
              </div>
            </div>
            <div className="caja-informe-lista">
              <FilaInforme etiqueta="Inicio del día" valor={totalInicio} />
              <FilaInforme etiqueta={`Ventas del día (${cuadreReal?.pedidosCantidad || 0} pedidos)`} valor={ventasTotal} />
              <DetalleGastos gastos={cuadreReal?.gastosDetalle || []} total={gastosTotal} />
              <FilaInforme etiqueta="Dinero esperado" valor={dineroEsperado} fuerte />
              <FilaInforme etiqueta="Fin / arqueo contado" valor={totalFin} />
              <HistorialArqueos historial={historialArqueos} />
              <FilaInforme etiqueta={estadoDiferencia.etiqueta} valor={Math.abs(diferenciaReal)} fuerte estado={estadoDiferencia.clase} />
            </div>
            <p className="muted small caja-formula">Fórmula: inicio del día + ventas del día - gastos del día = dinero esperado.</p>
          </section>
        </div>
      )}
    </section>
  );
}
