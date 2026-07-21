import { normalizarTexto } from "./pedidos";

function textoLimpio(valor) {
  return String(valor || "").trim();
}

function categoriaCafeteria(item = {}) {
  return normalizarTexto(item.categoria || item.linea || "cafeteria").includes("cafeteria");
}

export function esParfaitResumen(item = {}) {
  if (!categoriaCafeteria(item)) return false;
  const tipo = normalizarTexto(item.tipo || item.categoria);
  return tipo === "parfait" || tipo.includes("parfait");
}

export function esBatidoResumen(item = {}) {
  if (!categoriaCafeteria(item)) return false;
  const tipo = normalizarTexto(item.tipo || item.categoria);
  return tipo === "batido" || tipo.includes("batido cremoso") || tipo.includes("batido refrescante");
}

function nombreParfaitResumen(item = {}) {
  const producto = textoLimpio(item.producto || item.plato || item.proteina || item.nombre);
  const tamano = textoLimpio(item.tamano);
  const frutas = Array.isArray(item.frutas)
    ? item.frutas.map(textoLimpio).filter(Boolean)
    : [];

  if (tamano || frutas.length) {
    const seleccion = [tamano, frutas.join(", ")].filter(Boolean).join(" · ");
    return ["Parfait", seleccion].filter(Boolean).join(" ");
  }

  return producto
    .replace(/\s*-?\s*frutas\s*:\s*/i, " · ")
    .replace(/\s{2,}/g, " ")
    .trim() || "Parfait";
}

function nombreBatidoResumen(item = {}) {
  const producto = textoLimpio(item.producto || item.plato || item.proteina || item.nombre);
  const sabor = textoLimpio(item.sabor);
  const tamano = textoLimpio(item.tamano);

  const productoSinTipo = producto
    .replace(/^batidos?\s+(?:cremosos?|refrescantes?)\s*/i, "")
    .trim();

  return productoSinTipo || [sabor, tamano].filter(Boolean).join(" ") || "Batido";
}

export function nombreCafeteriaResumen(item = {}) {
  if (esParfaitResumen(item)) return nombreParfaitResumen(item);
  if (esBatidoResumen(item)) return nombreBatidoResumen(item);
  return "";
}

export function detalleCafeteriaEstaEnTitulo(item = {}) {
  return esParfaitResumen(item) || esBatidoResumen(item);
}
