import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { ErrorKiara } from "./catalogo.js";
export function firmarEstado(carrito, secret, anterior = {}) {
  const payload = Buffer.from(
    JSON.stringify({
      carrito,
      pedidoId: anterior.pedidoId || randomUUID(),
      exp: Date.now() + 2 * 60 * 60 * 1000
    })
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function leerEstado(token, secret) {
  if (!token) return { carrito: [], pedidoId: randomUUID() };
  if (typeof token !== "string" || token.length > 60000)
    throw new ErrorKiara("El pedido no es válido. Inicia una conversación nueva.");
  const [payload, firma, extra] = token.split(".");
  const esperado = createHmac("sha256", secret)
    .update(payload || "")
    .digest("base64url");
  if (
    extra ||
    !firma ||
    Buffer.byteLength(firma) !== Buffer.byteLength(esperado) ||
    !timingSafeEqual(Buffer.from(firma), Buffer.from(esperado))
  )
    throw new ErrorKiara("El pedido no es válido. Inicia una conversación nueva.");
  let estado;
  try {
    estado = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    throw new ErrorKiara("El pedido no es válido.");
  }
  if (!estado.exp || estado.exp < Date.now())
    throw new ErrorKiara("Esta conversación venció. Inicia un pedido nuevo.");
  return estado;
}
export const hashIp = (ip, secret) => createHmac("sha256", secret).update(ip).digest("hex");
