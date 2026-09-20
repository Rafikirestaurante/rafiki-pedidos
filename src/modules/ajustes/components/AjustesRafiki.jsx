import React, { useState } from "react";
import CatalogoRafa from "../../catalogo/components/CatalogoRafa";
import MeserosAjustes from "./MeserosAjustes";
import MesasQrAjustes from "./MesasQrAjustes";

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
      <div className="catalogo-selector-tarjetas" style={{ marginTop: 12, maxWidth: 920 }}>
        <button type="button" className={`catalogo-selector-card ${seccion === "catalogo" ? "active" : ""}`} onClick={() => setSeccion("catalogo")}>
          <span className="catalogo-selector-icono">🧾</span><span><strong>Catálogo</strong><small style={{ display: "block" }}>Productos e insumos</small></span>
        </button>
        <button type="button" className={`catalogo-selector-card ${seccion === "meseros" ? "active" : ""}`} onClick={() => setSeccion("meseros")}>
          <span className="catalogo-selector-icono">👥</span><span><strong>Meseros</strong><small style={{ display: "block" }}>Nombres visibles en /mesas</small></span>
        </button>
        <button type="button" className={`catalogo-selector-card ${seccion === "mesasQr" ? "active" : ""}`} onClick={() => setSeccion("mesasQr")}>
          <span className="catalogo-selector-icono">📱</span><span><strong>Mesas / QR</strong><small style={{ display: "block" }}>Enlaces para pedidos en mesa</small></span>
        </button>
      </div>
      {seccion === "catalogo" ? <CatalogoRafa /> : seccion === "meseros" ? <MeserosAjustes /> : <MesasQrAjustes />}
    </section>
  );
}
