import React, { useEffect } from "react";

export default function RafikiModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  closeLabel = "Cerrar",
  size = "md",
  className = "",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const manejarEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", manejarEscape);
    return () => document.removeEventListener("keydown", manejarEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="rafiki-ui-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={["rafiki-ui-modal-card", `rafiki-ui-modal-${size}`, className].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rafiki-ui-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="rafiki-ui-modal-header">
          <div>
            <h3 id="rafiki-ui-modal-title">{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="rafiki-ui-modal-close" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </header>
        <div className="rafiki-ui-modal-body">{children}</div>
        {footer ? <footer className="rafiki-ui-modal-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
