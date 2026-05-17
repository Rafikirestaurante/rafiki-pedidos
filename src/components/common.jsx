import React from "react";
import { obtenerEstadoPedido } from "../utils/pedidos";

export function CampoTexto({
  etiqueta,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  rows = 3
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
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
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
