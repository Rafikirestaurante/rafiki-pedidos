import React, { useEffect, useMemo, useState } from "react";
import { dinero } from "../../../shared/utils/pedidos";
import { cargarCajaArqueoPorFecha, cargarCuadreRealCaja, cargarHistorialArqueosCaja, cargarUltimoArqueoDiaAnterior, guardarAjustesCaja, guardarArqueoHistorialCaja, guardarFinCaja, guardarInicioCaja, limpiarUltimoArqueoCaja, obtenerFechaCajaHoy } from "../../../services/cajaService";

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
    paquetes: "",
  };
}

function calcularTotalCaja(caja) {
  const totalBilletes = DENOMINACIONES.reduce((total, denominacion) => total + denominacion * limpiarNumero(caja.billetes?.[denominacion]), 0);
  return totalBilletes + limpiarNumero(caja.moneditas) + limpiarNumero(caja.paquetes);
}

function crearAjustesCajaVacios() {
  return {
    gastosRafa: "",
    cuentasPorCobrar: "",
  };
}

function normalizarAjustesCaja(ajustes) {
  const base = crearAjustesCajaVacios();
  if (!ajustes || typeof ajustes !== "object") return base;
  return {
    ...base,
    gastosRafa: ajustes.gastosRafa ?? ajustes.gastos_rafa ?? "",
    cuentasPorCobrar: ajustes.cuentasPorCobrar ?? ajustes.cuentas_por_cobrar ?? "",
  };
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

function obtenerSaldosArqueo(estado) {
  const arqueo = normalizarEstadoArqueo(estado);
  return {
    cajaRegistradora: calcularTotalCaja(arqueo.cajaRegistradora),
    cajaAzul: calcularTotalCaja(arqueo.cajaAzul),
    bancolombia: limpiarNumero(arqueo.cuentas.bancolombia),
    nequi: limpiarNumero(arqueo.cuentas.nequi),
    rafa: limpiarNumero(arqueo.cuentas.rafa),
    datafono: limpiarNumero(arqueo.cuentas.datafono),
  };
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
        <label className="caja-denominacion-row caja-moneditas-row">
          <span>Paquetes</span>
          <input type="number" min="0" inputMode="numeric" value={caja.paquetes} onChange={(event) => actualizarConteoCaja(setEstado, cajaId, "paquetes", event.target.value)} placeholder="0" />
          <span>=</span>
          <strong>{dinero(limpiarNumero(caja.paquetes))}</strong>
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

function FormularioArqueo({ titulo, descripcion, estado, setEstado, guardando, onGuardar, onNuevo, onTraerAnterior, historial }) {
  return (
    <div className="caja-formulario">
      <section className="card card-pad caja-intro"><h2>{titulo}</h2><p className="muted">{descripcion}</p></section>
      <div className="caja-grid-principal">
        <BloqueCaja titulo="Caja Registradora" cajaId="cajaRegistradora" estado={estado} setEstado={setEstado} />
        <BloqueCaja titulo="Caja Azul" cajaId="cajaAzul" estado={estado} setEstado={setEstado} />
      </div>
      <BloqueCuentas estado={estado} setEstado={setEstado} />
      <div className="caja-actions caja-arqueo-actions">
        {onTraerAnterior && <button type="button" className="btn secondary" onClick={onTraerAnterior} disabled={guardando}>Traer último arqueo anterior</button>}
        {onNuevo && <button type="button" className="btn secondary" onClick={onNuevo} disabled={guardando}>Arqueo Nuevo</button>}
        <button type="button" className="btn primary" onClick={onGuardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
      </div>
      {Array.isArray(historial) && <HistorialArqueos historial={historial} titulo="Historial de arqueos" />}
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

function HistorialArqueos({ historial = [], titulo = "Arqueos realizados" }) {
  return (
    <section className="caja-informe-bloque caja-historial-arqueos">
      <div className="caja-informe-row fuerte"><span>{titulo}</span><strong>{historial.length}</strong></div>
      {historial.length ? historial.map((arqueo, index) => {
        const saldos = obtenerSaldosArqueo(arqueo.arqueoData);
        return (
          <div className="caja-arqueo-historial-row" key={arqueo.id || `${arqueo.creadoEn}-${index}`}>
            <div>
              <strong>{index === 0 ? "Último arqueo" : `Arqueo ${historial.length - index}`}</strong>
              <span>{formatearFechaHoraColombia(arqueo.creadoEn)}</span>
              <span>Registradora {dinero(saldos.cajaRegistradora)} · Azul {dinero(saldos.cajaAzul)}</span>
              <span>Bancolombia {dinero(saldos.bancolombia)} · Nequi {dinero(saldos.nequi)} · Rafa {dinero(saldos.rafa)} · Datafono {dinero(saldos.datafono)}</span>
            </div>
            <strong>{dinero(arqueo.arqueoTotal)}</strong>
          </div>
        );
      }) : <p className="muted small caja-sin-movimientos">Sin arqueos guardados para esta fecha.</p>}
    </section>
  );
}

function SaldosUltimoArqueo({ arqueo, respaldo }) {
  const tieneHistorial = Boolean(arqueo?.arqueoData);
  const estado = tieneHistorial ? arqueo.arqueoData : respaldo;
  const saldos = obtenerSaldosArqueo(estado);
  const total = tieneHistorial ? limpiarNumero(arqueo.arqueoTotal) : totalArqueo(estado);

  return (
    <section className="caja-informe-bloque caja-ultimo-arqueo-saldos">
      <div className="caja-informe-row fuerte">
        <span>Saldos último arqueo</span>
        <strong>{dinero(total)}</strong>
      </div>
      {tieneHistorial && <p className="muted small caja-sin-movimientos">Último arqueo: {formatearFechaHoraColombia(arqueo.creadoEn)}</p>}
      <FilaInforme etiqueta="Caja Registradora" valor={saldos.cajaRegistradora} />
      <FilaInforme etiqueta="Caja Azul" valor={saldos.cajaAzul} />
      <FilaInforme etiqueta="Bancolombia" valor={saldos.bancolombia} />
      <FilaInforme etiqueta="Nequi" valor={saldos.nequi} />
      <FilaInforme etiqueta="Rafa" valor={saldos.rafa} />
      <FilaInforme etiqueta="Datafono" valor={saldos.datafono} />
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
  const [guardandoAjustes, setGuardandoAjustes] = useState(false);
  const [cuadreReal, setCuadreReal] = useState(null);
  const [historialArqueos, setHistorialArqueos] = useState([]);
  const [ajustesCaja, setAjustesCaja] = useState(() => crearAjustesCajaVacios());
  const [cargandoCuadre, setCargandoCuadre] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const totalInicio = useMemo(() => totalArqueo(inicioDia), [inicioDia]);
  const totalFin = useMemo(() => totalArqueo(finDia), [finDia]);
  const ventasTotal = useMemo(() => Number(cuadreReal?.ventasTotal || 0), [cuadreReal]);
  const gastosTotal = useMemo(() => Number(cuadreReal?.gastosTotal || 0), [cuadreReal]);
  const gastosRafaTotal = useMemo(() => limpiarNumero(ajustesCaja.gastosRafa), [ajustesCaja.gastosRafa]);
  const cuentasPorCobrarTotal = useMemo(() => limpiarNumero(ajustesCaja.cuentasPorCobrar), [ajustesCaja.cuentasPorCobrar]);
  const dineroEsperado = useMemo(() => totalInicio + ventasTotal - gastosTotal - gastosRafaTotal - cuentasPorCobrarTotal, [totalInicio, ventasTotal, gastosTotal, gastosRafaTotal, cuentasPorCobrarTotal]);
  const totalUltimoArqueoInforme = useMemo(() => {
    if (historialArqueos[0]?.arqueoData) return limpiarNumero(historialArqueos[0].arqueoTotal);
    return totalFin;
  }, [historialArqueos, totalFin]);
  const diferenciaReal = useMemo(() => totalUltimoArqueoInforme - dineroEsperado, [totalUltimoArqueoInforme, dineroEsperado]);
  const estadoDiferencia = useMemo(() => estadoDiferenciaCaja(diferenciaReal), [diferenciaReal]);

  useEffect(() => {
    let activo = true;
    async function cargarArqueo() {
      setCargando(true); setError(""); setMensaje("");
      setInicioDia(crearEstadoArqueo()); setFinDia(crearEstadoArqueo()); setAjustesCaja(crearAjustesCajaVacios());
      try {
        const registro = await cargarCajaArqueoPorFecha(fechaCaja);
        if (!activo) return;
        if (registro?.inicioData) setInicioDia(normalizarEstadoArqueo(registro.inicioData));
        if (registro?.finData) setFinDia(normalizarEstadoArqueo(registro.finData));
        if (registro?.ajustesData) setAjustesCaja(normalizarAjustesCaja(registro.ajustesData));
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

  async function traerUltimoArqueoAnteriorAInicio() {
    setGuardandoInicio(true); setMensaje(""); setError("");
    try {
      const anterior = await cargarUltimoArqueoDiaAnterior(fechaCaja);
      if (!anterior?.estado) {
        setMensaje("No se encontró arqueo del día anterior para traer.");
        return;
      }
      setInicioDia(normalizarEstadoArqueo(anterior.estado));
      setMensaje(`Información del último arqueo anterior cargada desde ${anterior.fecha}. Verifica los valores y luego guarda manualmente el inicio del día.`);
    } catch (err) {
      setError(err?.message || "No se pudo traer el último arqueo del día anterior.");
    } finally {
      setGuardandoInicio(false);
    }
  }

  async function guardarFin() {
    setGuardandoFin(true); setMensaje(""); setError("");
    try {
      await guardarFinCaja({ fecha: fechaCaja, estado: finDia, total: totalFin });
      setMensaje("Arqueo guardado correctamente como último conteo.");
    }
    catch (err) { setError(err?.message || "No se pudo guardar el arqueo."); }
    finally { setGuardandoFin(false); }
  }

  async function iniciarArqueoNuevo() {
    setGuardandoFin(true); setMensaje(""); setError("");
    try {
      if (totalFin > 0) {
        await guardarArqueoHistorialCaja({ fecha: fechaCaja, estado: finDia, total: totalFin });
      }
      await limpiarUltimoArqueoCaja({ fecha: fechaCaja });
      setFinDia(crearEstadoArqueo());
      const historial = await cargarHistorialArqueosCaja(fechaCaja);
      setHistorialArqueos(historial);
      setMensaje(totalFin > 0 ? "Último arqueo archivado. Ya puedes iniciar un arqueo nuevo." : "Arqueo limpiado. Ya puedes iniciar un arqueo nuevo.");
    } catch (err) {
      setError(err?.message || "No se pudo iniciar un arqueo nuevo.");
    } finally {
      setGuardandoFin(false);
    }
  }

  function actualizarAjusteCaja(campo, valor) {
    setAjustesCaja((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardarAjustesInformeCaja() {
    setGuardandoAjustes(true); setMensaje(""); setError("");
    try {
      const registro = await guardarAjustesCaja({ fecha: fechaCaja, ajustes: ajustesCaja });
      setAjustesCaja(normalizarAjustesCaja(registro?.ajustesData));
      setMensaje("Ajustes de caja guardados correctamente.");
    } catch (err) {
      setError(err?.message || "No se pudieron guardar los ajustes de caja.");
    } finally {
      setGuardandoAjustes(false);
    }
  }

  function construirTextoInformeCaja() {
    const lineas = [
      `*Informe Caja Rafiki*`,
      `Fecha: ${fechaCaja}`,
      "",
      `Inicio del día: ${dinero(totalInicio)}`,
      `Ventas del día (${cuadreReal?.pedidosCantidad || 0} pedidos): ${dinero(ventasTotal)}`,
      `Gastos operativos: ${dinero(gastosTotal)}`,
      `Gastos Rafa: ${dinero(gastosRafaTotal)}`,
      `Cuentas por cobrar: ${dinero(cuentasPorCobrarTotal)}`,
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
      `Arqueo contado: ${dinero(totalUltimoArqueoInforme)}`,
      `${estadoDiferencia.etiqueta}: ${dinero(Math.abs(diferenciaReal))}`,
    );

    const saldosUltimo = obtenerSaldosArqueo(historialArqueos[0]?.arqueoData || finDia);
    lineas.push(
      "",
      "*Saldos último arqueo*",
      `Caja Registradora: ${dinero(saldosUltimo.cajaRegistradora)}`,
      `Caja Azul: ${dinero(saldosUltimo.cajaAzul)}`,
      `Bancolombia: ${dinero(saldosUltimo.bancolombia)}`,
      `Nequi: ${dinero(saldosUltimo.nequi)}`,
      `Rafa: ${dinero(saldosUltimo.rafa)}`,
      `Datafono: ${dinero(saldosUltimo.datafono)}`,
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
      ["Gastos operativos", gastosTotal],
      ["Gastos Rafa", gastosRafaTotal],
      ["Cuentas por cobrar", cuentasPorCobrarTotal],
      ["Caja esperada", dineroEsperado],
      ["Arqueo contado", totalUltimoArqueoInforme],
      [estadoDiferencia.etiqueta, Math.abs(diferenciaReal)],
      ["", ""],
      ["Saldos último arqueo", ""],
      ["Caja Registradora", obtenerSaldosArqueo(historialArqueos[0]?.arqueoData || finDia).cajaRegistradora],
      ["Caja Azul", obtenerSaldosArqueo(historialArqueos[0]?.arqueoData || finDia).cajaAzul],
      ["Bancolombia", obtenerSaldosArqueo(historialArqueos[0]?.arqueoData || finDia).bancolombia],
      ["Nequi", obtenerSaldosArqueo(historialArqueos[0]?.arqueoData || finDia).nequi],
      ["Rafa", obtenerSaldosArqueo(historialArqueos[0]?.arqueoData || finDia).rafa],
      ["Datafono", obtenerSaldosArqueo(historialArqueos[0]?.arqueoData || finDia).datafono],
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

      {tabCaja === "inicio" && <FormularioArqueo titulo="Inicio del día" descripcion="Registra la base inicial antes de empezar la operación. Puedes traer el último arqueo del día anterior, revisarlo y guardar manualmente." estado={inicioDia} setEstado={setInicioDia} guardando={guardandoInicio} onGuardar={guardarInicio} onTraerAnterior={traerUltimoArqueoAnteriorAInicio} />}
      {tabCaja === "fin" && <FormularioArqueo titulo="Arqueo" descripcion="Cuenta cajas y bancos en cualquier momento del día. Guarda el conteo y usa Arqueo Nuevo para archivarlo y empezar otro desde cero." estado={finDia} setEstado={setFinDia} guardando={guardandoFin} onGuardar={guardarFin} onNuevo={iniciarArqueoNuevo} historial={historialArqueos} />}

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
              <section className="caja-informe-bloque caja-ajustes-bloque">
                <div className="caja-informe-row fuerte"><span>Ajustes de Caja</span><strong>{dinero(gastosRafaTotal + cuentasPorCobrarTotal)}</strong></div>
                <div className="caja-ajustes-grid">
                  <label className="field">
                    <span>Gastos Rafa</span>
                    <input type="number" min="0" inputMode="numeric" value={ajustesCaja.gastosRafa} onChange={(event) => actualizarAjusteCaja("gastosRafa", event.target.value)} placeholder="0" />
                    <small className="muted">Gastos personales o retiros del día. Resta a la caja esperada.</small>
                  </label>
                  <label className="field">
                    <span>Cuentas x Cobrar</span>
                    <input type="number" min="0" inputMode="numeric" value={ajustesCaja.cuentasPorCobrar} onChange={(event) => actualizarAjusteCaja("cuentasPorCobrar", event.target.value)} placeholder="0" />
                    <small className="muted">Ventas reales que aún no han entrado en efectivo/banco. Resta a la caja esperada.</small>
                  </label>
                </div>
                <div className="caja-actions caja-ajustes-actions"><button type="button" className="btn secondary" onClick={guardarAjustesInformeCaja} disabled={guardandoAjustes}>{guardandoAjustes ? "Guardando..." : "Guardar ajustes"}</button></div>
              </section>
              <FilaInforme etiqueta="Caja esperada" valor={dineroEsperado} fuerte />
              <SaldosUltimoArqueo arqueo={historialArqueos[0]} respaldo={finDia} />
              <FilaInforme etiqueta="Fin / arqueo contado" valor={totalUltimoArqueoInforme} />
              <HistorialArqueos historial={historialArqueos} />
              <FilaInforme etiqueta={estadoDiferencia.etiqueta} valor={Math.abs(diferenciaReal)} fuerte estado={estadoDiferencia.clase} />
            </div>
            <p className="muted small caja-formula">Fórmula: inicio del día + ventas reales - gastos operativos - gastos Rafa - cuentas por cobrar = caja esperada.</p>
          </section>
        </div>
      )}
    </section>
  );
}
