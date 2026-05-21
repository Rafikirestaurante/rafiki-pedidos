import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  limpiarLista,
  limpiarPrecio,
  precioVisible,
  fechaHoyISO,
  normalizarPlatos,
  formatearFechaInformeMenu,
  obtenerPlatosSinPrecio,
  crearSvgMenu,
  crearSvgMenuSoloTexto,
  generarTextoEditorMenu,
  generarTextoAcompanantesEditor,
  guardarUltimoTextoEditorGenerador
} from "../utils/generadorMenu";

export default function GeneradorMenu() {
  const [platos, setPlatos] = useState([
    { nombre: "Carne en posta", precio: "20000" },
    { nombre: "Chuleta", precio: "19000" },
    { nombre: "Pechuga asada", precio: "17500" }
  ]);
  const [acompanantes, setAcompanantes] = useState("Arroz de maíz\nPuré de papa\nEnsalada\nTajadas maduras");
  const [mensaje, setMensaje] = useState("");
  const [fechaMenu, setFechaMenu] = useState(fechaHoyISO());
  const [observaciones, setObservaciones] = useState("");
  const [guardandoHistorial, setGuardandoHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

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

  const textoEditorMenu = useMemo(() => generarTextoEditorMenu(platosLimpios), [platosLimpios]);
  const textoEditorAcompanantes = useMemo(() => generarTextoAcompanantesEditor(listaAcompanantes), [listaAcompanantes]);

  useEffect(() => {
    guardarUltimoTextoEditorGenerador({
      platosTexto: textoEditorMenu,
      acompanantesTexto: textoEditorAcompanantes
    });
  }, [textoEditorMenu, textoEditorAcompanantes]);

  const informeUltimosMenus = useMemo(() => {
    const unicosPorFecha = new Map();
    historial.forEach((registro) => {
      if (registro?.fecha && !unicosPorFecha.has(registro.fecha)) {
        unicosPorFecha.set(registro.fecha, registro);
      }
    });

    return Array.from(unicosPorFecha.values())
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
      .slice(-12);
  }, [historial]);

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
      const anchoReal = image.naturalWidth || ancho;
      const altoReal = image.naturalHeight || alto;

      // Importante: el SVG del generador puede crecer cuando hay varios platos
      // o acompañantes. Antes se forzaba a 1080x930/1080 y eso cortaba la
      // sección de acompañantes en el PNG descargado. Ahora el canvas toma el
      // tamaño real del SVG para exportar la imagen completa.
      canvas.width = anchoReal;
      canvas.height = altoReal;

      const ctx = canvas.getContext("2d");
      if (!transparente) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.download = nombreArchivo;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setMensaje(mensajeOk);
    };
    image.onerror = () => setMensaje("No se pudo descargar la imagen. Intenta de nuevo.");
    image.src = url;
  }

  async function copiarTextoGenerado(texto, mensajeOk) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setMensaje(mensajeOk);
    } catch (error) {
      setMensaje("No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente.");
    }
  }

  async function descargarSoloTexto() {
    const guardado = await guardarHistorialGenerador({ silencioso: true });
    if (!guardado) return;

    descargarDesdeSvg(
      svgTextoUrl,
      "menu-rafiki-solo-texto.png",
      "Imagen solo texto descargada y guardada en el historial.",
      true,
      1080,
      930
    );
  }

  async function cargarHistorialGenerador(opciones = {}) {
    setCargandoHistorial(true);
    const { data, error } = await supabase
      .from("historial_generador_menu")
      .select("id, fecha, platos, acompanantes, observaciones, creado_en")
      .order("fecha", { ascending: false })
      .order("creado_en", { ascending: false })
      .limit(21);

    if (error) {
      setMensaje(`No se pudo cargar el historial: ${error.message}`);
    } else {
      const registros = [];
      const fechasVistas = new Set();
      (data || []).forEach((registro) => {
        if (!fechasVistas.has(registro.fecha)) {
          fechasVistas.add(registro.fecha);
          registros.push(registro);
        }
      });
      setHistorial(registros);
      if (opciones.cargarUltimo && registros.length > 0) {
        cargarRegistro(registros[0], { silencioso: true });
      }
    }
    setCargandoHistorial(false);
  }

  async function guardarHistorialGenerador(opciones = {}) {
    const platosParaGuardar = normalizarPlatos(platos);
    const acompanantesParaGuardar = limpiarLista(acompanantes);

    if (!fechaMenu) {
      setMensaje("Selecciona la fecha del menú antes de guardar.");
      return false;
    }

    if (platosParaGuardar.length === 0 && acompanantesParaGuardar.length === 0) {
      setMensaje("Agrega al menos un plato o acompañante antes de guardar.");
      return false;
    }

    setGuardandoHistorial(true);
    setMensaje("");

    const registroParaGuardar = {
      fecha: fechaMenu,
      titulo: "Menú del día",
      platos: platosParaGuardar,
      acompanantes: acompanantesParaGuardar,
      texto_generado: svgTexto,
      observaciones: null
    };

    const { data: registroExistente, error: errorBuscar } = await supabase
      .from("historial_generador_menu")
      .select("id")
      .eq("fecha", fechaMenu)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorBuscar) {
      setMensaje(`No se pudo validar el historial del día: ${errorBuscar.message}`);
      setGuardandoHistorial(false);
      return false;
    }

    let error = null;
    let idGuardado = registroExistente?.id || null;

    if (registroExistente?.id) {
      const resultado = await supabase
        .from("historial_generador_menu")
        .update(registroParaGuardar)
        .eq("id", registroExistente.id);
      error = resultado.error;
    } else {
      const resultado = await supabase
        .from("historial_generador_menu")
        .insert(registroParaGuardar)
        .select("id")
        .single();
      error = resultado.error;
      idGuardado = resultado.data?.id || null;
    }

    if (error) {
      setMensaje(`No se pudo guardar el historial: ${error.message}`);
      setGuardandoHistorial(false);
      return false;
    }

    if (idGuardado) {
      await supabase
        .from("historial_generador_menu")
        .delete()
        .eq("fecha", fechaMenu)
        .neq("id", idGuardado);
    }

    if (!opciones.silencioso) {
      setMensaje(registroExistente?.id ? "Menú del día actualizado correctamente." : "Historial del generador guardado correctamente.");
    }
    await cargarHistorialGenerador({ cargarUltimo: false });

    setGuardandoHistorial(false);
    return true;
  }

  function cargarRegistro(registro, opciones = {}) {
    const platosRegistro = Array.isArray(registro.platos) ? registro.platos : [];
    const acompanantesRegistro = Array.isArray(registro.acompanantes) ? registro.acompanantes : [];

    setFechaMenu(registro.fecha || fechaHoyISO());
    setPlatos(
      platosRegistro.length
        ? platosRegistro.map((plato) => ({
            nombre: plato.nombre || "",
            precio: plato.precio ? String(plato.precio) : ""
          }))
        : [{ nombre: "", precio: "" }]
    );
    setAcompanantes(acompanantesRegistro.join("\n"));
    if (!opciones.silencioso) {
      setMensaje("Registro cargado en el generador. Puedes editarlo o descargarlo.");
    }
  }

  useEffect(() => {
    cargarHistorialGenerador({ cargarUltimo: true });
  }, []);

  return (
    <section className="card card-pad generador-menu">
      <div>
        <h2>🎨 Generador de menú Rafiki</h2>
        <p className="muted">Crea una imagen solo texto del menú para usarla en WhatsApp, Instagram o sobre una plantilla.</p>
      </div>

      <div className="generador-menu-grid">
        <div>
          <div className="box soft" style={{ marginTop: 0 }}>
            <strong>Fecha del menú</strong>
            <p className="muted small">Por defecto queda la fecha actual.</p>
            <label className="field" style={{ marginTop: 10 }}>
              <span>Fecha</span>
              <input type="date" value={fechaMenu} onChange={(e) => setFechaMenu(e.target.value || fechaHoyISO())} />
            </label>
          </div>

          <div className="box soft" style={{ marginTop: 14 }}>
            <strong>Platos del día</strong>
            <p className="muted small">Puedes agregar hasta 8 platos. Escribe el precio sin puntos si quieres.</p>
            {platos.map((plato, index) => (
              <div key={index} className="plato-menu-row">
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
            <textarea value={acompanantes} onChange={(e) => setAcompanantes(e.target.value)} rows={5} placeholder={"Arroz de maíz\nPuré\nEnsalada"} />
          </label>

          <div className="box soft acciones-generador" style={{ marginTop: 14 }}>
            <strong>Acciones</strong>
            <p className="muted small">Guarda automáticamente en el historial y descarga la imagen solo texto.</p>
            <button type="button" className="button download-text-button" onClick={descargarSoloTexto} disabled={guardandoHistorial}>
              {guardandoHistorial ? "Guardando..." : "Guardar y descargar"}
            </button>
          </div>

          <div className="box soft texto-editor-menu-box" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <div>
                <strong>Texto para Editor de Menú Diario</strong>
                <p className="muted small" style={{ marginBottom: 0 }}>Copia este bloque y pégalo en el editor de menú diario.</p>
              </div>
              <button type="button" className="button light" onClick={() => copiarTextoGenerado(textoEditorMenu, "Texto de platos copiado correctamente.")}>
                📋 Copiar platos
              </button>
            </div>
            <textarea className="texto-editor-menu-output" value={textoEditorMenu} readOnly rows={12} />
          </div>

          <div className="box soft texto-editor-menu-box" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <div>
                <strong>Acompañantes para Editor</strong>
                <p className="muted small" style={{ marginBottom: 0 }}>Los acompañantes con “o” se separan y siempre se agrega “Solo esos dos”.</p>
              </div>
              <button type="button" className="button light" onClick={() => copiarTextoGenerado(textoEditorAcompanantes, "Texto de acompañantes copiado correctamente.")}>
                📋 Copiar acompañantes
              </button>
            </div>
            <textarea className="texto-editor-menu-output" value={textoEditorAcompanantes} readOnly rows={7} />
          </div>

          {mensaje && <div className="alert alert-ok menu-action-message">{mensaje}</div>}
        </div>

        <div>
          <div className="box soft" style={{ marginBottom: 10 }}>
            <strong>Vista previa solo texto</strong>
            <p className="muted small">El PNG se descarga con fondo transparente para pegar sobre otra plantilla.</p>
          </div>
          <div className="preview-menu-frame">
            <img src={svgTextoUrl} alt="Vista previa menú Rafiki solo texto" style={{ display: "block", width: "100%", height: "auto" }} />
          </div>

          <div className="box soft" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <strong>Historial reciente</strong>
              <button type="button" className="button light" onClick={() => cargarHistorialGenerador({ cargarUltimo: false })} disabled={cargandoHistorial} style={{ padding: "8px 10px" }}>
                {cargandoHistorial ? "Cargando..." : "Actualizar"}
              </button>
            </div>
            {historial.length === 0 ? (
              <p className="muted small" style={{ marginBottom: 0 }}>Todavía no hay registros guardados.</p>
            ) : (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {historial.map((registro) => (
                  <button
                    key={registro.id}
                    type="button"
                    className="history-menu-item"
                    onClick={() => cargarRegistro(registro)}
                    title="Cargar este menú en el generador"
                  >
                    <strong>{registro.fecha}</strong>
                    <span>{Array.isArray(registro.platos) ? registro.platos.length : 0} platos · {Array.isArray(registro.acompanantes) ? registro.acompanantes.length : 0} acompañantes</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="box soft" style={{ marginTop: 14 }}>
            <div className="generador-box-header">
              <strong>Informe últimos 12 menús</strong>
              <span className="muted small">Solo platos, sin precios</span>
            </div>
            {informeUltimosMenus.length === 0 ? (
              <p className="muted small" style={{ marginBottom: 0 }}>Guarda menús en el historial para ver el informe.</p>
            ) : (
              <div className="informe-menu-scroll">
                <table className="informe-menu-tabla">
                  <thead>
                    <tr>
                      {informeUltimosMenus.map((registro) => {
                        const fechaInforme = formatearFechaInformeMenu(registro.fecha);
                        return (
                          <th key={registro.fecha}>
                            <span className="informe-menu-dia">{fechaInforme.diaSemana}</span>
                            <span className="informe-menu-fecha">{fechaInforme.fechaCorta}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {informeUltimosMenus.map((registro) => {
                        const platosRegistro = obtenerPlatosSinPrecio(registro);
                        return (
                          <td key={registro.fecha}>
                            {platosRegistro.length ? (
                              <ul>
                                {platosRegistro.map((plato, index) => (
                                  <li key={`${registro.fecha}-${index}`}>{plato}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="muted small">Sin platos</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .generador-menu { width: 100%; max-width: 100%; overflow: visible; }
        .generador-menu, .generador-menu * { min-width: 0; }
        .generador-menu h2 { line-height: 1.05; }
        .generador-menu-grid { width: 100%; max-width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 420px); gap: 22px; align-items: start; margin-top: 18px; }
        .plato-menu-row { display: grid; grid-template-columns: minmax(0, 1fr) 120px 38px; gap: 8px; margin-top: 10px; align-items: center; }
        .field { display: grid; gap: 7px; margin-bottom: 12px; }
        .field span { font-weight: 900; color: #3f2a1d; }
        .field input, .field textarea, .box input { width: 100%; max-width: 100%; border: 1px solid #fed7aa; border-radius: 14px; padding: 12px 13px; font: inherit; outline: none; background: #fff; box-sizing: border-box; }
        .field input:focus, .field textarea:focus, .box input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12); }
        .texto-editor-menu-box { border-color: #fdba74; background: linear-gradient(180deg, #fff7ed, #fff); }
        .texto-editor-menu-output { width: 100%; margin-top: 12px; border: 1px solid #fed7aa; border-radius: 16px; background: #fff; color: #2f1b10; padding: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 13px; line-height: 1.45; resize: vertical; box-sizing: border-box; white-space: pre; }
        .texto-editor-menu-output:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12); outline: none; }
        .preview-menu-frame { width: 100%; max-width: 100%; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 28px rgba(124,45,18,0.16); background: #fff; }
        .preview-menu-frame img { max-width: 100%; height: auto; }
        .generador-box-header { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
        .history-menu-item { width: 100%; border: 1px solid #fed7aa; border-radius: 14px; background: #fff; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px; text-align: left; cursor: pointer; color: #3f2a1d; }
        .history-menu-item span { color: #8a5a32; font-size: 13px; font-weight: 800; }
        .history-menu-item:hover { border-color: #f97316; box-shadow: 0 4px 12px rgba(124,45,18,0.08); }
        .informe-menu-scroll { width: 100%; max-width: 100%; margin-top: 12px; overflow-x: auto; overflow-y: hidden; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
        .informe-menu-tabla { width: max-content; min-width: 1080px; max-width: none; border-collapse: collapse; background: #fff; border: 1px solid #fed7aa; border-radius: 16px; overflow: hidden; }
        .informe-menu-tabla th { background: #fff7ed; color: #7c2d12; padding: 10px 12px; border: 1px solid #fed7aa; white-space: nowrap; text-align: center; }
        .informe-menu-dia { display: block; font-size: 13px; font-weight: 950; line-height: 1.15; }
        .informe-menu-fecha { display: block; margin-top: 3px; font-size: 12.5px; font-weight: 800; color: #9a3412; line-height: 1.15; }
        .informe-menu-tabla td { vertical-align: top; width: 210px; min-width: 210px; max-width: 210px; padding: 12px 14px; border: 1px solid #fed7aa; color: #3f2a1d; }
        .informe-menu-tabla ul { margin: 0; padding-left: 16px; display: grid; gap: 6px; }
        .informe-menu-tabla li { font-size: 12.5px; font-weight: 800; line-height: 1.3; overflow-wrap: normal; word-break: normal; hyphens: none; white-space: normal; }
        .download-text-button { background: linear-gradient(135deg, #dc2626, #f97316); color: #fff; border: none; box-shadow: 0 10px 22px rgba(220, 38, 38, 0.24); }
        .download-text-button:hover { transform: translateY(-1px); filter: brightness(1.02); }
        @media (max-width: 860px) {
          .generador-menu-grid { grid-template-columns: 1fr !important; gap: 16px; }
        }
        @media (max-width: 640px) {
          .generador-menu.card-pad { padding: 14px !important; border-radius: 22px; }
          .generador-menu h2 { font-size: 24px; }
          .plato-menu-row { grid-template-columns: minmax(0, 1fr) 92px 34px; gap: 6px; }
          .box.soft input, .field input, .field textarea { padding: 10px 8px; font-size: 14px; }
          .acciones-generador .button, .generador-menu .button { width: 100%; justify-content: center; }
          .history-menu-item { align-items: flex-start; flex-direction: column; }
          .preview-menu-frame { border-radius: 18px; }
          .informe-menu-tabla { min-width: 1080px; }
          .informe-menu-tabla td { width: 165px; min-width: 165px; max-width: 165px; padding: 10px; }
        }
        @media (max-width: 420px) {
          .plato-menu-row { grid-template-columns: 1fr; }
          .plato-menu-row .button { width: 100%; }
        }
      `}</style>
    </section>
  );
}