import React, { useEffect, useRef, useState } from "react";

export default function RafikiActionMenu({
  label = "Opciones",
  items = [],
  align = "right",
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const visibles = items.filter(Boolean);

  useEffect(() => {
    if (!open) return undefined;
    const cerrar = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [open]);

  if (visibles.length === 0) return null;

  return (
    <div className="rafiki-action-menu" ref={ref}>
      <button
        type="button"
        className="mini-btn rafiki-action-menu-trigger"
        onClick={() => setOpen((valor) => !valor)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label} ⋮
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="rafiki-action-menu-mobile-backdrop"
            aria-label="Cerrar opciones"
            onClick={() => setOpen(false)}
          />
          <div className={`rafiki-action-menu-list ${align === "left" ? "align-left" : ""}`} role="menu">
            {visibles.map((item) => (
              <button
                key={item.id || item.label}
                type="button"
                role="menuitem"
                className={`rafiki-action-menu-item ${item.variant ? `is-${item.variant}` : ""}`}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
