import React, { useMemo, useState } from "react";
import { listarMesasQr } from "../../../shared/utils/mesasQr";

function urlQrRemoto(enlace) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(enlace)}`;
}

export default function MesasQrAjustes() {
  const mesas = useMemo(() => listarMesasQr(), []);
  const [mesaQrVisible, setMesaQrVisible] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const copiar = async (enlace, mesa) => {
    try {
      await navigator.clipboard.writeText(enlace);
      setMensaje(`Enlace de Mesa ${mesa} copiado.`);
    } catch {
      window.prompt(`Copia el enlace de Mesa ${mesa}:`, enlace);
    }
  };

  const imprimirQr = (mesa, enlace) => {
    const ventana = window.open("", "_blank", "width=520,height=720");
    if (!ventana) return;
    const qr = urlQrRemoto(enlace);
    ventana.document.write(`<!doctype html><html><head><title>QR Mesa ${mesa}</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:36px}h1{font-size:28px;margin:0 0 10px}.mesa{font-size:36px;font-weight:800;margin:12px 0 22px}img{width:280px;height:280px}.nota{margin-top:18px;font-size:16px}</style></head><body><h1>ESCANEA Y HAZ TU PEDIDO</h1><div class="mesa">MESA ${mesa}</div><img src="${qr}" alt="QR Mesa ${mesa}"/><div class="nota">Rafiki Pedidos</div><script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script></body></html>`);
    ventana.document.close();
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div className="section-heading">
        <div>
          <h3>📱 Mesas / QR</h3>
          <p className="muted small">Cada enlace abre /cliente identificado con una mesa fija. El cliente no puede cambiarla desde el formulario.</p>
        </div>
      </div>
      {mensaje ? <div className="box soft" style={{ marginBottom: 12 }}>{mensaje}</div> : null}
      <div className="pedidos-tabla-wrap">
        <table className="pedidos-tabla-compacta">
          <thead><tr><th>Mesa</th><th>Enlace</th><th>Acciones</th></tr></thead>
          <tbody>
            {mesas.map(({ mesa, enlace }) => (
              <React.Fragment key={mesa}>
                <tr>
                  <td><strong>Mesa {mesa}</strong></td>
                  <td><code style={{ fontSize: 11, wordBreak: "break-all" }}>{enlace}</code></td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                      <button type="button" className="mini-btn" onClick={() => copiar(enlace, mesa)}>Copiar enlace</button>
                      <button type="button" className="mini-btn" onClick={() => setMesaQrVisible(mesaQrVisible === mesa ? null : mesa)}>{mesaQrVisible === mesa ? "Ocultar QR" : "Ver QR"}</button>
                      <button type="button" className="mini-btn" onClick={() => imprimirQr(mesa, enlace)}>Imprimir</button>
                    </div>
                  </td>
                </tr>
                {mesaQrVisible === mesa ? (
                  <tr><td colSpan="3" style={{ textAlign: "center", padding: 18 }}>
                    <div><strong>Pedido para Mesa {mesa}</strong></div>
                    <img src={urlQrRemoto(enlace)} alt={`QR Mesa ${mesa}`} width="240" height="240" style={{ marginTop: 10, maxWidth: "100%" }} />
                    <div className="muted small">Si el QR no carga, el enlace sigue funcionando y puede copiarse directamente.</div>
                  </td></tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
