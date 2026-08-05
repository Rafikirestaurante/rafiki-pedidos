export default function SelectorVistaMesas({ vista = "normal", onChange }) {
  return (
    <section className="mesas-vista-selector card" aria-label="Seleccionar vista de Mesas">
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
          Compacta
        </button>
      </div>
    </section>
  );
}
