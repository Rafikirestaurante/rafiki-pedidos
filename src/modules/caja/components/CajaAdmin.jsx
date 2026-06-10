import React, { useEffect, useMemo, useState } from "react";
import { dinero } from "../../../shared/utils/pedidos";
import { cargarCajaArqueoPorFecha, guardarFinCaja, guardarInicioCaja, obtenerFechaCajaHoy } from "../../../services/cajaService";

const DENOMINACIONES = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

const CUENTAS_INICIALES = [
  { id: "bancolombia", nombre: "Bancolombia" },
  { id: "nequi", nombre: "Nequi" },
  { id: "rafa", nombre: "Rafa" },
];

function limpiarNumero(valor) {
  const soloNumeros = String(valor ?? "").replace(/[^0-9]/g, "");
  return soloNumeros ? Number(soloNumeros) : 0;
}

function crearCajaVacia() {
  return {
    billetes: DENOMINACIONES.reduce((acc, denominacion) => {
      acc[denominacion] = "";
      return acc;
    }, {}),
    moneditas: "",
  };
}

function calcularTotalCaja(caja) {
  const totalBilletes = DENOMINACIONES.reduce((total, denominacion) => {
    return total + denominacion * limpiarNumero(caja.billetes?.[denominacion]);
  }, 0);
  return totalBilletes + limpiarNumero(caja.moneditas);
}

function crearEstadoArqueo() {
  return {
    cajaRegistradora: crearCajaVacia(),
    cajaAzul: crearCajaVacia(),
    cuentas: CUENTAS_INICIALES.reduce((acc, cuenta) => {
      acc[cuenta.id] = "";
      return acc;
    }, {}),
  };
}

function totalCuentas(cuentas) {
  return CUENTAS_INICIALES.reduce((total, cuenta) => total + limpiarNumero(cuentas[cuenta.id]), 0);
}

function totalArqueo(estado) {
  return calcularTotalCaja(estado.cajaRegistradora) + calcularTotalCaja(estado.cajaAzul) + totalCuentas(estado.cuentas);
}

function actualizarConteoCaja(setEstado, cajaId, campo, valor) {
  setEstado((actual) => ({
    ...actual,
    [cajaId]: {
      ...actual[cajaId],
      [campo]: valor,
    },
  }));
}

function actualizarBilleteCaja(setEstado, cajaId, denominacion, valor) {
  setEstado((actual) => ({
    ...actual,
    [cajaId]: {
      ...actual[cajaId],
      billetes: {
        ...actual[cajaId].billetes,
        [denominacion]: valor,
      },
    },
  }));
}

function actualizarCuenta(setEstado, cuentaId, valor) {
  setEstado((actual) => ({
    ...actual,
    cuentas: {
      ...actual.cuentas,
      [cuentaId]: valor,
    },
  }));
}

function ResumenArqueo({ titulo, estado }) {
  const totalRegistradora = calcularTotalCaja(estado.cajaRegistradora);
  const totalAzul = calcularTotalCaja(estado.cajaAzul);
  const totalBancos = totalCuentas(estado.cuentas);

  return (
    <section className="summary-cards caja-resumen">
      <article className="summary-card compact">
        <span>{titulo}</span>
        <strong>{dinero(totalArqueo(estado))}</strong>
      </article>
      <article className="summary-card compact">
        <span>Caja registradora</span>
        <strong>{dinero(totalRegistradora)}</strong>
      </article>
      <article className="summary-card compact">
        <span>Caja azul</span>
        <strong>{dinero(totalAzul)}</strong>
      </article>
      <article className="summary-card compact">
        <span>Bancos / cuentas</span>
        <strong>{dinero(totalBancos)}</strong>
      </article>
    </section>
  );
}

