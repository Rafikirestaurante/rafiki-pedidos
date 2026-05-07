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
      const y = 345 + index * 76;
      const lineas = wrapText(plato.nombre || "Plato", 28);
      const nombreSvg = lineas
        .map((linea, i) => `<text x="180" y="${y + i * 27}" font-family="Arial, sans-serif" font-size="31" font-weight="800" fill="#3b2415">${escapeSvg(linea)}</text>`)
        .join("");

      return `
        <rect x="110" y="${y - 45}" width="860" height="60" rx="22" fill="${index % 2 === 0 ? "#fff8ed" : "#ffffff"}" opacity="0.96"/>
        <circle cx="145" cy="${y - 15}" r="10" fill="#f59e0b"/>
        ${nombreSvg}
        <text x="910" y="${y}" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#8b1e16" text-anchor="end">$${escapeSvg(precioVisible(plato.precio))}</text>
      `;
    })
    .join("");

  const extrasSvg = extras
    .map((item, index) => `<text x="165" y="${930 + index * 38}" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#3b2415">• ${escapeSvg(item)}</text>`)
    .join("");

  const sidesSvg = sides
    .map((item, index) => `<text x="610" y="${930 + index * 38}" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#3b2415">• ${escapeSvg(item)}</text>`)
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff7ed"/>
        <stop offset="0.55" stop-color="#fffaf3"/>
        <stop offset="1" stop-color="#fde68a"/>
      </linearGradient>
      <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f97316"/>
        <stop offset="1" stop-color="#f59e0b"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#7c2d12" flood-opacity="0.20"/>
      </filter>
    </defs>

    <rect width="1080" height="1350" fill="url(#bg)"/>
    <circle cx="80" cy="90" r="160" fill="#fed7aa" opacity="0.55"/>
    <circle cx="1015" cy="1240" r="230" fill="#fdba74" opacity="0.45"/>

    <rect x="70" y="60" width="940" height="1230" rx="48" fill="#ffffff" opacity="0.88" filter="url(#shadow)"/>
    <rect x="95" y="85" width="890" height="1180" rx="40" fill="none" stroke="#fb923c" stroke-width="5" opacity="0.75"/>

    <text x="540" y="150" font-family="Arial, sans-serif" font-size="74" font-weight="900" fill="#8b1e16" text-anchor="middle">RAFIKI</text>
    <text x="540" y="202" font-family="Arial, sans-serif" font-size="31" font-weight="800" fill="#7c2d12" text-anchor="middle">ALMUERZO DEL DÍA</text>

    <rect x="310" y="225" width="460" height="72" rx="34" fill="url(#orange)"/>
    <text x="540" y="274" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">${escapeSvg(fecha || fechaHoy)}</text>

    <rect x="110" y="315" width="860" height="570" rx="34" fill="#fff3e0" stroke="#fed7aa" stroke-width="4"/>
    <text x="540" y="365" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#9a3412" text-anchor="middle">PLATOS DISPONIBLES</text>
    ${rowsSvg}

    <rect x="110" y="900" width="410" height="300" rx="34" fill="#fff8ed" stroke="#fed7aa" stroke-width="4"/>
    <text x="315" y="875" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#ffffff" text-anchor="middle"></text>
    <rect x="145" y="850" width="340" height="60" rx="28" fill="#8b1e16"/>
    <text x="315" y="891" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">TAMBIÉN TENEMOS</text>
    ${extrasSvg || `<text x="165" y="940" font-family="Arial, sans-serif" font-size="28" fill="#78716c">• Escribe opciones...</text>`}

    <rect x="560" y="900" width="410" height="300" rx="34" fill="#fff8ed" stroke="#fed7aa" stroke-width="4"/>
    <rect x="595" y="850" width="340" height="60" rx="28" fill="#8b1e16"/>
    <text x="765" y="891" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">ACOMPAÑANTES</text>
    ${sidesSvg || `<text x="610" y="940" font-family="Arial, sans-serif" font-size="28" fill="#78716c">• Escribe acompañantes...</text>`}

    <rect x="180" y="1220" width="720" height="70" rx="34" fill="url(#orange)"/>
    <text x="540" y="1265" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#ffffff" text-anchor="middle">PARA LLEVAR +$${escapeSvg(precioVisible(paraLlevar))}</text>
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

  const svgUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);

  function actualizarPlato(index, campo, valor) {
    setPlatos((actual) => actual.map((plato, i) => (i === index ? { ...plato, [campo]: campo === "precio" ? limpiarPrecio(valor) : valor } : plato)));
  }

  function agregarPlato() {
    setPlatos((actual) => [...actual, { nombre: "", precio: "" }].slice(0, 7));
  }

  function quitarPlato(index) {
    setPlatos((actual) => actual.filter((_, i) => i !== index));
  }

  async function descargarImagen() {
    setMensaje("");
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const link = document.createElement("a");
      link.download = `menu-rafiki-${fecha.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setMensaje("Imagen descargada correctamente.");
    };
    image.onerror = () => setMensaje("No se pudo descargar la imagen. Intenta de nuevo.");
    image.src = svgUrl;
  }

  return (
    <section className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2>🎨 Generador de menú Rafiki</h2>
          <p className="muted">Crea una imagen del menú diario lista para WhatsApp e Instagram.</p>
        </div>
        <button type="button" className="button" onClick={descargarImagen}>
          Descargar imagen
        </button>
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
            <p className="muted small">Cuando esté listo, presiona “Descargar imagen”.</p>
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
