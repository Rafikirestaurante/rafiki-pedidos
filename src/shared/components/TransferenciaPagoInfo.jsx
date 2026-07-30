import { useEffect, useState } from "react";

export const LLAVE_TRANSFERENCIA_RAFIKI = "0090381033";

function copiarConRespaldo(texto) {
  const elemento = document.createElement("textarea");
  elemento.value = texto;
  elemento.setAttribute("readonly", "");
  elemento.style.position = "fixed";
  elemento.style.opacity = "0";
  document.body.appendChild(elemento);
  elemento.select();
  const copiado = document.execCommand("copy");
  document.body.removeChild(elemento);
  return copiado;
}

export default function TransferenciaPagoInfo() {
  const [copiada, setCopiada] = useState(false);

  useEffect(() => {
    if (!copiada) return undefined;
    const temporizador = window.setTimeout(() => setCopiada(false), 2400);
    return () => window.clearTimeout(temporizador);
  }, [copiada]);

  async function copiarLlave() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(LLAVE_TRANSFERENCIA_RAFIKI);
      } else if (!copiarConRespaldo(LLAVE_TRANSFERENCIA_RAFIKI)) {
        throw new Error("No fue posible copiar la llave");
      }
      setCopiada(true);
    } catch {
      setCopiada(false);
    }
  }

  return (
    <div className="cliente-transferencia-info" role="status" aria-live="polite">
      <div className="cliente-transferencia-copy">
        <div>
          <span className="cliente-transferencia-label">Llave para transferencia</span>
          <strong className="cliente-transferencia-llave">{LLAVE_TRANSFERENCIA_RAFIKI}</strong>
        </div>
        <button type="button" className="button light cliente-transferencia-boton" onClick={copiarLlave}>
          {copiada ? "✓ Llave copiada" : "Copiar llave"}
        </button>
      </div>
      <small>Confirma el valor total del pedido antes de realizar la transferencia.</small>
    </div>
  );
}
