function textoLimpio(valor) {
  return String(valor || "").replace(/\s+/g, " ").trim();
}

function normalizarTextoLocal(valor) {
  return textoLimpio(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categoriaCafeteria(item = {}) {
  const referencias = [item.categoria, item.linea, item.area]
    .map(normalizarTextoLocal)
    .filter(Boolean);

  if (referencias.length === 0) return true;
  return referencias.some((referencia) => referencia.includes("cafeteria"));
}

function tipoNormalizado(item = {}) {
  return normalizarTextoLocal(item.tipo || "");
}

function productoOriginal(item = {}) {
  return textoLimpio(item.producto || item.plato || item.proteina || item.nombre);
}

function extraerTamano(item = {}, producto = "") {
  const declarado = textoLimpio(item.tamano);
  if (declarado) return declarado;

  const coincidencia = textoLimpio(producto).match(/\b(\d{1,2})\s*oz\b/i);
  return coincidencia ? `${coincidencia[1]} oz` : "";
}

function contieneTexto(base, buscado) {
  if (!base || !buscado) return false;
  return normalizarTextoLocal(base).includes(normalizarTextoLocal(buscado));
}

function limpiarPrefijoRepetido(producto, expresion) {
  let limpio = textoLimpio(producto);
  let anterior = null;

  while (limpio && limpio !== anterior) {
    anterior = limpio;
    limpio = limpio.replace(expresion, "").trim();
  }

  return limpio;
}

function frutasParfait(item = {}, producto = "") {
  if (Array.isArray(item.frutas) && item.frutas.length > 0) {
    return item.frutas.map(textoLimpio).filter(Boolean);
  }

  const coincidencia = textoLimpio(producto).match(/frutas\s*:\s*(.+)$/i);
  if (!coincidencia) return [];

  return coincidencia[1]
    .split(",")
    .map(textoLimpio)
    .filter(Boolean);
}

export function esParfaitResumen(item = {}) {
  if (!categoriaCafeteria(item)) return false;
  const tipo = tipoNormalizado(item);
  const producto = normalizarTextoLocal(productoOriginal(item));
  return tipo.includes("parfait") || producto.startsWith("parfait");
}

export function esBatidoResumen(item = {}) {
  if (!categoriaCafeteria(item)) return false;
  const tipo = tipoNormalizado(item);
  return tipo.includes("batido cremoso") || tipo.includes("batidos cremosos") || tipo.includes("batido refrescante") || tipo.includes("batidos refrescantes") || tipo === "batido";
}

export function esBatidoCremosoResumen(item = {}) {
  return esBatidoResumen(item) && tipoNormalizado(item).includes("cremos");
}

export function esJugoTradicionalResumen(item = {}) {
  if (!categoriaCafeteria(item)) return false;
  const tipo = tipoNormalizado(item);
  return tipo.includes("jugo tradicional") || tipo.includes("jugos tradicionales");
}

function nombreParfaitResumen(item = {}) {
  const producto = productoOriginal(item);
  const tamano = extraerTamano(item, producto);
  const frutas = frutasParfait(item, producto);

  if (tamano || frutas.length) {
    const seleccion = [tamano, frutas.join(", ")].filter(Boolean).join(" · ");
    return ["Parfait", seleccion].filter(Boolean).join(" ");
  }

  const contenido = limpiarPrefijoRepetido(
    producto.replace(/\s*-?\s*frutas\s*:\s*/i, " · "),
    /^(?:parfait)\b\s*/i
  );

  return ["Parfait", contenido].filter(Boolean).join(" ").replace(/\s{2,}/g, " ").trim();
}

function nombreBatidoResumen(item = {}) {
  const producto = productoOriginal(item);
  const sabor = textoLimpio(item.sabor);
  const tamano = extraerTamano(item, producto);
  const productoSinTipo = limpiarPrefijoRepetido(
    producto,
    /^(?:batidos?\s+(?:cremosos?|refrescantes?))\b\s*(?:[-–—:]\s*)?/i
  );

  let nombre = productoSinTipo || sabor || "Batido";
  if (tamano && !contieneTexto(nombre, tamano)) nombre = `${nombre} ${tamano}`;
  return textoLimpio(nombre);
}

function nombreJugoTradicionalResumen(item = {}) {
  const producto = productoOriginal(item);
  const sabor = textoLimpio(item.sabor);
  const tamano = extraerTamano(item, producto);
  const base = textoLimpio(item.base);
  const productoSinTipo = limpiarPrefijoRepetido(
    producto,
    /^(?:jugos?\s+tradicional(?:es)?)\b\s*(?:[-–—:]\s*)?/i
  );

  let nombre = productoSinTipo || sabor || "Jugo";
  if (tamano && !contieneTexto(nombre, tamano)) nombre = `${nombre} ${tamano}`;
  if (base && !contieneTexto(nombre, base)) nombre = `${nombre} · ${base}`;
  return textoLimpio(nombre);
}

export function nombreCafeteriaResumen(item = {}) {
  if (esParfaitResumen(item)) return nombreParfaitResumen(item);
  if (esBatidoResumen(item)) return nombreBatidoResumen(item);
  if (esJugoTradicionalResumen(item)) return nombreJugoTradicionalResumen(item);
  return "";
}

export function obtenerNombreCafeteria(item = {}) {
  const especial = nombreCafeteriaResumen(item);
  if (especial) return especial;

  const producto = productoOriginal(item);
  const tipo = textoLimpio(item.tipo);
  return producto || tipo || "Producto cafetería";
}

export function detalleCafeteriaEstaEnTitulo(item = {}) {
  return esParfaitResumen(item) || esBatidoResumen(item) || esJugoTradicionalResumen(item);
}

export function obtenerDetallesCafeteria(item = {}) {
  const detalles = [];
  const titulo = obtenerNombreCafeteria(item);
  const agregar = (etiqueta, valor) => {
    const limpio = textoLimpio(valor);
    if (!limpio) return;
    if (detalles.some((detalle) => detalle.etiqueta === etiqueta && detalle.valor === limpio)) return;
    detalles.push({ etiqueta, valor: limpio });
  };

  if (esParfaitResumen(item)) {
    // Tamaño y frutas ya forman parte del título canónico del Parfait.
  } else if (esJugoTradicionalResumen(item)) {
    // Sabor, tamaño y base ya forman parte del título canónico del jugo.
  } else if (esBatidoResumen(item)) {
    // Sabor y tamaño ya están en el título. La base del cremoso sigue como detalle.
    if (item.base) agregar("Base", item.base);
  } else {
    const producto = productoOriginal(item);
    if (producto && !contieneTexto(titulo, producto)) agregar("Producto", producto);
    if (item.tamano && !contieneTexto(titulo, item.tamano)) agregar("Tamaño", item.tamano);
    if (Array.isArray(item.frutas) && item.frutas.length > 0) agregar("Frutas", item.frutas.map(textoLimpio).filter(Boolean).join(", "));
    if (item.base && !contieneTexto(titulo, item.base)) agregar("Base", item.base);
    if (item.acompanante) agregar("Acompañante", item.acompanante);
    if (item.bebida) agregar("Bebida", item.bebida);
  }

  if (Number(item.extraFrutas) > 0) agregar("Extra frutas", `+${Number(item.extraFrutas).toLocaleString("es-CO")}`);

  if (Array.isArray(item.adicionales) && item.adicionales.length > 0) {
    agregar("Adicionales", item.adicionales.map((detalle) => textoLimpio(detalle?.nombre || detalle)).filter(Boolean).join(", "));
  }

  if (item.observacionesItem?.trim()) agregar("Obs.", item.observacionesItem.trim());

  return detalles;
}
