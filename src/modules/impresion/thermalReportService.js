const FORMATOS_TERMICOS = {
  "58": {
    etiqueta: "58 mm",
    pageSize: "58mm auto",
    width: "58mm",
    ventana: "width=340,height=720",
    bodyPadding: "2px 1px 4px",
    fontSize: "10.5px",
    titleSize: "11px",
    subtitleSize: "10.5px",
    sectionTitleSize: "10.5px",
    rowGap: "0",
    tableFontSize: "10.2px",
    tableHeaderSize: "10px",
    tableRowPadding: "0",
    tableColumnGap: "1px",
    lineHeight: "1.03",
    tableLineHeight: "1.02",
  },
  "80": {
    etiqueta: "80 mm",
    pageSize: "80mm auto",
    width: "80mm",
    ventana: "width=460,height=760",
    bodyPadding: "3px 2px 5px",
    fontSize: "11px",
    titleSize: "12px",
    subtitleSize: "11px",
    sectionTitleSize: "11px",
    rowGap: "0",
    tableFontSize: "10.8px",
    tableHeaderSize: "10.5px",
    tableRowPadding: "0",
    tableColumnGap: "2px",
    lineHeight: "1.04",
    tableLineHeight: "1.03",
  },
};

export function normalizarFormatoTermico(formato = "80") {
  const clave = String(formato || "80").replace(/[^0-9]/g, "");
  return FORMATOS_TERMICOS[clave] ? clave : "80";
}


export const THERMAL_REPORT_FORMAT_STORAGE_KEY = "rafiki:thermal-report-format";

export function obtenerFormatoTermicoPreferido(formatoRespaldo = "80") {
  const fallback = normalizarFormatoTermico(formatoRespaldo);
  if (typeof window === "undefined") return fallback;

  try {
    return normalizarFormatoTermico(window.localStorage?.getItem(THERMAL_REPORT_FORMAT_STORAGE_KEY) || fallback);
  } catch {
    return fallback;
  }
}

export function guardarFormatoTermicoPreferido(formato = "80") {
  const normalizado = normalizarFormatoTermico(formato);
  if (typeof window === "undefined") return normalizado;

  try {
    window.localStorage?.setItem(THERMAL_REPORT_FORMAT_STORAGE_KEY, normalizado);
  } catch {
    // La impresión debe seguir funcionando aunque localStorage no esté disponible.
  }

  return normalizado;
}