function BloqueCaja({ titulo, cajaId, estado, setEstado }) {
  const caja = estado[cajaId];
  const totalCaja = calcularTotalCaja(caja);

  return (
    <section className="card card-pad caja-bloque">
      <div className="section-title-row caja-section-title">
        <div>
          <h3>{titulo}</h3>
          <p className="muted small">Escribe la cantidad de billetes; el valor se calcula automáticamente.</p>
        </div>
        <strong className="caja-total-bloque">{dinero(totalCaja)}</strong>
      </div>

      <div className="caja-denominaciones">
        {DENOMINACIONES.map((denominacion) => {
          const cantidad = caja.billetes[denominacion] ?? "";
          const subtotal = denominacion * limpiarNumero(cantidad);

          return (
            <label className="caja-denominacion-row" key={denominacion}>
              <span>{dinero(denominacion)} x</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={cantidad}
                onChange={(event) => actualizarBilleteCaja(setEstado, cajaId, denominacion, event.target.value)}
                placeholder="0"
              />
              <span>=</span>
              <strong>{dinero(subtotal)}</strong>
            </label>
          );
        })}

        <label className="caja-denominacion-row caja-moneditas-row">
          <span>Moneditas</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={caja.moneditas}
            onChange={(event) => actualizarConteoCaja(setEstado, cajaId, "moneditas", event.target.value)}
            placeholder="0"
          />
          <span>=</span>
          <strong>{dinero(limpiarNumero(caja.moneditas))}</strong>
        </label>
      </div>
    </section>
  );
}

