import { MESAS_DISPONIBLES } from "./mesas";

// Tokens opacos y estables por mesa. No exponen el código de mesa en la URL.
const TOKENS_MESAS_QR = Object.freeze({
  "1A": "rfk1_q7K2mP9vXa4Ld8Ns",
  "1B": "rfk1_B6tQ3zW8nR2yH5Jc",
  "2A": "rfk1_M9cV4pL7sT2kD6Qx",
  "2B": "rfk1_h5N8rY3wF7mK2PzV",
  "3A": "rfk1_T4xJ9qC6vN2sL8Bm",
  "3B": "rfk1_p8D3kR7yW5nQ2HcM",
  "4A": "rfk1_V2mL6tX9qB4sK7Nd",
  "4B": "rfk1_z7Q3cP8vR5kM2TyN",
  "5B": "rfk1_K6wN2sD9xV4pJ7Rq",
});

const MESA_POR_TOKEN = new Map(
  Object.entries(TOKENS_MESAS_QR).map(([mesa, token]) => [token, mesa])
);

export function obtenerMesaPorTokenQr(token) {
  const limpio = String(token || "").trim();
  const mesa = MESA_POR_TOKEN.get(limpio) || null;
  return MESAS_DISPONIBLES.includes(mesa) ? mesa : null;
}

export function obtenerMesaQrDesdeUrl(url = null) {
  try {
    const destino = url ? new URL(url, window.location.origin) : new URL(window.location.href);
    return obtenerMesaPorTokenQr(destino.searchParams.get("m"));
  } catch {
    return null;
  }
}

export function obtenerTokenQrMesa(mesa) {
  return TOKENS_MESAS_QR[String(mesa || "").trim()] || null;
}

export function crearEnlaceQrMesa(mesa, origin = null) {
  const token = obtenerTokenQrMesa(mesa);
  if (!token) return "";
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/cliente?m=${encodeURIComponent(token)}`;
}

export function listarMesasQr(origin = null) {
  const ordenVisual = ["1A", "2A", "3A", "4A", "1B", "2B", "3B", "4B", "5B"];
  return ordenVisual
    .filter((mesa) => MESAS_DISPONIBLES.includes(mesa))
    .map((mesa) => ({
      mesa,
      token: obtenerTokenQrMesa(mesa),
      enlace: crearEnlaceQrMesa(mesa, origin),
    }));
}
