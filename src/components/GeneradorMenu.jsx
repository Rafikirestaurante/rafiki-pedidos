import React, { useMemo, useRef, useState } from "react";

const fechaHoy = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "numeric",
  month: "long"
}).format(new Date());

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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wrapText(texto, max = 24) {
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

function crearSvgMenu({ fecha, platos, tambien, acompanantes, paraLlevar }) {
  const width = 1080;
  const height = 1350;
  const rows = platos.slice(0, 7);
  const extras = tambien.slice(0, 5);
  const sides = acompanantes.slice(0, 7);

  const rowsSvg = rows
    .map((plato, index) => {
      const y = 394 + index * 82;
      const lineas = wrapText(plato.nombre || "Plato", 30);
      const nombreSvg = lineas
        .map(
          (linea, i) =>
            `<text x="174" y="${y + i * 28}" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#2f1b10">${escapeSvg(linea)}</text>`
        )
        .join("");

      return `
        <rect x="112" y="${y - 50}" width="856" height="68" rx="26" fill="${index % 2 === 0 ? "#fffaf2" : "#ffffff"}" stroke="#f8dfba" stroke-width="2"/>
        <circle cx="145" cy="${y - 16}" r="9" fill="#d97706"/>
        ${nombreSvg}
        <line x1="500" y1="${y - 10}" x2="768" y2="${y - 10}" stroke="#d6b88a" stroke-width="3" stroke-dasharray="7 12" opacity="0.75"/>
        <text x="924" y="${y}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#8b1e16" text-anchor="end">$${escapeSvg(precioVisible(plato.precio))}</text>
      `;
    })
    .join("");

  const extrasSvg = extras
    .map(
      (item, index) =>
        `<text x="156" y="${955 + index * 42}" font-family="Arial, sans-serif" font-size="29" font-weight="800" fill="#321b0f">• ${escapeSvg(item)}</text>`
    )
    .join("");

  const sidesSvg = sides
    .map(
      (item, index) =>
        `<text x="600" y="${955 + index * 42}" font-family="Arial, sans-serif" font-size="29" font-weight="800" fill="#321b0f">• ${escapeSvg(item)}</text>`
    )
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff7ed"/>
        <stop offset="0.52" stop-color="#fffaf3"/>
        <stop offset="1" stop-color="#f6d38c"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#b45309"/>
        <stop offset="0.5" stop-color="#f59e0b"/>
        <stop offset="1" stop-color="#92400e"/>
      </linearGradient>
      <linearGradient id="wine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#9f2419"/>
        <stop offset="1" stop-color="#5f150f"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#7c2d12" flood-opacity="0.22"/>
      </filter>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#7c2d12" flood-opacity="0.12"/>
      </filter>
    </defs>

    <rect width="1080" height="1350" fill="url(#bg)"/>
    <circle cx="90" cy="110" r="190" fill="#fed7aa" opacity="0.48"/>
    <circle cx="1010" cy="1185" r="260" fill="#fdba74" opacity="0.38"/>
    <circle cx="1000" cy="120" r="115" fill="#fff7ed" opacity="0.70"/>

    <rect x="58" y="55" width="964" height="1240" rx="58" fill="#ffffff" opacity="0.94" filter="url(#shadow)"/>
    <rect x="84" y="82" width="912" height="1186" rx="46" fill="none" stroke="#b45309" stroke-width="4" opacity="0.55"/>
    <rect x="104" y="102" width="872" height="1146" rx="38" fill="none" stroke="#fde7c3" stroke-width="6" opacity="0.9"/>

    <circle cx="540" cy="156" r="70" fill="url(#wine)" filter="url(#softShadow)"/>
    <text x="540" y="178" font-family="Georgia, serif" font-size="72" font-weight="900" fill="#fff8ed" text-anchor="middle">R</text>
    <text x="540" y="260" font-family="Arial, sans-serif" font-size="52" font-weight="900" fill="#7f1d1d" text-anchor="middle" letter-spacing="3">RAFIKI</text>
    <text x="540" y="306" font-family="Arial, sans-serif" font-size="35" font-weight="900" fill="#3b2415" text-anchor="middle" letter-spacing="2">MENÚ DEL DÍA</text>

    <rect x="318" y="329" width="444" height="64" rx="32" fill="url(#gold)"/>
    <text x="540" y="371" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#ffffff" text-anchor="middle">${escapeSvg(fecha || fechaHoy)}</text>

    <rect x="96" y="414" width="888" height="462" rx="36" fill="#fff3df" stroke="#efc68e" stroke-width="4"/>
    <rect x="320" y="418" width="440" height="54" rx="26" fill="url(#wine)"/>
    <text x="540" y="455" font-family="Arial, sans-serif" font-size="27" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">PLATOS DISPONIBLES</text>
    ${rowsSvg || `<text x="540" y="610" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#78716c" text-anchor="middle">Agrega los platos del día</text>`}

    <rect x="110" y="910" width="408" height="250" rx="34" fill="#fffaf2" stroke="#efc68e" stroke-width="4" filter="url(#softShadow)"/>
    <rect x="146" y="883" width="336" height="58" rx="29" fill="url(#wine)"/>
    <text x="314" y="922" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="#ffffff" text-anchor="middle">TAMBIÉN TENEMOS</text>
    ${extrasSvg || `<text x="156" y="965" font-family="Arial, sans-serif" font-size="27" fill="#78716c">• Escribe opciones...</text>`}

    <rect x="562" y="910" width="408" height="250" rx="34" fill="#fffaf2" stroke="#efc68e" stroke-width="4" filter="url(#softShadow)"/>
    <rect x="598" y="883" width="336" height="58" rx="29" fill="url(#wine)"/>
    <text x="766" y="922" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="#ffffff" text-anchor="middle">ACOMPAÑANTES</text>
    ${sidesSvg || `<text x="600" y="965" font-family="Arial, sans-serif" font-size="27" fill="#78716c">• Escribe acompañantes...</text>`}

    <rect x="180" y="1190" width="720" height="74" rx="37" fill="url(#gold)" filter="url(#softShadow)"/>
    <text x="540" y="1238" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#ffffff" text-anchor="middle">PARA LLEVAR +$${escapeSvg(precioVisible(paraLlevar))}</text>

    <text x="540" y="1308" font-family="Arial, sans-serif" font-size="25" font-weight="800" fill="#7c2d12" text-anchor="middle">Rafiki Restaurante • Barranquilla</text>
  </svg>`;
}

function crearSvgMenuSoloTexto({ fecha, platos, tambien, acompanantes, paraLlevar }) {
  const width = 1080;
  const height = 1350;
  const rows = platos.slice(0, 8);
  const extras = tambien.slice(0, 7);
  const sides = acompanantes.slice(0, 8);

  const rowsSvg = rows
    .map((plato, index) => {
      const y = 285 + index * 78;
      const lineas = wrapText(plato.nombre || "Plato", 31);
      const nombreSvg = lineas
        .map(
          (linea, i) =>
            `<text x="115" y="${y + i * 31}" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#1f130c">${escapeSvg(linea)}</text>`
        )
        .join("");

      return `
        ${nombreSvg}
        <line x1="520" y1="${y - 12}" x2="765" y2="${y - 12}" stroke="#1f130c" stroke-width="3" stroke-dasharray="7 14" opacity="0.72"/>
        <text x="965" y="${y + 2}" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#1f130c" text-anchor="end">$${escapeSvg(precioVisible(plato.precio))}</text>
      `;
    })
    .join("");

  const extrasStartY = 930;
  const extrasSvg = extras
    .map(
      (item, index) =>
        `<text x="115" y="${extrasStartY + index * 44}" font-family="Arial, sans-serif" font-size="35" font-weight="800" fill="#1f130c">• ${escapeSvg(item)}</text>`
    )
    .join("");

  const sidesSvg = sides
    .map(
      (item, index) =>
        `<text x="585" y="${extrasStartY + index * 44}" font-family="Arial, sans-serif" font-size="35" font-weight="800" fill="#1f130c">• ${escapeSvg(item)}</text>`
    )
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <text x="540" y="105" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#1f130c" text-anchor="middle" letter-spacing="3">MENÚ DEL DÍA</text>
    <text x="540" y="158" font-family="Arial, sans-serif" font-size="40" font-weight="900" fill="#1f130c" text-anchor="middle">${escapeSvg(fecha || fechaHoy)}</text>
    <line x1="150" y1="198" x2="930" y2="198" stroke="#1f130c" stroke-width="5" opacity="0.75"/>

    ${rowsSvg || `<text x="540" y="410" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#1f130c" text-anchor="middle">Agrega los platos del día</text>`}

    <line x1="115" y1="835" x2="965" y2="835" stroke="#1f130c" stroke-width="4" opacity="0.60"/>
    <text x="115" y="890" font-family="Arial, sans-serif" font-size="39" font-weight="900" fill="#1f130c">TAMBIÉN TENEMOS</text>
    <text x="585" y="890" font-family="Arial, sans-serif" font-size="39" font-weight="900" fill="#1f130c">ACOMPAÑANTES</text>
    ${extrasSvg || `<text x="115" y="930" font-family="Arial, sans-serif" font-size="35" fill="#1f130c">• Escribe opciones...</text>`}
    ${sidesSvg || `<text x="585" y="930" font-family="Arial, sans-serif" font-size="35" fill="#1f130c">• Escribe acompañantes...</text>`}

    <text x="540" y="1280" font-family="Arial, sans-serif" font-size="45" font-weight="900" fill="#1f130c" text-anchor="middle">PARA LLEVAR +$${escapeSvg(precioVisible(paraLlevar))}</text>
  </svg>`;
}

export default function GeneradorMenu() {
  const [fecha, setFecha] = useState(fechaHoy);
  const [platos, setPlatos] = useState([
    { nombre: "Carne en posta", precio: "20000" },
    { nombre: "Chuleta", precio: "19000" },
    { nombre: "Pechuga asada", precio: "17500" }
  ]);
  const [tambien, setTambien] = useState("Mote de queso\nAjiaco\nSancocho");
  const [acompanantes, setAcompanantes] = useState("Arroz de maíz\nPuré de papa\nEnsalada\nTajadas maduras");
  const [paraLlevar, setParaLlevar] = useState("1500");
  const [mensaje, setMensaje] = useState("");
  const previewRef = useRef(null);

  const svg = useMemo(
    () =>
      crearSvgMenu({
        fecha,
        platos: platos.filter((p) => p.nombre.trim()),
        tambien: limpiarLista(tambien),
        acompanantes: limpiarLista(acompanantes),
        paraLlevar
      }),
    [fecha, platos, tambien, acompanantes, paraLlevar]
  );

  const svgTexto = useMemo(
    () =>
      crearSvgMenuSoloTexto({
        fecha,
        platos: platos.filter((p) => p.nombre.trim()),
        tambien: limpiarLista(tambien),
        acompanantes: limpiarLista(acompanantes),
        paraLlevar
      }),
    [fecha, platos, tambien, acompanantes, paraLlevar]
  );

  const svgUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);
  const svgTextoUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgTexto)}`, [svgTexto]);

  function actualizarPlato(index, campo, valor) {
    setPlatos((actual) => actual.map((plato, i) => (i === index ? { ...plato, [campo]: campo === "precio" ? limpiarPrecio(valor) : valor } : plato)));
  }

  function agregarPlato() {
    setPlatos((actual) => [...actual, { nombre: "", precio: "" }].slice(0, 7));
  }

  function quitarPlato(index) {
    setPlatos((actual) => actual.filter((_, i) => i !== index));
  }

  function descargarDesdeSvg(url, nombreArchivo, mensajeOk, transparente = false) {
    setMensaje("");
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
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
    descargarDesdeSvg(
      svgUrl,
      `menu-rafiki-${fecha.replace(/\s+/g, "-").toLowerCase()}.png`,
      "Imagen descargada correctamente.",
      false
    );
  }

  function descargarSoloTexto() {
    descargarDesdeSvg(
      svgTextoUrl,
      `menu-rafiki-solo-texto-${fecha.replace(/\s+/g, "-").toLowerCase()}.png`,
      "Imagen solo texto descargada con fondo transparente.",
      true
    );
  }

  return (
    <section className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2>🎨 Generador de menú Rafiki</h2>
          <p className="muted">Crea una imagen del menú diario lista para WhatsApp e Instagram.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" className="button light" onClick={descargarSoloTexto}>
            Descargar solo texto
          </button>
          <button type="button" className="button" onClick={descargarImagen}>
            Descargar flyer
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 420px)", gap: 22, alignItems: "start", marginTop: 18 }} className="generador-menu-grid">
        <div>
          <label className="field">
            <span>Fecha del menú</span>
            <input value={fecha} onChange={(e) => setFecha(e.target.value)} placeholder="7 Mayo" />
          </label>

          <div className="box soft" style={{ marginTop: 14 }}>
            <strong>Platos del día</strong>
            <p className="muted small">Puedes agregar hasta 7 platos. Escribe el precio sin puntos si quieres.</p>
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
            <button type="button" className="button light" onClick={agregarPlato} style={{ marginTop: 12 }} disabled={platos.length >= 7}>
              + Agregar plato
            </button>
          </div>

          <label className="field" style={{ marginTop: 14 }}>
            <span>También tenemos</span>
            <textarea value={tambien} onChange={(e) => setTambien(e.target.value)} rows={5} placeholder="Mote de queso\nAjiaco\nSancocho" />
          </label>

          <label className="field">
            <span>Acompañantes</span>
            <textarea value={acompanantes} onChange={(e) => setAcompanantes(e.target.value)} rows={6} placeholder="Arroz de maíz\nPuré\nEnsalada" />
          </label>

          <label className="field">
            <span>Valor para llevar</span>
            <input value={paraLlevar} onChange={(e) => setParaLlevar(limpiarPrecio(e.target.value))} placeholder="1500" inputMode="numeric" />
          </label>

          {mensaje && <div className="alert alert-ok menu-action-message">{mensaje}</div>}
        </div>

        <div>
          <div className="box soft" style={{ marginBottom: 10 }}>
            <strong>Vista previa</strong>
            <p className="muted small">Puedes descargar el flyer completo o solo el texto en PNG transparente.</p>
          </div>
          <div ref={previewRef} style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 28px rgba(124,45,18,0.16)", background: "#fff" }}>
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