export function escapeHtmlTermico(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTextoTermico(valor) {
  return escapeHtmlTermico(valor).replace(/\n/g, "<br />");
}

export function formatearFechaTermica(valor = new Date()) {
  const fecha = valor ? new Date(valor) : new Date();
  if (Number.isNaN(fecha.getTime())) return "--/--/--";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

function renderMeta(meta = []) {
  const visibles = (Array.isArray(meta) ? meta : [])
    .filter((item) => item?.etiqueta || item?.valor)
    .map((item) => `
      <div class="meta-row">
        <span>${renderTextoTermico(item.etiqueta)}</span>
        <strong>${renderTextoTermico(item.valor)}</strong>
      </div>
    `)
    .join("");

  return visibles ? `<section class="thermal-meta">${visibles}</section>` : "";
}

function renderRows(filas = []) {
  return (Array.isArray(filas) ? filas : [])
    .filter((fila) => fila?.etiqueta || fila?.valor)
    .map((fila) => `
      <div class="thermal-row ${fila.fuerte ? "thermal-row-strong" : ""} ${fila.tipo ? `thermal-row-${escapeHtmlTermico(fila.tipo)}` : ""}">
        <span>${renderTextoTermico(fila.etiqueta)}</span>
        <strong>${renderTextoTermico(fila.valor)}</strong>
      </div>
    `)
    .join("");
}

function renderSecciones(secciones = []) {
  return (Array.isArray(secciones) ? secciones : [])
    .filter((seccion) => seccion?.titulo || (Array.isArray(seccion?.filas) && seccion.filas.length))
    .map((seccion) => `
      <section class="thermal-section">
        ${seccion.titulo ? `<h3>${escapeHtmlTermico(seccion.titulo)}</h3>` : ""}
        ${renderRows(seccion.filas)}
      </section>
    `)
    .join("");
}

function resolverValorCampoTermico(campo, item) {
  if (!campo) return "";
  return typeof campo.valor === "function" ? campo.valor(item) : item?.[campo.key];
}

function normalizarAnchoColumnaTermica(campo, totalCampos) {
  if (campo?.ancho) return String(campo.ancho).trim();
  if (campo?.width) return String(campo.width).trim();
  return `${Math.max(1, Math.floor(100 / Math.max(1, totalCampos)))}%`;
}

function renderListadoTabla(listado = {}, campos = [], items = []) {
  const columnas = campos.filter((campo) => !campo?.bloque);
  if (!columnas.length) return "";

  const template = columnas.map((campo) => normalizarAnchoColumnaTermica(campo, columnas.length)).join(" ");
  const encabezado = columnas.map((campo) => `
    <span class="thermal-table-cell thermal-table-head-cell ${campo.alinear === "right" ? "thermal-table-cell-right" : ""}">${renderTextoTermico(campo.etiqueta)}</span>
  `).join("");

  const filas = items.map((item) => `
    <div class="thermal-table-row" style="grid-template-columns: ${escapeHtmlTermico(template)};">
      ${columnas.map((campo) => `
        <span class="thermal-table-cell ${campo.fuerte ? "thermal-table-cell-strong" : ""} ${campo.alinear === "right" ? "thermal-table-cell-right" : ""}">${renderTextoTermico(resolverValorCampoTermico(campo, item))}</span>
      `).join("")}
    </div>
  `).join("");

  return `
    <section class="thermal-list-section thermal-list-section-table">
      ${listado.titulo ? `<h3>${renderTextoTermico(listado.titulo)}</h3>` : ""}
      <div class="thermal-table">
        <div class="thermal-table-row thermal-table-head" style="grid-template-columns: ${escapeHtmlTermico(template)};">${encabezado}</div>
        ${filas}
      </div>
    </section>
  `;
}

function renderListadoBloques(listado = {}, campos = [], items = []) {
  return `
    <section class="thermal-list-section">
      ${listado.titulo ? `<h3>${renderTextoTermico(listado.titulo)}</h3>` : ""}
      <div class="thermal-list">
        ${items.map((item) => `
          <article class="thermal-list-item">
            ${campos.map((campo) => `
              <div class="thermal-list-line ${campo.fuerte ? "thermal-list-line-strong" : ""} ${campo.bloque ? "thermal-list-line-block" : ""}">
                <span>${renderTextoTermico(campo.etiqueta)}</span>
                <strong>${renderTextoTermico(resolverValorCampoTermico(campo, item))}</strong>
              </div>
            `).join("")}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderListado(listado = {}) {
  const items = Array.isArray(listado.items) ? listado.items : [];
  if (!items.length) return listado.vacio ? `<div class="thermal-empty">${renderTextoTermico(listado.vacio)}</div>` : "";

  const campos = Array.isArray(listado.campos) ? listado.campos : [];
  const modo = String(listado.modo || listado.layout || "bloques").toLowerCase();
  if (modo === "tabla" || listado.tabla === true) {
    return renderListadoTabla(listado, campos, items);
  }

  return renderListadoBloques(listado, campos, items);
}

function construirHtmlReporteTermico({ formato = "80", titulo = "Reporte Rafiki", subtitulo = "", meta = [], secciones = [], listado = null, pie = "" }) {
  const claveFormato = normalizarFormatoTermico(formato);
  const cfg = FORMATOS_TERMICOS[claveFormato];
  const tituloSeguro = escapeHtmlTermico(titulo);

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${tituloSeguro} ${cfg.etiqueta}</title>
        <style>
          @page { size: ${cfg.pageSize}; margin: 0; }
          * { box-sizing: border-box; }
          body {
            width: ${cfg.width};
            margin: 0;
            padding: ${cfg.bodyPadding};
            background: #fff;
            color: #000;
            font-family: "Courier New", "Lucida Console", monospace;
            font-size: ${cfg.fontSize};
            line-height: ${cfg.lineHeight};
            font-weight: 400;
          }
          h1, h2, h3, p { margin: 0; padding: 0; }
          strong, b { font-weight: 400; }
          .thermal-title {
            text-align: center;
            font-size: ${cfg.titleSize};
            line-height: ${cfg.lineHeight};
            font-weight: 400;
            text-transform: uppercase;
            margin: 0;
          }
          .thermal-subtitle {
            text-align: center;
            font-size: ${cfg.subtitleSize};
            line-height: ${cfg.lineHeight};
            font-weight: 400;
            margin: 0;
          }
          .thermal-meta,
          .thermal-section,
          .thermal-list-section {
            border: 0;
            padding: 0;
            margin: 1px 0 0;
          }
          .thermal-section h3,
          .thermal-list-section h3 {
            margin: 1px 0 0;
            font-size: ${cfg.sectionTitleSize};
            line-height: ${cfg.lineHeight};
            text-transform: uppercase;
            text-align: left;
            letter-spacing: 0;
            font-weight: 400;
          }
          .meta-row,
          .thermal-row,
          .thermal-list-line {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 2px;
            margin: 0;
            padding: 0;
          }
          .meta-row span,
          .thermal-row span,
          .thermal-list-line span {
            flex: 1 1 auto;
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .meta-row strong,
          .thermal-row strong,
          .thermal-list-line strong {
            flex: 0 0 auto;
            max-width: 52%;
            text-align: right;
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .thermal-row-strong,
          .thermal-list-line-strong,
          .thermal-row-strong span,
          .thermal-row-strong strong,
          .thermal-list-line-strong span,
          .thermal-list-line-strong strong {
            font-size: 1em;
            font-weight: 400;
          }
          .thermal-list,
          .thermal-list-item {
            margin: 0;
            padding: 0;
            border: 0;
          }
          .thermal-list-line-block {
            display: block;
            margin: 0;
          }
          .thermal-list-line-block span,
          .thermal-list-line-block strong {
            display: block;
            width: 100%;
            max-width: 100%;
            text-align: left;
          }
          .thermal-list-line-block span {
            font-size: 1em;
            text-transform: uppercase;
            font-weight: 400;
          }
          .thermal-table {
            width: 100%;
            font-family: "Courier New", "Lucida Console", monospace;
            letter-spacing: -0.2px;
            margin: 0;
            padding: 0;
          }
          .thermal-table-row {
            display: grid;
            column-gap: ${cfg.tableColumnGap};
            align-items: start;
            border: 0;
            margin: 0;
            padding: ${cfg.tableRowPadding};
          }
          .thermal-table-head {
            border: 0;
            margin: 0;
            padding: 0;
          }
          .thermal-table-cell {
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: ${cfg.tableLineHeight};
            font-size: ${cfg.tableFontSize};
            font-weight: 400;
          }
          .thermal-table-head-cell {
            font-size: ${cfg.tableHeaderSize};
            text-transform: uppercase;
            font-weight: 400;
          }
          .thermal-table-cell-strong { font-weight: 400; }
          .thermal-table-cell-right { text-align: right; }
          .thermal-empty {
            border: 0;
            margin: 1px 0 0;
            padding: 0;
            text-align: center;
            font-weight: 400;
          }
          .thermal-footer {
            border: 0;
            margin: 1px 0 0;
            padding: 0;
            text-align: center;
            font-size: 0.9em;
            font-weight: 400;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1 class="thermal-title">${tituloSeguro}</h1>
        ${subtitulo ? `<p class="thermal-subtitle">${escapeHtmlTermico(subtitulo)}</p>` : ""}
        ${renderMeta(meta)}
        ${renderSecciones(secciones)}
        ${listado ? renderListado(listado) : ""}
        <div class="thermal-footer">${escapeHtmlTermico(pie || `Formato ${cfg.etiqueta} · ${formatearFechaTermica(new Date())}`)}</div>
        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
              window.close();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;
}

export function imprimirReporteTermico(opciones = {}) {
  if (typeof window === "undefined") return false;

  const formato = normalizarFormatoTermico(opciones.formato);
  const cfg = FORMATOS_TERMICOS[formato];
  const ventana = window.open("", "_blank", cfg.ventana);
  if (!ventana) return false;

  ventana.document.open();
  ventana.document.write(construirHtmlReporteTermico({ ...opciones, formato }));
  ventana.document.close();
  return true;
}

export function crearCamposListadoPedidosTermico({ obtenerNumero, obtenerClientePedido, obtenerUbicacionPedido, obtenerTotalPedido }) {
  return [
    { etiqueta: "Pedido", ancho: "17%", valor: (pedido) => `#${obtenerNumero(pedido)}`, fuerte: true },
    { etiqueta: "Cliente", ancho: "29%", valor: obtenerClientePedido },
    { etiqueta: "Ubicación", ancho: "31%", valor: obtenerUbicacionPedido },
    { etiqueta: "Total", ancho: "23%", alinear: "right", valor: obtenerTotalPedido, fuerte: true },
  ];
}
