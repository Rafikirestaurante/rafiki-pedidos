export default function SelectorVistaMesas({ vista = "normal", onChange }) {
  return (
    <section className="mesas-vista-selector card" aria-label="Seleccionar vista de Mesas">
      <div className="mesas-vista-selector-copy">
        <strong>Vista de pedidos</strong>
        <span>Normal es la interfaz habitual. Compacta usa el flujo por pasos con pedidos reales.</span>
      </div>
      <div className="mesas-vista-selector-opciones" role="group" aria-label="Tipo de vista">
        <button
          type="button"
          className={vista === "normal" ? "active" : ""}
          onClick={() => onChange?.("normal")}
          aria-pressed={vista === "normal"}
        >
          Normal
        </button>
        <button
          type="button"
          className={vista === "compacta" ? "active" : ""}
          onClick={() => onChange?.("compacta")}
          aria-pressed={vista === "compacta"}
        >
          Compacta <small>Prueba</small>
        </button>
      </div>
    </section>
  );
}
