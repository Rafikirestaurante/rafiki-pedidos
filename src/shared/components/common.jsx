import React, { useCallback, useState } from "react";
import { obtenerEstadoPedido } from "../../utils/pedidos";

export function CampoTexto({
  etiqueta,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  rows = 3,
  maxLength
}) {
  return (
    <label className="field">
      <span>{etiqueta}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      )}
      {maxLength ? <small className="muted">{String(value || "").length}/{maxLength} caracteres</small> : null}
    </label>
  );
}

export function EstadoBadge({ estado }) {
  const estadoNormalizado = obtenerEstadoPedido({ estado });
  const clase = `badge badge-${estadoNormalizado.toLowerCase()}`;

  return <span className={clase}>{estadoNormalizado}</span>;
}

export function SelectorCantidad({ cantidad, onChange }) {
  return (
    <div className="quantity">
      <button type="button" onClick={() => onChange(Math.max(1, cantidad - 1))}>
        −
      </button>
      <strong>{cantidad}</strong>
      <button type="button" onClick={() => onChange(cantidad + 1)}>
        +
      </button>
    </div>
  );
}


export function Boton({
  children,
  tipo = "button",
  variante = "primary",
  className = "",
  full = false,
  ...props
}) {
  const clases = ["button", variante !== "primary" ? variante : "", full ? "full-width" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={tipo} className={clases} {...props}>
      {children}
    </button>
  );
}

export function Tarjeta({ children, className = "", padding = true, ...props }) {
  const clases = ["card", padding ? "card-pad" : "", className].filter(Boolean).join(" ");
  return (
    <section className={clases} {...props}>
      {children}
    </section>
  );
}

export function Aviso({ mensaje, tipo = "info" }) {
  if (!mensaje) return null;
  return <div className={`alert alert-${tipo}`}>{mensaje}</div>;
}


const ICONOS_CONFIRMACION = {
  confirmar: "✅",
  advertencia: "⚠️",
  eliminar: "🗑️",
  exito: "✅",
  error: "❌",
  irreversible: "🚨",
  info: "ℹ️"
};

export function ConfirmModal({
  abierto,
  tipo = "confirmar",
  titulo = "Confirmar acción",
  mensaje = "¿Deseas continuar?",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar
}) {
  if (!abierto) return null;

  const claseTipo = `rafiki-modal-${tipo}`;
  const icono = ICONOS_CONFIRMACION[tipo] || ICONOS_CONFIRMACION.confirmar;
  const lineas = String(mensaje || "").split("\n");

  return (
    <div className="rafiki-modal-backdrop" role="presentation" onMouseDown={onCancelar}>
      <div
        className={`rafiki-modal-card ${claseTipo}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rafiki-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="rafiki-modal-icon" aria-hidden="true">{icono}</div>
        <h3 id="rafiki-modal-title">{titulo}</h3>
        <div className="rafiki-modal-message">
          {lineas.map((linea, index) => (
            <p key={`${linea}-${index}`}>{linea || "\u00A0"}</p>
          ))}
        </div>
        <div className="rafiki-modal-actions">
          <button type="button" className="button secondary" onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button type="button" className={`button rafiki-modal-confirm ${claseTipo}`} onClick={onConfirmar} autoFocus>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertModal({
  abierto,
  tipo = "info",
  titulo = "Aviso Rafiki",
  mensaje = "",
  textoCerrar = "Entendido",
  onCerrar
}) {
  if (!abierto) return null;

  const claseTipo = `rafiki-modal-${tipo}`;
  const icono = ICONOS_CONFIRMACION[tipo] || ICONOS_CONFIRMACION.info;
  const lineas = String(mensaje || "").split("\n");

  return (
    <div className="rafiki-modal-backdrop" role="presentation" onMouseDown={onCerrar}>
      <div
        className={`rafiki-modal-card ${claseTipo}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="rafiki-alert-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="rafiki-modal-icon" aria-hidden="true">{icono}</div>
        <h3 id="rafiki-alert-title">{titulo}</h3>
        <div className="rafiki-modal-message">
          {lineas.map((linea, index) => (
            <p key={`${linea}-${index}`}>{linea || "\u00A0"}</p>
          ))}
        </div>
        <div className="rafiki-modal-actions rafiki-modal-actions-single">
          <button type="button" className={`button rafiki-modal-confirm ${claseTipo}`} onClick={onCerrar} autoFocus>
            {textoCerrar}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAlertaRafiki() {
  const [opciones, setOpciones] = useState(null);

  const cerrar = useCallback(() => {
    setOpciones(null);
  }, []);

  const mostrar = useCallback((configuracion = {}) => {
    setOpciones({
      tipo: "info",
      titulo: "Aviso Rafiki",
      mensaje: "",
      textoCerrar: "Entendido",
      ...configuracion
    });
  }, []);

  const modal = (
    <AlertModal
      abierto={Boolean(opciones)}
      {...(opciones || {})}
      onCerrar={cerrar}
    />
  );

  return [mostrar, modal];
}

export function useConfirmacion() {
  const [opciones, setOpciones] = useState(null);

  const cerrar = useCallback((resultado) => {
    setOpciones((actual) => {
      if (actual?.resolver) actual.resolver(resultado);
      return null;
    });
  }, []);

  const confirmar = useCallback((configuracion = {}) => {
    return new Promise((resolver) => {
      setOpciones({
        tipo: "confirmar",
        titulo: "Confirmar acción",
        mensaje: "¿Deseas continuar?",
        textoConfirmar: "Confirmar",
        textoCancelar: "Cancelar",
        ...configuracion,
        resolver
      });
    });
  }, []);

  const modal = (
    <ConfirmModal
      abierto={Boolean(opciones)}
      {...(opciones || {})}
      onConfirmar={() => cerrar(true)}
      onCancelar={() => cerrar(false)}
    />
  );

  return [confirmar, modal];
}