function BloqueCuentas({ estado, setEstado }) {
  const totalBancos = totalCuentas(estado.cuentas);

  return (
    <section className="card card-pad caja-bloque">
      <div className="section-title-row caja-section-title">
        <div>
          <h3>Bancos / cuentas</h3>
          <p className="muted small">Registra el saldo visible al momento del conteo.</p>
        </div>
        <strong className="caja-total-bloque">{dinero(totalBancos)}</strong>
      </div>

      <div className="caja-cuentas-grid">
        {CUENTAS_INICIALES.map((cuenta) => (
          <label className="field" key={cuenta.id}>
            <span>{cuenta.nombre}</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={estado.cuentas[cuenta.id]}
              onChange={(event) => actualizarCuenta(setEstado, cuenta.id, event.target.value)}
              placeholder="0"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function FormularioArqueo({ titulo, descripcion, estado, setEstado, totalLabel, guardando, onGuardar }) {
  return (
    <div className="caja-formulario">
      <section className="card card-pad caja-intro">
        <h2>{titulo}</h2>
        <p className="muted">{descripcion}</p>
      </section>

      <ResumenArqueo titulo={totalLabel} estado={estado} />

      <div className="caja-grid-principal">
        <BloqueCaja titulo="Caja Registradora" cajaId="cajaRegistradora" estado={estado} setEstado={setEstado} />
        <BloqueCaja titulo="Caja Azul" cajaId="cajaAzul" estado={estado} setEstado={setEstado} />
      </div>

      <BloqueCuentas estado={estado} setEstado={setEstado} />

      <div className="caja-actions">
        <button type="button" className="btn primary" onClick={onGuardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export default function CajaAdmin() {
  const [tabCaja, setTabCaja] = useState("inicio");
  const [fechaCaja] = useState(() => obtenerFechaCajaHoy());
  const [inicioDia, setInicioDia] = useState(() => crearEstadoArqueo());
  const [finDia, setFinDia] = useState(() => crearEstadoArqueo());
  const [cargando, setCargando] = useState(true);
  const [guardandoInicio, setGuardandoInicio] = useState(false);
  const [guardandoFin, setGuardandoFin] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const totalInicio = useMemo(() => totalArqueo(inicioDia), [inicioDia]);
  const totalFin = useMemo(() => totalArqueo(finDia), [finDia]);
  const diferenciaPreliminar = useMemo(() => totalFin - totalInicio, [totalFin, totalInicio]);

  useEffect(() => {
    let activo = true;

    async function cargarArqueo() {
      setCargando(true);
      setError("");
      try {
        const registro = await cargarCajaArqueoPorFecha(fechaCaja);
        if (!activo || !registro) return;
        if (registro.inicioData) setInicioDia(registro.inicioData);
        if (registro.finData) setFinDia(registro.finData);
      } catch (err) {
        if (activo) setError(err?.message || "No se pudo cargar la caja del día.");
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarArqueo();
    return () => {
      activo = false;
    };
  }, [fechaCaja]);

  async function guardarInicio() {
    setGuardandoInicio(true);
    setMensaje("");
    setError("");
    try {
      await guardarInicioCaja({ fecha: fechaCaja, estado: inicioDia, total: totalInicio });
      setMensaje("Inicio del día guardado correctamente.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar el inicio del día.");
    } finally {
      setGuardandoInicio(false);
    }
  }

  async function guardarFin() {
    setGuardandoFin(true);
    setMensaje("");
    setError("");
    try {
      await guardarFinCaja({ fecha: fechaCaja, estado: finDia, total: totalFin });
      setMensaje("Fin del día guardado correctamente.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar el fin del día.");
    } finally {
      setGuardandoFin(false);
    }
  }

  return (
    <section className="caja-admin">
      <div className="card card-pad caja-header">
        <div>
          <h2>💵 Caja</h2>
          <p className="muted">
            Arqueo diario para contar Caja Registradora, Caja Azul y saldos de Bancolombia, Nequi y Rafa.
          </p>
          <p className="muted small">Fecha de caja: {fechaCaja}</p>
        </div>
      </div>

      {mensaje && <div className="alert alert-success caja-alert">{mensaje}</div>}
      {error && <div className="alert alert-error caja-alert">{error}</div>}
      {cargando && <div className="card card-pad muted small">Cargando caja guardada del día...</div>}

      <div className="admin-tabs caja-tabs">
        <button type="button" className={tabCaja === "inicio" ? "active" : ""} onClick={() => setTabCaja("inicio")}>
          Inicio del día
        </button>
        <button type="button" className={tabCaja === "fin" ? "active" : ""} onClick={() => setTabCaja("fin")}>
          Fin del día
        </button>
        <button type="button" className={tabCaja === "cuadre" ? "active" : ""} onClick={() => setTabCaja("cuadre")}>
          Cuadre preliminar
        </button>
      </div>

      {tabCaja === "inicio" && (
        <FormularioArqueo
          titulo="Inicio del día"
          descripcion="Registra la base inicial antes de empezar la operación y guárdala en Supabase para evitar perder el conteo."
          estado={inicioDia}
          setEstado={setInicioDia}
          totalLabel="Total inicio del día"
          guardando={guardandoInicio}
          onGuardar={guardarInicio}
        />
      )}

      {tabCaja === "fin" && (
        <FormularioArqueo
          titulo="Fin del día"
          descripcion="Vuelve a contar cajas y cuentas al cierre y guarda el arqueo final del día en Supabase."
          estado={finDia}
          setEstado={setFinDia}
          totalLabel="Total fin del día"
          guardando={guardandoFin}
          onGuardar={guardarFin}
        />
      )}

      {tabCaja === "cuadre" && (
        <section className="card card-pad caja-cuadre-card">
          <h2>Cuadre preliminar</h2>
          <p className="muted">
            Esta pantalla queda preparada para conectar ventas, gastos y cierre definitivo en la siguiente etapa.
          </p>
          <div className="summary-cards caja-resumen">
            <article className="summary-card compact">
              <span>Diferencia preliminar</span>
              <strong>{dinero(diferenciaPreliminar)}</strong>
            </article>
          </div>
          <p className="muted small">
            Por ahora compara fin del día contra inicio del día guardados en Supabase. En 26E se conectan ventas y gastos.
          </p>
        </section>
      )}
    </section>
  );
}
