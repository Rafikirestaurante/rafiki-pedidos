import { useEffect, useRef, useState } from "react";
import "./kiara.css";
const dinero = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    n || 0
  );
const hora = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const saludo = {
  role: "model",
  text: "¡Hola! Soy Kiara 👋\n¿Qué te gustaría pedir hoy? Escríbeme o explora el menú.",
  hora: hora()
};
const STORAGE = "rafiki-kiara-v1";
function inicial() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE)) || {};
  } catch {
    return {};
  }
}
function Icono({ tipo }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tipo === "enviar" ? (
        <>
          <path d="m5 12 14-7-4 14-3-6-7-1Z" />
          <path d="m12 13 7-8" />
        </>
      ) : tipo === "menu" ? (
        <>
          <path d="M5 5h14v15H5zM9 5V3m6 2V3M9 10h6m-6 4h6" />
        </>
      ) : (
        <>
          <path d="M5 7h14l-1 13H6L5 7ZM9 7V5a3 3 0 0 1 6 0v2" />
        </>
      )}
    </svg>
  );
}
function Hoja({ titulo, cerrar, children }) {
  const ref = useRef();
  const cerrarRef = useRef(cerrar);
  cerrarRef.current = cerrar;
  useEffect(() => {
    const anterior = document.activeElement;
    const elementos = () => [
      ...ref.current.querySelectorAll('button:not(:disabled),input,select,textarea,[tabindex="0"]')
    ];
    elementos()[0]?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrarRef.current();
      }
      if (e.key === "Tab") {
        const lista = elementos();
        const primero = lista[0],
          ultimo = lista[lista.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo?.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      anterior?.focus();
    };
  }, []);
  return (
    <div
      className="kiara-velo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <section className="kiara-hoja" role="dialog" aria-modal="true" aria-label={titulo} ref={ref}>
        <header>
          <h2>{titulo}</h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar">
            ✕
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export default function Kiara() {
  const [guardado] = useState(inicial);
  const [mensajes, setMensajes] = useState(guardado.mensajes || [saludo]);
  const [token, setToken] = useState(guardado.token || "");
  const [carrito, setCarrito] = useState(guardado.carrito || []);
  const [catalogo, setCatalogo] = useState([]);
  const [total, setTotal] = useState(guardado.total || 0);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");
  const [hoja, setHoja] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [producto, setProducto] = useState(null);
  const [opciones, setOpciones] = useState({});
  const [cantidad, setCantidad] = useState(1);
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", pago: "Efectivo", notas: "" });
  const [pedido, setPedido] = useState(guardado.pedido || null);
  const fin = useRef();
  const bloqueo = useRef(false);
  const cerrar = () => {
    if (!bloqueo.current) setHoja("");
  };
  useEffect(() => {
    const t = document.title;
    document.title = "Kiara · Asistente Virtual Rafiki";
    return () => {
      document.title = t;
    };
  }, []);
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, ocupado]);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE,
        JSON.stringify({ mensajes: mensajes.slice(-40), token, carrito, total, pedido })
      );
    } catch {
      /* Navegación privada sin almacenamiento. */
    }
  }, [mensajes, token, carrito, total, pedido]);
  async function pedir(payload, tokenActual = token) {
    const respuesta = await fetch("/api/kiara", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, token: tokenActual }),
      signal: AbortSignal.timeout(55000)
    });
    let data;
    try {
      data = await respuesta.json();
    } catch {
      throw new Error("No se pudo conectar con Kiara. Intenta de nuevo.");
    }
    if (!respuesta.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
    return data;
  }
  function aplicar(d) {
    setToken(d.token);
    setCarrito(d.carrito);
    setTotal(d.total);
    setCatalogo(d.catalogo);
    setListo(true);
  }
  useEffect(() => {
    let activo = true;
    if (guardado.pedido) return;
    pedir({ accion: "iniciar" }, guardado.token || "")
      .then((d) => {
        if (activo) aplicar(d);
      })
      .catch((e) => {
        if (activo) setError(e.message);
      });
    return () => {
      activo = false;
    };
  }, []);
  function agregarMensaje(role, text) {
    setMensajes((m) => [...m, { role, text, hora: hora() }]);
  }
  async function ejecutar(accion) {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    try {
      await accion();
    } catch (e) {
      setError(
        e.name === "TimeoutError"
          ? "La respuesta tardó demasiado. Intenta de nuevo; tu pedido sigue guardado."
          : e.message
      );
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }
  async function enviar(e) {
    e.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || !listo || pedido || bloqueo.current) return;
    const historial = mensajes.slice(-12).map(({ role, text }) => ({ role, text }));
    setTexto("");
    agregarMensaje("user", mensaje);
    await ejecutar(async () => {
      const d = await pedir({ accion: "chat", mensaje, historial });
      aplicar(d);
      agregarMensaje("model", d.respuesta);
    });
  }
  async function actualizar(nuevo, cerrarAlTerminar = false) {
    await ejecutar(async () => {
      const d = await pedir({ accion: "carrito", carrito: nuevo });
      aplicar(d);
      if (cerrarAlTerminar) {
        setProducto(null);
        setHoja("");
        agregarMensaje("model", d.respuesta);
      }
    });
  }
  function nuevoPedido() {
    if (bloqueo.current) return;
    setPedido(null);
    setHoja("");
    setToken("");
    setCarrito([]);
    setTotal(0);
    setMensajes([saludo]);
    setCliente({ nombre: "", telefono: "", pago: "Efectivo", notas: "" });
    setListo(false);
    ejecutar(async () => {
      aplicar(await pedir({ accion: "iniciar" }, ""));
    });
  }
  function escoger(p) {
    setProducto(p);
    setOpciones({});
    setCantidad(1);
    setError("");
    setHoja("producto");
  }
  function agregarProducto(e) {
    e.preventDefault();
    const linea = { productoId: producto.id, cantidad: Number(cantidad), opciones };
    const anterior = carrito.findIndex(
      (l) => l.productoId === linea.productoId && JSON.stringify(l.opciones) === JSON.stringify(opciones)
    );
    const nuevo = carrito.map((l) => ({ ...l }));
    if (anterior >= 0) nuevo[anterior].cantidad += linea.cantidad;
    else nuevo.push(linea);
    actualizar(nuevo, true);
  }
  async function abrirPedido() {
    setHoja("pedido");
    await ejecutar(async () => {
      aplicar(await pedir({ accion: "iniciar" }));
    });
  }
  async function confirmar(e) {
    e.preventDefault();
    await ejecutar(async () => {
      const d = await pedir({ accion: "confirmar", confirmado: true, cliente });
      setPedido(d.pedido);
      setHoja("");
      agregarMensaje("model", `${d.respuesta}\nPedido #${d.pedido.numero} · ${dinero(d.pedido.total)}`);
    });
  }
  const unidades = carrito.reduce((s, l) => s + l.cantidad, 0);
  const productosFiltrados = catalogo.filter((p) =>
    `${p.nombre} ${p.categoria}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(
        busqueda
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      )
  );
  const avisoError = error && (
    <div className="kiara-error" role="alert">
      {error}
      <button onClick={nuevoPedido} disabled={ocupado} type="button">
        Iniciar de nuevo
      </button>
    </div>
  );
  return (
    <main className="kiara-chat">
      <header className="kiara-cabecera">
        <div className="kiara-avatar">
          K<span />
        </div>
        <div className="kiara-identidad">
          <h1>Kiara</h1>
          <p>Asistente Virtual Rafiki</p>
        </div>
        <button
          className="kiara-icono"
          onClick={() => setHoja("ayuda")}
          aria-label="Información y nuevo pedido"
        >
          ⋯
        </button>
      </header>
      <div className="kiara-conversacion" aria-label="Conversación con Kiara" role="log" aria-live="polite">
        <span className="kiara-fecha">Hoy</span>
        <span className="kiara-bienvenida">Tus antojos, a un mensaje de distancia.</span>
        {mensajes.map((m, i) => (
          <div key={i} className={`kiara-burbuja ${m.role === "user" ? "kiara-propia" : ""}`}>
            <p>{m.text}</p>
            <span className="kiara-hora">
              {m.hora}
              {m.role === "user" && <span aria-label="Enviado"> ✓</span>}
            </span>
          </div>
        ))}
        {ocupado && (
          <div className="kiara-burbuja kiara-escribiendo" role="status">
            Kiara está respondiendo<span>•••</span>
          </div>
        )}
        <div ref={fin} />
      </div>
      <footer className="kiara-pie">
        {!hoja && avisoError}
        {pedido ? (
          <div className="kiara-exito">
            <strong>✓ Pedido #{pedido.numero} registrado</strong>
            <span>Para recoger en Rafiki · {dinero(pedido.total)}</span>
            <button type="button" className="kiara-primario" onClick={nuevoPedido}>
              Hacer otro pedido
            </button>
          </div>
        ) : (
          <>
            <div className="kiara-atajos">
              <button
                disabled={!listo || ocupado}
                onClick={() => {
                  setHoja("menu");
                  setBusqueda("");
                }}
              >
                <Icono tipo="menu" />
                Ver menú
              </button>
              <button disabled={!listo || ocupado} onClick={abrirPedido}>
                <Icono tipo="bolsa" />
                Ver mi pedido{unidades > 0 && <b>{unidades}</b>}
              </button>
            </div>
            {unidades > 0 && (
              <button disabled={ocupado} className="kiara-resumen" onClick={abrirPedido}>
                <span>
                  {unidades} {unidades === 1 ? "producto" : "productos"} en tu pedido
                </span>
                <strong>
                  {dinero(total)} <span aria-hidden="true">›</span>
                </strong>
              </button>
            )}
            <form className="kiara-compositor" onSubmit={enviar}>
              <input
                aria-label="Mensaje para Kiara"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={1500}
                placeholder="Escribe un mensaje…"
                disabled={!listo || ocupado}
              />
              <button disabled={!listo || ocupado || !texto.trim()} aria-label="Enviar mensaje">
                <Icono tipo="enviar" />
              </button>
            </form>
          </>
        )}
      </footer>
      {hoja && (
        <Hoja
          titulo={
            { menu: "Nuestro menú", producto: producto?.nombre, pedido: "Tu pedido", ayuda: "Kiara" }[hoja]
          }
          cerrar={cerrar}
        >
          <div className="kiara-hoja-cuerpo">
            {avisoError}
            {hoja === "ayuda" && (
              <>
                <p>
                  Soy el Asistente Virtual Rafiki. Puedes escribirme para elegir productos y revisar tu pedido
                  antes de confirmarlo.
                </p>
                <p>
                  Por ahora, los pedidos de Kiara son para recoger en el local. Para pedidos de Restaurante,
                  visita <a href="/cliente">/cliente</a>.
                </p>
                <p>
                  No compartas datos de tarjetas o contraseñas. Tus mensajes se procesan con Gemini para
                  ayudarte a pedir.
                </p>
                <button className="kiara-primario" disabled={ocupado} onClick={nuevoPedido}>
                  Iniciar un pedido nuevo
                </button>
              </>
            )}
            {hoja === "menu" && (
              <>
                <input
                  className="kiara-buscar"
                  aria-label="Buscar productos"
                  placeholder="Buscar algo rico…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {!productosFiltrados.length && <p>No encontré productos con ese nombre.</p>}
                {[...new Set(productosFiltrados.map((p) => p.categoria))].map((c) => (
                  <section className="kiara-categoria" key={c}>
                    <h3>{c}</h3>
                    {productosFiltrados
                      .filter((p) => p.categoria === c)
                      .map((p) => (
                        <button className="kiara-producto" key={p.id} onClick={() => escoger(p)}>
                          <span>
                            {p.nombre}
                            <small>
                              {dinero(p.precio)}
                              {p.extraTerceraFruta ? " · tercera fruta +$1.000" : ""}
                              {p.empaque ? " · incluye empaque" : ""}
                            </small>
                          </span>
                          <b aria-label="Elegir">+</b>
                        </button>
                      ))}
                  </section>
                ))}
              </>
            )}
            {hoja === "producto" && producto && (
              <form className="kiara-formulario" onSubmit={agregarProducto}>
                <p className="kiara-precio">
                  {dinero(producto.precio + (opciones.frutas?.length === 3 ? 1000 : 0))}
                </p>
                {producto.empaque > 0 && (
                  <small>Incluye {dinero(producto.empaque)} de empaque para llevar.</small>
                )}
                {Object.entries(producto.opciones).map(([campo, valores]) =>
                  campo === "frutas" ? (
                    <fieldset key={campo}>
                      <legend>Elige de 1 a 3 frutas</legend>
                      <small>La tercera fruta cuesta $1.000 adicionales.</small>
                      <div className="kiara-frutas">
                        {valores.map((v) => (
                          <label key={v}>
                            <input
                              type="checkbox"
                              checked={opciones.frutas?.includes(v) || false}
                              disabled={!opciones.frutas?.includes(v) && opciones.frutas?.length >= 3}
                              onChange={(e) =>
                                setOpciones((o) => ({
                                  ...o,
                                  frutas: e.target.checked
                                    ? [...(o.frutas || []), v]
                                    : (o.frutas || []).filter((f) => f !== v)
                                }))
                              }
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : (
                    <label key={campo}>
                      {{ base: "Base", acompanante: "Acompañante", bebida: "Bebida" }[campo] || campo}
                      <select
                        required
                        value={opciones[campo] || ""}
                        onChange={(e) => setOpciones((o) => ({ ...o, [campo]: e.target.value }))}
                      >
                        <option value="">Seleccionar</option>
                        {valores.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  )
                )}
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </label>
                <button
                  disabled={ocupado || (producto.opciones.frutas && !opciones.frutas?.length)}
                  className="kiara-primario"
                >
                  Agregar a mi pedido
                </button>
                <button type="button" className="kiara-secundario" onClick={() => setHoja("menu")}>
                  Volver al menú
                </button>
              </form>
            )}
            {hoja === "pedido" && (
              <>
                {!carrito.length ? (
                  <div className="kiara-vacio">
                    <Icono tipo="bolsa" />
                    <p>Tu pedido está esperando algo rico.</p>
                    <button className="kiara-primario" onClick={() => setHoja("menu")}>
                      Explorar menú
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="kiara-lineas">
                      {carrito.map((l, i) => (
                        <article key={i}>
                          <div>
                            <strong>{l.nombre}</strong>
                            {l.detalle && <small>{l.detalle}</small>}
                            <span>{dinero(l.precio * l.cantidad)}</span>
                          </div>
                          <div className="kiara-cantidad">
                            <button
                              disabled={ocupado}
                              aria-label={`Quitar una unidad de ${l.nombre}`}
                              onClick={() =>
                                actualizar(
                                  carrito.flatMap((x, j) =>
                                    j !== i ? [x] : x.cantidad > 1 ? [{ ...x, cantidad: x.cantidad - 1 }] : []
                                  )
                                )
                              }
                            >
                              −
                            </button>
                            <span>{l.cantidad}</span>
                            <button
                              disabled={ocupado}
                              aria-label={`Agregar una unidad de ${l.nombre}`}
                              onClick={() =>
                                actualizar(
                                  carrito.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + 1 } : x))
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="kiara-total">
                      <span>Total</span>
                      <strong>{dinero(total)}</strong>
                    </div>
                    <form className="kiara-formulario" onSubmit={confirmar}>
                      <p className="kiara-recogida">Para recoger en el local</p>
                      <label>
                        Tu nombre
                        <input
                          required
                          minLength={2}
                          maxLength={80}
                          autoComplete="name"
                          value={cliente.nombre}
                          onChange={(e) => setCliente((c) => ({ ...c, nombre: e.target.value }))}
                        />
                      </label>
                      <label>
                        Teléfono
                        <input
                          required
                          type="tel"
                          minLength={7}
                          maxLength={25}
                          autoComplete="tel"
                          value={cliente.telefono}
                          onChange={(e) => setCliente((c) => ({ ...c, telefono: e.target.value }))}
                        />
                      </label>
                      <label>
                        Forma de pago
                        <select
                          value={cliente.pago}
                          onChange={(e) => setCliente((c) => ({ ...c, pago: e.target.value }))}
                        >
                          <option>Efectivo</option>
                          <option>Transferencia</option>
                        </select>
                      </label>
                      <label>
                        Observaciones (opcional)
                        <textarea
                          maxLength={300}
                          rows={2}
                          value={cliente.notas}
                          onChange={(e) => setCliente((c) => ({ ...c, notas: e.target.value }))}
                        />
                      </label>
                      <small>
                        Al confirmar enviarás el pedido a Rafiki para su preparación. El pago se realiza con
                        el local.
                      </small>
                      <button disabled={ocupado || !listo} className="kiara-primario">
                        {ocupado ? "Procesando…" : `Confirmar pedido · ${dinero(total)}`}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </Hoja>
      )}
    </main>
  );
}
