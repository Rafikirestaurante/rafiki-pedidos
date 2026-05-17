export function irAElementoMesas(id, delay = 180, block = "start") {
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      const elemento = document.getElementById(id);
      if (!elemento) return;
      elemento.scrollIntoView({ behavior: "smooth", block, inline: "nearest" });
    });
  }, delay);
}

export function vibracionCortaMesas() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(18);
  }
}

export const MESAS_DISPONIBLES = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5B"];
export const MESEROS_DISPONIBLES = ["Rafa", "Ara", "Pao", "Jesús"];
export const FORMAS_PAGO_MESA = ["Efectivo", "Transferencia", "Datafono"];
