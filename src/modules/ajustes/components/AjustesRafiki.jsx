import React, { useState } from "react";
import CatalogoRafa from "../../catalogo/components/CatalogoRafa";
import MeserosAjustes from "./MeserosAjustes";

export default function AjustesRafiki() {
  const [seccion, setSeccion] = useState("catalogo");
  return (
    <section className="card card-pad">
      <div className="section-heading">
        <div>
          <h2>⚙️ Ajustes</h2>
          <p className="muted small">Configuraciones operativas de productos, insumos, clientes especiales y personal de Mesas.</p>
        </div>
      </div>
      <div className="catalogo-selector-tarjetas" style={{ marginTop: 12, maxWidth: 620 }}>
        <button type="button" className={`catalogo-selector-card ${seccion === "catalogo" ? "active" : ""}`} onClick={() => setSeccion("catalogo")}>
          <span className="catalogo-selector-icono">🧾</span><span><strong>Catálogo</strong><small style={{ display: "block" }}>Productos e insumos</small></span>
        </button>
        <button type="button" className={`catalogo-selector-card ${seccion === "meseros" ? "active" : ""}`} onClick={() => setSeccion("meseros")}>
          <span className="catalogo-selector-icono">👥</span><span><strong>Meseros</strong><small style={{ display: "block" }}>Nombres visibles en /mesas</small></span>
        </button>
      </div>
      {seccion === "catalogo" ? <CatalogoRafa /> : <MeserosAjustes />}
    </section>
  );
}
