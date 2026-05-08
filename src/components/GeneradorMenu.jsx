import React, { useMemo, useState } from "react";

function limpiarLista(texto) {
  return String(texto || "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean);
}

function limpiarPrecio(valor) {
  return String(valor || "").replace(/[^\d.]/g, "");
}

function precioVisible(valor) {
  const limpio = String(valor || "").replace(/[^\d]/g, "");
  if (!limpio) return "";
  return new Intl.NumberFormat("es-CO").format(Number(limpio));
}

function escapeSvg(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wrapText(texto, max = 26) {
  const palabras = String(texto || "").split(" ");
  const lineas = [];
  let linea = "";

  palabras.forEach((palabra) => {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (prueba.length > max && linea) {
      lineas.push(linea);
      linea = palabra;
    } else {
      linea = prueba;
    }
  });

  if (linea) lineas.push(linea);
  return lineas.slice(0, 2);
}

function crearSvgMenu({ platos, acompanantes }) {
  const width = 1080;
  const height = 1080;
  const rows = platos.slice(0, 8);
  const sides = acompanantes.slice(0, 7);

  const rowsSvg = rows
    .map((plato, index) => {
      const y = 280 + index * 76;
      const lineas = wrapText(plato.nombre || "Plato", 21);
      const nombreSvg = lineas
        .map(
          (linea, i) =>
            `<text x="164" y="${y + i * 28}" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#2f1b10">${escapeSvg(linea)}</text>`
        )
        .join("");

      return `
        <rect x="112" y="${y - 50}" width="856" height="64" rx="24" fill="${index % 2 === 0 ? "#fffaf2" : "#ffffff"}" stroke="#f4d6a6" stroke-width="2"/>
        <circle cx="140" cy="${y - 18}" r="8" fill="#b45309"/>
        ${nombreSvg}
        <line x1="650" y1="${y - 12}" x2="775" y2="${y - 12}" stroke="#c7a36d" stroke-width="3" stroke-dasharray="7 12" opacity="0.55"/>
        <text x="925" y="${y}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#7f1d1d" text-anchor="end">$${escapeSvg(precioVisible(plato.precio))}</text>
      `;
    })
    .join("");

  const sidesStartY = 900;
  const sidesSvg = sides
    .map(
      (item, index) =>
        `<text x="170" y="${sidesStartY + index * 42}" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#321b0f">• ${escapeSvg(item)}</text>`
    )
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff7ed"/>
        <stop offset="0.55" stop-color="#fffaf3"/>
        <stop offset="1" stop-color="#f6d38c"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#92400e"/>
        <stop offset="0.5" stop-color="#f59e0b"/>
        <stop offset="1" stop-color="#92400e"/>
      </linearGradient>
      <linearGradient id="wine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#9f2419"/>
        <stop offset="1" stop-color="#5f150f"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#7c2d12" flood-opacity="0.20"/>
      </filter>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#7c2d12" flood-opacity="0.12"/>
      </filter>
    </defs>

    <rect width="1080" height="1080" fill="url(#bg)"/>
    <circle cx="82" cy="112" r="170" fill="#fed7aa" opacity="0.42"/>
    <circle cx="1000" cy="1000" r="250" fill="#fdba74" opacity="0.34"/>

    <rect x="64" y="58" width="952" height="964" rx="54" fill="#ffffff" opacity="0.95" filter="url(#shadow)"/>
    <rect x="92" y="86" width="896" height="908" rx="42" fill="none" stroke="#b45309" stroke-width="4" opacity="0.48"/>
    <rect x="113" y="107" width="854" height="866" rx="34" fill="none" stroke="#fde7c3" stroke-width="6" opacity="0.95"/>

    <circle cx="540" cy="155" r="58" fill="url(#wine)" filter="url(#softShadow)"/>
    <text x="540" y="174" font-family="Georgia, serif" font-size="60" font-weight="900" fill="#fff8ed" text-anchor="middle">R</text>
    <text x="540" y="244" font-family="Arial, sans-serif" font-size="46" font-weight="900" fill="#7f1d1d" text-anchor="middle" letter-spacing="3">RAFIKI</text>

    <rect x="320" y="270" width="440" height="52" rx="26" fill="url(#wine)"/>
    <text x="540" y="306" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">MENÚ DEL DÍA</text>

    ${rowsSvg || `<text x="540" y="485" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#78716c" text-anchor="middle">Agrega los platos del día</text>`}

    <rect x="112" y="815" width="856" height="176" rx="32" fill="#fffaf2" stroke="#efc68e" stroke-width="4" filter="url(#softShadow)"/>
    <rect x="330" y="790" width="420" height="54" rx="27" fill="url(#gold)"/>
    <text x="540" y="826" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">ACOMPAÑANTES</text>
    ${sidesSvg || `<text x="170" y="884" font-family="Arial, sans-serif" font-size="30" fill="#78716c">• Escribe acompañantes...</text>`}
  </svg>`;
}

function crearSvgMenuSoloTexto({ platos, acompanantes }) {
  const width = 1080;
  const height = 930;
  const rows = platos.slice(0, 8);
  const sides = acompanantes.slice(0, 8);

  const rowsSvg = rows
    .map((plato, index) => {
      const y = 165 + index * 70;
      const lineas = wrapText(plato.nombre || "Plato", 22);
      const nombreSvg = lineas
        .map(
          (linea, i) =>
            `<text x="115" y="${y + i * 29}" font-family="Arial, sans-serif" font-size="39" font-weight="900" fill="#1f130c">${escapeSvg(linea)}</text>`
        )
        .join("");

      return `
        ${nombreSvg}
        <line x1="650" y1="${y - 12}" x2="780" y2="${y - 12}" stroke="#1f130c" stroke-width="3" stroke-dasharray="7 14" opacity="0.45"/>
        <text x="965" y="${y + 2}" font-family="Arial, sans-serif" font-size="39" font-weight="900" fill="#1f130c" text-anchor="end">$${escapeSvg(precioVisible(plato.precio))}</text>
      `;
    })
    .join("");

  const sidesStartY = 775;
  const sidesSvg = sides
    .map(
      (item, index) =>
        `<text x="115" y="${sidesStartY + index * 40}" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#1f130c">• ${escapeSvg(item)}</text>`
    )
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <text x="540" y="78" font-family="Arial, sans-serif" font-size="58" font-weight="900" fill="#1f130c" text-anchor="middle" letter-spacing="3">MENÚ DEL DÍA</text>
    <line x1="150" y1="112" x2="930" y2="112" stroke="#1f130c" stroke-width="5" opacity="0.72"/>

    ${rowsSvg || `<text x="540" y="300" font-family="Arial, sans-serif" font-size="40" font-weight="800" fill="#1f130c" text-anchor="middle">Agrega los platos del día</text>`}

    <line x1="115" y1="642" x2="965" y2="642" stroke="#1f130c" stroke-width="4" opacity="0.58"/>
    <text x="115" y="685" font-family="Arial, sans-serif" font-size="36" font-weight="900" fill="#1f130c">ACOMPAÑANTES</text>
    ${sidesSvg || `<text x="115" y="775" font-family="Arial, sans-serif" font-size="34" fill="#1f130c">• Escribe acompañantes...</text>`}
  </svg>`;
}

export default function GeneradorMenu() {
  const [platos, setPlatos] = useState([
    { nombre: "Carne en posta", precio: "20000" },
    { nombre: "Chuleta", precio: "19000" },
    { nombre: "Pechuga asada", precio: "17500" }
  ]);
  const [acompanantes, setAcompanantes] = useState("Arroz de maíz\nPuré de papa\nEnsalada\nTajadas maduras");
  const [mensaje, setMensaje] = useState("");

  const platosLimpios = platos.filter((p) => p.nombre.trim());
  const listaAcompanantes = limpiarLista(acompanantes);

  const svg = useMemo(
    () => crearSvgMenu({ platos: platosLimpios, acompanantes: listaAcompanantes }),
    [platos, acompanantes]
  );

  const svgTexto = useMemo(
    () => crearSvgMenuSoloTexto({ platos: platosLimpios, acompanantes: listaAcompanantes }),
    [platos, acompanantes]
  );

  const svgUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);
  const svgTextoUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgTexto)}`, [svgTexto]);

  function actualizarPlato(index, campo, valor) {
    setPlatos((actual) =>
      actual.map((plato, i) =>
        i === index ? { ...plato, [campo]: campo === "precio" ? limpiarPrecio(valor) : valor } : plato
      )
    );
  }

  function agregarPlato() {
    setPlatos((actual) => [...actual, { nombre: "", precio: "" }].slice(0, 8));
  }

  function quitarPlato(index) {
    setPlatos((actual) => actual.filter((_, i) => i !== index));
  }

  function descargarDesdeSvg(url, nombreArchivo, mensajeOk, transparente = false, ancho = 1080, alto = 1080) {
    setMensaje("");
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");
      if (!transparente) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(image, 0, 0);
      const link = document.createElement("a");
      link.download = nombreArchivo;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setMensaje(mensajeOk);
    };
    image.onerror = () => setMensaje("No se pudo descargar la imagen. Intenta de nuevo.");
    image.src = url;
  }

  function descargarImagen() {
    descargarDesdeSvg(svgUrl, "menu-rafiki-compacto.png", "Flyer compacto descargado correctamente.", false, 1080, 1080);
  }

  function descargarSoloTexto() {
    descargarDesdeSvg(svgTextoUrl, "menu-rafiki-solo-texto.png", "Imagen solo texto descargada con fondo transparente.", true, 1080, 930);
  }

  return (
    <section className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2>🎨 Generador de menú Rafiki</h2>
          <p className="muted">Crea una imagen compacta del menú para usarla en WhatsApp, Instagram o sobre una plantilla.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" className="button light" onClick={descargarSoloTexto}>
            Descargar solo texto
          </button>
          <button type="button" className="button" onClick={descargarImagen}>
            Descargar flyer compacto
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 420px)", gap: 22, alignItems: "start", marginTop: 18 }} className="generador-menu-grid">
        <div>
          <div className="box soft" style={{ marginTop: 0 }}>
            <strong>Platos del día</strong>
            <p className="muted small">Puedes agregar hasta 8 platos. Escribe el precio sin puntos si quieres.</p>
            {platos.map((plato, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 120px 38px", gap: 8, marginTop: 10, alignItems: "center" }}>
                <input
                  value={plato.nombre}
                  onChange={(e) => actualizarPlato(index, "nombre", e.target.value)}
                  placeholder="Nombre del plato"
                />
                <input
                  value={plato.precio}
                  onChange={(e) => actualizarPlato(index, "precio", e.target.value)}
                  placeholder="Precio"
                  inputMode="numeric"
                />
                <button type="button" className="button light" onClick={() => quitarPlato(index)} title="Quitar plato" style={{ padding: "10px 0" }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="button light" onClick={agregarPlato} style={{ marginTop: 12 }} disabled={platos.length >= 8}>
              + Agregar plato
            </button>
          </div>

          <label className="field" style={{ marginTop: 14 }}>
            <span>Acompañantes</span>
            <textarea value={acompanantes} onChange={(e) => setAcompanantes(e.target.value)} rows={5} placeholder="Arroz de maíz\nPuré\nEnsalada" />
          </label>

          {mensaje && <div className="alert alert-ok menu-action-message">{mensaje}</div>}
        </div>

        <div>
          <div className="box soft" style={{ marginBottom: 10 }}>
            <strong>Vista previa</strong>
            <p className="muted small">El botón “solo texto” descarga un PNG transparente para pegar sobre otra plantilla.</p>
          </div>
          <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 28px rgba(124,45,18,0.16)", background: "#fff" }}>
            <img src={svgUrl} alt="Vista previa menú Rafiki" style={{ display: "block", width: "100%", height: "auto" }} />
          </div>
        </div>
      </div>

      <style>{`
        .field { display: grid; gap: 7px; margin-bottom: 12px; }
        .field span { font-weight: 900; color: #3f2a1d; }
        .field input, .field textarea, .box input { width: 100%; border: 1px solid #fed7aa; border-radius: 14px; padding: 12px 13px; font: inherit; outline: none; background: #fff; box-sizing: border-box; }
        .field input:focus, .field textarea:focus, .box input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12); }
        @media (max-width: 860px) {
          .generador-menu-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 520px) {
          .box.soft div[style*="grid-template-columns: 1fr 120px 38px"] { grid-template-columns: 1fr 88px 34px !important; gap: 6px !important; }
          .box.soft input { padding: 10px 8px; font-size: 14px; }
        }
      `}</style>
    </section>
  );
}
