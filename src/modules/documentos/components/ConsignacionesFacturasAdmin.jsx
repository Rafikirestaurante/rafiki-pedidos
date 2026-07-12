import React, { useCallback, useEffect, useMemo, useState } from "react";
import RafikiBadge from "../../../shared/components/RafikiBadge.jsx";
import { ConfirmModal } from "../../../shared/components/common.jsx";
import {
  desconectarGmail,
  iniciarConexionGmail,
  obtenerEstadoConexionGmail,
  probarConexionGmail
} from "../../../services/gmailIntegracionService.js";

function fechaHora(valor) {
  if (!valor) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Bogota"
    }).format(new Date(valor));
  } catch {
    return String(valor);
  }
}

export default function ConsignacionesFacturasAdmin() {
  const [estado, setEstado] = useState({ configured: false, connection: null });
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [confirmarDesconexion, setConfirmarDesconexion] = useState(false);

  const conexion = estado.connection;
  const conectada = Boolean(estado.configured && conexion?.status === "connected");

  const estadoVisual = useMemo(() => {
    if (conectada) return { texto: "Conectado", tipo: "success" };
    if (conexion?.status === "error") return { texto: "Requiere atención", tipo: "danger" };
    return { texto: "Sin conectar", tipo: "neutral" };
  }, [conectada, conexion?.status]);

  const cargarEstado = useCallback(async () => {
    setCargando(true);
    try {
      const data = await obtenerEstadoConexionGmail();
      setEstado(data);
    } catch (error) {
      setMensaje(error.message || "No se pudo consultar la conexión con Gmail.");
      setTipoMensaje("danger");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get("gmail");
    const detalle = params.get("gmail_detail") || "";

    if (resultado === "connected") {
      setMensaje("La cuenta de Gmail quedó conectada correctamente.");
      setTipoMensaje("success");
    } else if (resultado === "error") {
      setMensaje(detalle || "Google no pudo completar la conexión con Gmail.");
      setTipoMensaje("danger");
    }

    if (resultado) {
      params.delete("gmail");
      params.delete("gmail_detail");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }

    cargarEstado();
  }, [cargarEstado]);

  async function conectar() {
    setAccion("conectar");
    setMensaje("");
    try {
      const data = await iniciarConexionGmail();
      if (!data.authorization_url) throw new Error("No se recibió la dirección de autorización de Google.");
      window.location.assign(data.authorization_url);
    } catch (error) {
      setMensaje(error.message || "No se pudo iniciar la conexión con Gmail.");
      setTipoMensaje("danger");
      setAccion("");
    }
  }

  async function probar() {
    setAccion("probar");
    setMensaje("");
    try {
      const data = await probarConexionGmail();
      setMensaje(`Conexión confirmada con ${data.google_email || "Gmail"}.`);
      setTipoMensaje("success");
      await cargarEstado();
    } catch (error) {
      setMensaje(error.message || "No se pudo confirmar la conexión con Gmail.");
      setTipoMensaje("danger");
      await cargarEstado();
    } finally {
      setAccion("");
    }
  }

  async function desconectar() {
    setConfirmarDesconexion(false);
    setAccion("desconectar");
    setMensaje("");
    try {
      const data = await desconectarGmail();
      setMensaje(
        data.warning
          ? `La conexión se retiró de Rafiki. Advertencia de Google: ${data.warning}`
          : "La cuenta de Gmail fue desconectada de Rafiki."
      );
      setTipoMensaje(data.warning ? "warning" : "success");
      await cargarEstado();
    } catch (error) {
      setMensaje(error.message || "No se pudo desconectar Gmail.");
      setTipoMensaje("danger");
    } finally {
      setAccion("");
    }
  }

  return (
    <section className="admin-stack consignaciones-facturas-panel">
      <article className="card card-pad">
        <div className="section-title-row">
          <div>
            <h2>Consignaciones y facturas electrónicas</h2>
            <p className="muted">
              Módulo documental para consultar Gmail y verificar movimientos al finalizar el día.
            </p>
          </div>
          <RafikiBadge tipo={estadoVisual.tipo}>{estadoVisual.texto}</RafikiBadge>
        </div>

        {mensaje ? <div className={`alert alert-${tipoMensaje}`}>{mensaje}</div> : null}

        <div className="dashboard-grid" style={{ marginTop: 14 }}>
          <article className="card card-pad soft-card">
            <h3>Cuenta autorizada</h3>
            <p className="muted small">
              {cargando ? "Consultando..." : conexion?.google_email || "Todavía no hay una cuenta conectada."}
            </p>
            <p className="small">
              <strong>Conectada:</strong> {fechaHora(conexion?.connected_at)}
            </p>
            <p className="small">
              <strong>Última prueba:</strong> {fechaHora(conexion?.last_verified_at)}
            </p>
          </article>

          <article className="card card-pad soft-card">
            <h3>Alcance actual</h3>
            <p className="muted small">
              En esta subfase Rafiki solo configura el acceso de lectura. Aún no escanea ni registra correos.
            </p>
            <RafikiBadge tipo="info">Solo lectura</RafikiBadge>
          </article>

          <article className="card card-pad soft-card">
            <h3>Integración financiera</h3>
            <p className="muted small">
              La información futura será independiente y no modificará Caja, Cartera, Gastos ni Pedidos.
            </p>
            <RafikiBadge tipo="neutral">Sin integración automática</RafikiBadge>
          </article>
        </div>

        {conexion?.last_error ? (
          <div className="alert alert-warning" style={{ marginTop: 14 }}>
            <strong>Última novedad:</strong> {conexion.last_error}
          </div>
        ) : null}

        <div className="nav nav-wrap" style={{ marginTop: 16 }}>
          {!conectada ? (
            <button
              type="button"
              className="button"
              onClick={conectar}
              disabled={Boolean(accion) || cargando}
            >
              {accion === "conectar" ? "Abriendo Google..." : "Conectar Gmail"}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="button"
                onClick={probar}
                disabled={Boolean(accion) || cargando}
              >
                {accion === "probar" ? "Probando..." : "Probar conexión"}
              </button>
              <button
                type="button"
                className="button light"
                onClick={() => setConfirmarDesconexion(true)}
                disabled={Boolean(accion) || cargando}
              >
                Desconectar Gmail
              </button>
            </>
          )}
          <button
            type="button"
            className="button secondary"
            onClick={cargarEstado}
            disabled={Boolean(accion) || cargando}
          >
            {cargando ? "Actualizando..." : "Actualizar estado"}
          </button>
        </div>
      </article>

      <article className="card card-pad">
        <h3>Próximo paso de la Fase 36</h3>
        <p className="muted">
          Después de validar esta conexión se incorporará el motor que buscará los correos de Bancolombia,
          Nequi y los ZIP/XML de facturación electrónica, guardándolos como información pendiente de revisión.
        </p>
      </article>

      <ConfirmModal
        abierto={confirmarDesconexion}
        tipo="advertencia"
        titulo="Desconectar Gmail"
        mensaje="Rafiki dejará de tener acceso de lectura a la cuenta. Los datos documentales que se creen en fases posteriores no se eliminarán."
        textoConfirmar="Desconectar"
        onConfirmar={desconectar}
        onCancelar={() => setConfirmarDesconexion(false)}
      />
    </section>
  );
}
