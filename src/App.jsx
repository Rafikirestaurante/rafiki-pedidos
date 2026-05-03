import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const VALOR_PARA_LLEVAR = 1500;
const MAX_ACOMPANANTES_CLIENTE = 3;
const INCLUIDOS_FIJOS = "Sopa + bebida incluida";
const WHATSAPP_RAFIKI = import.meta.env.VITE_WHATSAPP_RAFIKI || "573022915098";

const estadosPedido = ["Pendiente", "En preparación", "Enviado", "Entregado", "Cancelado"];

const menuFallback = {
  id: null,
  fecha: new Date().toISOString().slice(0, 10),
  titulo: "Almuerzo ejecutivo Rafiki",
  descripcion: "Escoge una proteína y máximo 3 acompañantes. Incluye sopa y bebida.",
  precio: 0,
  proteinas: [],
  proteinas_detalle: [],
  acompanantes: [],
  activo: true
};

function dinero(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
}

function listaPorLineas(texto) {
  return String(texto || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function limpiarAcompanantesMenu(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => item.toLowerCase() !== "sopa");
}

function limpiarAcompanantesCliente(lista) {
  return limpiarAcompanantesMenu(lista).slice(0, MAX_ACOMPANANTES_CLIENTE);
}

function textoAProteinasDetalle(texto) {
  return String(texto || "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const indiceSeparador = linea.lastIndexOf(":");

      if (indiceSeparador === -1) {
        return {
          nombre: linea.trim(),
          precio: 0
        };
      }

      const nombre = linea.slice(0, indiceSeparador).trim();
      const precioTexto = linea.slice(indiceSeparador + 1).replace(/[^\d]/g, "");

      return {
        nombre,
        precio: Number(precioTexto) || 0
      };
    })
    .filter((item) => item.nombre);
}

function proteinasATexto(proteinasDetalle) {
  return (proteinasDetalle || [])
    .map((item) => `${item.nombre}:${Number(item.precio) || 0}`)
    .join("\n");
}

function acompanantesATexto(acompanantes) {
  return (acompanantes || []).join("\n");
}

function normalizarProteinas(menu) {
  if (Array.isArray(menu?.proteinas_detalle) && menu.proteinas_detalle.length > 0) {
    return menu.proteinas_detalle
      .map((item) => ({
        nombre: String(item.nombre || "").trim(),
        precio: Number(item.precio) || 0
      }))
      .filter((item) => item.nombre);
  }

  if (Array.isArray(menu?.proteinas) && menu.proteinas.length > 0) {
    return menu.proteinas
      .map((nombre) => ({
        nombre: String(nombre || "").trim(),
        precio: Number(menu?.precio) || 0
      }))
      .filter((item) => item.nombre);
  }

  return [];
}

function normalizarMenu(menu) {
  const proteinasDetalle = normalizarProteinas(menu);
  const acompanantes = limpiarAcompanantesMenu(menu?.acompanantes || []);

  return {
    ...menuFallback,
    ...menu,
    proteinas_detalle: proteinasDetalle,
    proteinas: proteinasDetalle.map((item) => item.nombre),
    acompanantes
  };
}

function crearItemNuevo(menu) {
  const menuNormalizado = normalizarMenu(menu);
  const primeraProteina = menuNormalizado.proteinas_detalle[0] || {
    nombre: "",
    precio: 0
  };

  return {
    id: Date.now() + Math.random(),
    cantidad: 1,
    proteina: primeraProteina.nombre,
    precioProteina: Number(primeraProteina.precio) || 0,
    acompanantes: [],
    paraLlevar: false
  };
}

function calcularTotalItem(item) {
  const cantidad = Number(item.cantidad) || 0;
  const precioProteina = Number(item.precioProteina) || Number(item.precio) || 0;
  const adicional = item.paraLlevar ? VALOR_PARA_LLEVAR : 0;

  return cantidad * (precioProteina + adicional);
}

function calcularTotalItems(items) {
  return items.reduce((suma, item) => suma + calcularTotalItem(item), 0);
}

function crearTextoItem(item) {
  const partes = [`${item.cantidad} ${item.proteina} (${dinero(item.precioProteina)})`];
  const acompanantes = limpiarAcompanantesCliente(item.acompanantes || []);

  if (acompanantes.length > 0) {
    partes.push(acompanantes.join(", "));
  }

  partes.push(INCLUIDOS_FIJOS);

  if (item.paraLlevar) {
    partes.push(`Para llevar +${dinero(VALOR_PARA_LLEVAR)}`);
  }

  return partes.join(" + ");
}

function crearTextoPedido(items, observaciones) {
  let texto = items.map(crearTextoItem).join("\n");

  if (observaciones) {
    texto += `\nObservaciones: ${observaciones}`;
  }

  return texto;
}

function crearMensajeWhatsAppPedido(pedido) {
  return [
    "Hola Rafiki, quiero confirmar este pedido:",
    "",
    `Cliente: ${pedido.cliente || pedido.cliente_nombre || "Cliente"}`,
    `Teléfono: ${pedido.telefono || "Sin teléfono"}`,
    `Ubicación: ${pedido.ubicacion || "Sin ubicación"}`,
    "",
    "Pedido:",
    pedido.pedido_texto || "",
    "",
    `Total: ${dinero(pedido.total)}`
  ].join("\n");
}

function crearLinkWhatsApp(numero, mensaje) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

function consolidarPedidos(pedidos) {
  const resumen = {};

  pedidos.forEach((pedido) => {
    const items = Array.isArray(pedido.items) ? pedido.items : [];

    items.forEach((item) => {
      if (item.proteina) {
        resumen[item.proteina] =
          (resumen[item.proteina] || 0) + (Number(item.cantidad) || 0);
      }
    });
  });

  return resumen;
}

function obtenerCliente(pedido) {
  return pedido.cliente || pedido.cliente_nombre || "Cliente";
}

function obtenerItemsPedido(pedido) {
  return Array.isArray(pedido.items) ? pedido.items : [];
}

function CampoTexto({
  etiqueta,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  rows = 3
}) {
  return (
    <label className="field">
      <span>{etiqueta}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function EstadoBadge({ estado }) {
  const clase = `badge badge-${String(estado || "").replaceAll(" ", "-").toLowerCase()}`;
  return <span className={clase}>{estado}</span>;
}

function SelectorCantidad({ cantidad, onChange }) {
  return (
    <div className="quantity">
      <button type="button" onClick={() => onChange(Math.max(1, cantidad - 1))}>
        −
      </button>
      <strong>{cantidad}</strong>
      <button type="button" onClick={() => onChange(cantidad + 1)}>
        +
      </button>
    </div>
  );
}

function PedidoCocina({ pedido, onCambiarEstado }) {
  const items = obtenerItemsPedido(pedido);

  return (
    <article className="pedido-cocina">
      <div className="pedido-top">
        <div>
          <div className="pedido-linea">
            <EstadoBadge estado={pedido.estado} />
            <span className="pedido-id">Pedido #{pedido.id}</span>
          </div>
          <h3>{obtenerCliente(pedido)}</h3>
          <p className="muted">📍 {pedido.ubicacion || "Sin ubicación"}</p>
          <p className="muted">📞 {pedido.telefono || "Sin teléfono"}</p>
        </div>

        <div className="pedido-total">
          <span>Total</span>
          <strong>{dinero(pedido.total)}</strong>
        </div>
      </div>

      <div className="items-cocina">
        {items.length === 0 ? (
          <div className="pedido-text">{pedido.pedido_texto}</div>
        ) : (
          items.map((item, index) => (
            <div key={item.id || index} className="item-cocina">
              <div className="item-numero">#{index + 1}</div>
              <div className="item-detalle">
                <h4>
                  {item.cantidad} x {item.proteina}
                </h4>
                <p>
                  <strong>Precio:</strong>{" "}
                  {dinero(item.precioProteina || item.precio || 0)}
                </p>
                <p>
                  <strong>Acompañantes:</strong>{" "}
                  {Array.isArray(item.acompanantes) && item.acompanantes.length > 0
                    ? item.acompanantes.join(", ")
                    : "Sin acompañantes"}
                </p>
                <p>
                  <strong>Incluye:</strong> Sopa + bebida
                </p>
                <p>
                  <strong>Empaque:</strong>{" "}
                  {item.paraLlevar ? `Para llevar +${dinero(VALOR_PARA_LLEVAR)}` : "Sin empaque para llevar"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {pedido.observaciones && (
        <div className="nota-cocina">
          <strong>Observaciones:</strong> {pedido.observaciones}
        </div>
      )}

      <div className="pedido-actions">
        <select
          value={pedido.estado}
          onChange={(e) => onCambiarEstado(pedido.id, e.target.value)}
        >
          {estadosPedido.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>

        <a
          href={crearLinkWhatsApp(WHATSAPP_RAFIKI, crearMensajeWhatsAppPedido(pedido))}
          target="_blank"
          rel="noreferrer"
          className="button green link-button"
        >
          Enviar a WhatsApp
        </a>
      </div>
    </article>
  );
}

export default function App() {
  const [vista, setVista] = useState("inicio");
  const [adminTab, setAdminTab] = useState("pedidos");
  const [menu, setMenu] = useState(normalizarMenu(menuFallback));
  const [pedidos, setPedidos] = useState([]);
  const [itemsPedido, setItemsPedido] = useState([crearItemNuevo(menuFallback)]);
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [pedidoFinalizado, setPedidoFinalizado] = useState(null);
  const [cargando, setCargando] = useState(true);

  const totalPedido = useMemo(() => calcularTotalItems(itemsPedido), [itemsPedido]);
  const consolidado = useMemo(() => consolidarPedidos(pedidos), [pedidos]);

  const totalVendido = useMemo(
    () => pedidos.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0),
    [pedidos]
  );

  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return pedidos;

    return pedidos.filter((pedido) =>
      `${obtenerCliente(pedido)} ${pedido.telefono} ${pedido.ubicacion} ${pedido.pedido_texto} ${pedido.estado}`
        .toLowerCase()
        .includes(q)
    );
  }, [pedidos, busqueda]);

  const mensajeWhatsAppFinal = pedidoFinalizado
    ? crearMensajeWhatsAppPedido(pedidoFinalizado)
    : "";

  const linkWhatsAppFinal = pedidoFinalizado
    ? crearLinkWhatsApp(WHATSAPP_RAFIKI, mensajeWhatsAppFinal)
    : "#";

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);

    const { data: menuData, error: menuError } = await supabase
      .from("menu_diario")
      .select("*")
      .eq("activo", true)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (menuError) {
      setMensaje(`Error cargando menú: ${menuError.message}`);
    }

    if (menuData) {
      const menuNormalizado = normalizarMenu(menuData);
      setMenu(menuNormalizado);
      setItemsPedido([crearItemNuevo(menuNormalizado)]);
    }

    const { data: pedidosData, error: pedidosError } = await supabase
      .from("pedidos")
      .select("*")
      .order("id", { ascending: false });

    if (pedidosError) {
      setMensaje(`Error cargando pedidos: ${pedidosError.message}`);
    }

    if (pedidosData) {
      setPedidos(pedidosData);
    }

    setCargando(false);
  }

  function actualizarItem(id, cambios) {
    setItemsPedido((actual) =>
      actual.map((item) => (item.id === id ? { ...item, ...cambios } : item))
    );
  }

  function cambiarProteinaItem(id, nombreProteina) {
    const proteinaSeleccionada = menu.proteinas_detalle.find(
      (p) => p.nombre === nombreProteina
    );

    actualizarItem(id, {
      proteina: proteinaSeleccionada?.nombre || "",
      precioProteina: Number(proteinaSeleccionada?.precio) || 0
    });
  }

  function cambiarAcompananteItem(id, acompanante) {
    setItemsPedido((actual) =>
      actual.map((item) => {
        if (item.id !== id) return item;

        const seleccionado = item.acompanantes.includes(acompanante);

        if (seleccionado) {
          return {
            ...item,
            acompanantes: item.acompanantes.filter((x) => x !== acompanante)
          };
        }

        if (item.acompanantes.length >= MAX_ACOMPANANTES_CLIENTE) {
          setMensaje(
            `Solo puedes escoger ${MAX_ACOMPANANTES_CLIENTE} acompañantes por almuerzo. La sopa y la bebida ya están incluidas.`
          );
          return item;
        }

        return {
          ...item,
          acompanantes: [...item.acompanantes, acompanante]
        };
      })
    );
  }

  function agregarAlmuerzo() {
    setItemsPedido((actual) => [...actual, crearItemNuevo(menu)]);
  }

  function eliminarAlmuerzo(id) {
    setItemsPedido((actual) =>
      actual.length === 1 ? actual : actual.filter((item) => item.id !== id)
    );
  }

  async function registrarPedido() {
    const itemsValidos = itemsPedido
      .filter((item) => item.proteina)
      .map((item) => ({
        ...item,
        acompanantes: limpiarAcompanantesCliente(item.acompanantes)
      }));

    if (itemsValidos.length === 0) {
      setMensaje("Debes escoger al menos un almuerzo.");
      return;
    }

    const clienteNombre = cliente.trim() || "Cliente";
    const pedidoTexto = crearTextoPedido(itemsValidos, observaciones.trim());
    const total = calcularTotalItems(itemsValidos);

    const nuevoPedido = {
      cliente: clienteNombre,
      cliente_nombre: clienteNombre,
      telefono: telefono.trim(),
      ubicacion: ubicacion.trim() || "Ubicación pendiente",
      observaciones: observaciones.trim(),
      items: itemsValidos,
      pedido_texto: pedidoTexto,
      total,
      estado: "Pendiente",
      enviado_whatsapp: false
    };

    const { data, error } = await supabase
      .from("pedidos")
      .insert(nuevoPedido)
      .select()
      .single();

    if (error) {
      setMensaje(`Error guardando pedido: ${error.message}`);
      return;
    }

    setPedidos((actual) => [data, ...actual]);
    setPedidoFinalizado(data);
    setMensaje("Pedido guardado. Ahora puedes enviar el consolidado por WhatsApp.");
    setVista("confirmacion");
  }

  async function guardarMenu() {
    const menuNormalizado = normalizarMenu(menu);

    if (menuNormalizado.proteinas_detalle.length === 0) {
      setMensaje("Debes agregar al menos una proteína del día.");
      return;
    }

    const menuActualizado = {
      fecha: menuNormalizado.fecha,
      titulo: menuNormalizado.titulo,
      descripcion: menuNormalizado.descripcion,
      precio: Number(menuNormalizado.proteinas_detalle[0]?.precio) || 0,
      proteinas: menuNormalizado.proteinas_detalle.map((item) => item.nombre),
      proteinas_detalle: menuNormalizado.proteinas_detalle,
      acompanantes: limpiarAcompanantesMenu(menuNormalizado.acompanantes || []),
      activo: true
    };

    if (menu.id) {
      const { data, error } = await supabase
        .from("menu_diario")
        .update(menuActualizado)
        .eq("id", menu.id)
        .select()
        .single();

      if (error) {
        setMensaje(`Error guardando menú: ${error.message}`);
        return;
      }

      const nuevoMenu = normalizarMenu(data);
      setMenu(nuevoMenu);
      setItemsPedido([crearItemNuevo(nuevoMenu)]);
      setMensaje("Menú actualizado correctamente.");
      setAdminTab("pedidos");
      return;
    }

    const { data, error } = await supabase
      .from("menu_diario")
      .insert(menuActualizado)
      .select()
      .single();

    if (error) {
      setMensaje(`Error creando menú: ${error.message}`);
      return;
    }

    const nuevoMenu = normalizarMenu(data);
    setMenu(nuevoMenu);
    setItemsPedido([crearItemNuevo(nuevoMenu)]);
    setMensaje("Menú creado correctamente.");
    setAdminTab("pedidos");
  }

  async function cambiarEstadoPedido(id, estado) {
    const { data, error } = await supabase
      .from("pedidos")
      .update({ estado })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      setMensaje(`Error cambiando estado: ${error.message}`);
      return;
    }

    setPedidos((actual) => actual.map((pedido) => (pedido.id === id ? data : pedido)));
  }

  function actualizarProteinasDesdeTexto(texto) {
    const proteinasDetalle = textoAProteinasDetalle(texto);

    setMenu((actual) => ({
      ...actual,
      proteinas_detalle: proteinasDetalle,
      proteinas: proteinasDetalle.map((item) => item.nombre),
      precio: Number(proteinasDetalle[0]?.precio) || 0
    }));

    setItemsPedido((actual) =>
      actual.map((item) => {
        const encontrada = proteinasDetalle.find((p) => p.nombre === item.proteina);
        const primera = proteinasDetalle[0];

        return {
          ...item,
          proteina: encontrada?.nombre || primera?.nombre || "",
          precioProteina: Number(encontrada?.precio || primera?.precio || 0)
        };
      })
    );
  }

  function actualizarAcompanantesDesdeTexto(texto) {
    const acompanantes = limpiarAcompanantesMenu(listaPorLineas(texto));

    setMenu((actual) => ({
      ...actual,
      acompanantes
    }));

    setItemsPedido((actual) =>
      actual.map((item) => ({
        ...item,
        acompanantes: limpiarAcompanantesCliente(
          item.acompanantes.filter((a) => acompanantes.includes(a))
        )
      }))
    );
  }

  function nuevoPedidoCliente() {
    setItemsPedido([crearItemNuevo(menu)]);
    setCliente("");
    setTelefono("");
    setUbicacion("");
    setObservaciones("");
    setPedidoFinalizado(null);
    setMensaje("");
    setVista("cliente");
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #fff7ed;
          color: #292524;
        }
        button, input, textarea, select { font-family: inherit; }
        button { cursor: pointer; }
        button:disabled { cursor: not-allowed; opacity: 0.6; }
        .app {
          min-height: 100vh;
          background: radial-gradient(circle at top left, #fed7aa 0, transparent 32%), linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%);
          padding: 24px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }
        .brand {
          display: inline-flex;
          background: #ffedd5;
          color: #c2410c;
          padding: 8px 14px;
          border-radius: 999px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        h1 {
          margin: 0;
          font-size: clamp(30px, 5vw, 52px);
          line-height: 1;
          letter-spacing: -1.5px;
        }
        h2, h3, h4, h5, p { margin-top: 0; }
        .muted { color: #78716c; }
        .small { font-size: 13px; }
        .nav {
          display: flex;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #fed7aa;
          padding: 6px;
          border-radius: 20px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.05);
        }
        .nav button {
          border: 0;
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 900;
          background: transparent;
          color: #57534e;
        }
        .nav button.active {
          background: #f97316;
          color: #fff;
        }
        .alert {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
          padding: 14px 18px;
          border-radius: 18px;
          margin-bottom: 18px;
          font-weight: 700;
        }
        .card {
          background: #ffffff;
          border: 1px solid #fed7aa;
          border-radius: 32px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .card-pad { padding: 24px; }
        .welcome {
          max-width: 820px;
          margin: 0 auto;
          text-align: center;
        }
        .welcome-card {
          background: linear-gradient(135deg, #f97316, #f59e0b);
          color: white;
          border-radius: 36px;
          padding: 44px 28px;
          box-shadow: 0 25px 60px rgba(249, 115, 22, 0.25);
        }
        .welcome-icon {
          font-size: 64px;
          margin-bottom: 12px;
        }
        .welcome-card h2 {
          font-size: clamp(34px, 7vw, 62px);
          margin-bottom: 10px;
          line-height: 0.95;
        }
        .welcome-card p {
          color: #fff7ed;
          font-size: 18px;
          margin-bottom: 24px;
        }
        .welcome-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          width: min(100%, 420px);
          border: 0;
          background: #ffffff;
          color: #c2410c;
          padding: 18px 22px;
          border-radius: 22px;
          font-size: 22px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }
        .admin-small {
          margin-top: 18px;
          border: 0;
          background: transparent;
          color: #78716c;
          font-weight: 800;
          text-decoration: underline;
          font-size: 13px;
        }
        .hero {
          background: linear-gradient(135deg, #f97316, #f59e0b);
          color: white;
          padding: 32px;
        }
        .hero.green { background: linear-gradient(135deg, #22c55e, #10b981); }
        .pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }
        .pill {
          display: inline-flex;
          background: rgba(255,255,255,0.22);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.35);
          padding: 10px 14px;
          border-radius: 16px;
          font-weight: 900;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }
        .layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 22px;
          align-items: start;
        }
        .admin-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          background: #fff;
          border: 1px solid #fed7aa;
          border-radius: 22px;
          padding: 8px;
        }
        .admin-tabs button {
          flex: 1;
          border: 0;
          border-radius: 16px;
          padding: 14px 16px;
          background: transparent;
          font-weight: 900;
          color: #57534e;
        }
        .admin-tabs button.active {
          background: #f97316;
          color: #fff;
        }
        .admin-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 22px;
        }
        .section { padding: 24px; }
        .meal-card {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 28px;
          padding: 20px;
          margin-bottom: 18px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .button {
          border: 0;
          background: #f97316;
          color: white;
          font-weight: 900;
          padding: 14px 18px;
          border-radius: 16px;
          box-shadow: 0 8px 18px rgba(249, 115, 22, 0.25);
        }
        .button.green { background: #22c55e; }
        .button.light {
          background: #fff;
          color: #44403c;
          border: 1px solid #e7e5e4;
          box-shadow: none;
        }
        .button.danger {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          box-shadow: none;
        }
        .link-button {
          display: block;
          text-align: center;
          text-decoration: none;
        }
        .option-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .option {
          text-align: left;
          border: 1px solid #e7e5e4;
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          font-weight: 900;
        }
        .option small {
          display: block;
          margin-top: 5px;
          color: #ea580c;
          font-size: 15px;
        }
        .option.selected {
          border-color: #f97316;
          color: #c2410c;
          background: #fff7ed;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .chip {
          border: 1px solid #e7e5e4;
          background: #fff;
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 900;
        }
        .chip.selected {
          border-color: #86efac;
          background: #dcfce7;
          color: #15803d;
        }
        .chip.blocked {
          background: #f5f5f4;
          color: #a8a29e;
        }
        .box {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 18px;
          padding: 14px;
        }
        .box.soft { background: #fafaf9; }
        .field {
          display: block;
          margin-bottom: 14px;
        }
        .field span {
          display: block;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .field input,
        .field textarea,
        .field select,
        select.box {
          width: 100%;
          border: 1px solid #e7e5e4;
          background: #fafaf9;
          border-radius: 16px;
          padding: 13px 14px;
          outline: none;
        }
        .field input:focus,
        .field textarea:focus {
          border-color: #f97316;
        }
        .quantity {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .quantity button {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid #e7e5e4;
          background: #fff;
          font-size: 22px;
          font-weight: 900;
        }
        .summary-item {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 16px;
          padding: 12px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e7e5e4;
          margin-top: 14px;
          padding-top: 14px;
          font-weight: 900;
        }
        .total-row strong {
          color: #ea580c;
          font-size: 26px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .stat {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 20px;
          padding: 16px;
        }
        .stat strong {
          display: block;
          font-size: 28px;
        }
        .pedido-cocina {
          border: 1px solid #fed7aa;
          background: #fff;
          border-radius: 26px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.05);
        }
        .pedido-top {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          border-bottom: 1px solid #f5f5f4;
          padding-bottom: 14px;
          margin-bottom: 14px;
        }
        .pedido-linea {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .pedido-id {
          font-weight: 900;
          color: #78716c;
          font-size: 13px;
        }
        .pedido-total {
          text-align: right;
        }
        .pedido-total span {
          display: block;
          color: #78716c;
          font-weight: 800;
        }
        .pedido-total strong {
          color: #ea580c;
          font-size: 28px;
        }
        .items-cocina {
          display: grid;
          gap: 12px;
        }
        .item-cocina {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 12px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 20px;
          padding: 14px;
        }
        .item-numero {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f97316;
          color: #fff;
          border-radius: 14px;
          font-weight: 900;
        }
        .item-detalle h4 {
          margin-bottom: 8px;
          font-size: 19px;
        }
        .item-detalle p {
          margin-bottom: 5px;
        }
        .nota-cocina {
          margin-top: 12px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 16px;
          padding: 12px;
        }
        .pedido-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }
        .pedido-actions select {
          border: 1px solid #e7e5e4;
          border-radius: 16px;
          padding: 13px 14px;
          background: #fafaf9;
          font-weight: 800;
        }
        .pedido-text {
          white-space: pre-line;
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          border-radius: 16px;
          padding: 12px;
          font-weight: 700;
          margin-top: 12px;
        }
        .badge {
          border: 1px solid #e7e5e4;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
        }
        .badge-pendiente { background: #fef3c7; color: #92400e; }
        .badge-en-preparación { background: #dbeafe; color: #1d4ed8; }
        .badge-enviado { background: #ede9fe; color: #6d28d9; }
        .badge-entregado { background: #dcfce7; color: #15803d; }
        .badge-cancelado { background: #fee2e2; color: #b91c1c; }
        pre {
          white-space: pre-wrap;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 18px;
          padding: 16px;
          overflow: auto;
        }
        @media (max-width: 900px) {
          .topbar,
          .layout,
          .grid-2,
          .stats,
          .pedido-top,
          .pedido-actions {
            grid-template-columns: 1fr;
            display: grid;
          }
          .topbar { display: block; }
          .nav { margin-top: 16px; }
          .option-grid { grid-template-columns: 1fr; }
          .app { padding: 14px; }
          .pedido-total { text-align: left; }
        }
      `}</style>

      <div className="app">
        <div className="container">
          {vista !== "inicio" && (
            <header className="topbar">
              <div>
                <div className="brand">🍽️ Rafiki Pedidos</div>
                <h1>Menú diario y pedidos por WhatsApp</h1>
                <p className="muted">App real conectada a Supabase.</p>
              </div>

              <div className="nav">
                <button
                  type="button"
                  onClick={() => setVista("cliente")}
                  className={vista === "cliente" ? "active" : ""}
                >
                  Vista cliente
                </button>
                <button type="button" onClick={() => setVista("inicio")}>
                  Inicio
                </button>
              </div>
            </header>
          )}

          {mensaje && <div className="alert">{mensaje}</div>}

          {cargando && <div className="card card-pad">Cargando datos de Rafiki...</div>}

          {!cargando && vista === "inicio" && (
            <main className="welcome">
              <section className="welcome-card">
                <div className="welcome-icon">🍽️</div>
                <h2>Bienvenido a Rafiki</h2>
                <p>
                  Escoge tu almuerzo del día, selecciona tus acompañantes y envíanos tu pedido por WhatsApp.
                </p>
                <button type="button" onClick={() => setVista("cliente")} className="welcome-button">
                  Haz tu pedido aquí
                </button>
              </section>

              <button type="button" onClick={() => setVista("admin")} className="admin-small">
                Panel administrativo
              </button>
            </main>
          )}

          {!cargando && vista === "cliente" && (
            <main className="layout">
              <section className="card">
                <div className="hero">
                  <p>{menu.fecha}</p>
                  <h2>{menu.titulo}</h2>
                  <p>{menu.descripcion}</p>
                  <div className="pill-row">
                    <span className="pill">Cada proteína tiene precio propio</span>
                    <span className="pill">Para llevar suma {dinero(VALOR_PARA_LLEVAR)}</span>
                    <span className="pill">Incluye sopa y bebida</span>
                  </div>
                </div>

                <div className="section">
                  {menu.proteinas_detalle.length === 0 ? (
                    <div className="box soft">
                      Todavía no hay proteínas configuradas para el menú de hoy. Entra al panel administrativo y agrega las proteínas del día.
                    </div>
                  ) : (
                    <>
                      <div className="row" style={{ marginBottom: 18 }}>
                        <div>
                          <h3>🛍️ Almuerzos del pedido</h3>
                          <p className="muted">Agrega uno o varios almuerzos. Máximo 3 acompañantes.</p>
                        </div>
                        <button type="button" onClick={agregarAlmuerzo} className="button">
                          + Agregar almuerzo
                        </button>
                      </div>

                      {itemsPedido.map((item, index) => (
                        <div key={item.id} className="meal-card">
                          <div className="row">
                            <h3>Almuerzo #{index + 1}</h3>
                            {itemsPedido.length > 1 && (
                              <button
                                type="button"
                                onClick={() => eliminarAlmuerzo(item.id)}
                                className="button danger"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>

                          <h4>Proteína</h4>
                          <div className="option-grid">
                            {menu.proteinas_detalle.map((proteina) => (
                              <button
                                key={proteina.nombre}
                                type="button"
                                onClick={() => cambiarProteinaItem(item.id, proteina.nombre)}
                                className={`option ${item.proteina === proteina.nombre ? "selected" : ""}`}
                              >
                                <div>{proteina.nombre}</div>
                                <small>{dinero(proteina.precio)}</small>
                              </button>
                            ))}
                          </div>

                          <div style={{ marginTop: 18 }}>
                            <div className="row">
                              <h4>Acompañantes</h4>
                              <strong>
                                {item.acompanantes.length}/{MAX_ACOMPANANTES_CLIENTE}
                              </strong>
                            </div>
                            <p className="muted">
                              Puedes escoger máximo {MAX_ACOMPANANTES_CLIENTE}. La sopa y la bebida ya están incluidas.
                            </p>

                            <div className="chips">
                              {menu.acompanantes.length === 0 ? (
                                <span className="muted">No hay acompañantes configurados.</span>
                              ) : (
                                menu.acompanantes.map((acompanante) => {
                                  const seleccionado = item.acompanantes.includes(acompanante);
                                  const bloqueado =
                                    !seleccionado &&
                                    item.acompanantes.length >= MAX_ACOMPANANTES_CLIENTE;

                                  return (
                                    <button
                                      key={acompanante}
                                      type="button"
                                      onClick={() => cambiarAcompananteItem(item.id, acompanante)}
                                      disabled={bloqueado}
                                      className={`chip ${seleccionado ? "selected" : ""} ${bloqueado ? "blocked" : ""}`}
                                    >
                                      {seleccionado ? "✓ " : "+ "}
                                      {acompanante}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div className="box" style={{ marginTop: 18 }}>
                            <strong>🥣 Sopa y bebida</strong>
                            <p className="muted" style={{ marginBottom: 0 }}>
                              Incluidas automáticamente en cada almuerzo.
                            </p>
                          </div>

                          <div className="grid-2" style={{ marginTop: 18 }}>
                            <div className="box">
                              <strong>Cantidad</strong>
                              <div style={{ marginTop: 10 }}>
                                <SelectorCantidad
                                  cantidad={item.cantidad}
                                  onChange={(cantidad) => actualizarItem(item.id, { cantidad })}
                                />
                              </div>
                            </div>

                            <label className="box row">
                              <div>
                                <strong>🥡 Para llevar</strong>
                                <p className="muted" style={{ marginBottom: 0 }}>
                                  Suma {dinero(VALOR_PARA_LLEVAR)}
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={item.paraLlevar}
                                onChange={(e) =>
                                  actualizarItem(item.id, {
                                    paraLlevar: e.target.checked
                                  })
                                }
                                style={{ width: 24, height: 24 }}
                              />
                            </label>
                          </div>

                          <div className="total-row">
                            <span>Subtotal</span>
                            <strong>{dinero(calcularTotalItem(item))}</strong>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>

              <aside className="card card-pad">
                <h2>Datos de entrega</h2>
                <p className="muted">
                  Estos datos se guardan y luego el cliente puede enviar el consolidado por WhatsApp.
                </p>

                <div className="box soft" style={{ marginBottom: 18 }}>
                  <h3>Resumen</h3>

                  {itemsPedido.map((item, index) => (
                    <div key={item.id} className="summary-item">
                      <p>
                        #{index + 1} {item.cantidad} {item.proteina || "Sin proteína"} - {dinero(item.precioProteina)}
                      </p>
                      <p>{item.acompanantes.join(", ") || "Sin acompañantes"}</p>
                      <p>Sopa + bebida incluida</p>
                      <p>
                        {item.paraLlevar
                          ? `Para llevar +${dinero(VALOR_PARA_LLEVAR)}`
                          : "Sin empaque para llevar"}
                      </p>
                    </div>
                  ))}

                  <div className="total-row">
                    <span>Total</span>
                    <strong>{dinero(totalPedido)}</strong>
                  </div>
                </div>

                <CampoTexto
                  etiqueta="👤 Nombre"
                  value={cliente}
                  onChange={setCliente}
                  placeholder="Ej: Laura Pérez"
                />
                <CampoTexto
                  etiqueta="📞 Teléfono"
                  value={telefono}
                  onChange={setTelefono}
                  placeholder="Ej: 300 123 4567"
                />
                <CampoTexto
                  etiqueta="📍 Ubicación"
                  value={ubicacion}
                  onChange={setUbicacion}
                  placeholder="Ej: Edificio, oficina o barrio"
                />
                <CampoTexto
                  etiqueta="Observaciones generales"
                  value={observaciones}
                  onChange={setObservaciones}
                  placeholder="Ej: llevar a recepción, sin cubiertos, pago en efectivo..."
                  multiline
                />

                <button
                  type="button"
                  onClick={registrarPedido}
                  disabled={
                    menu.proteinas_detalle.length === 0 ||
                    itemsPedido.every((item) => !item.proteina)
                  }
                  className="button"
                  style={{ width: "100%", marginTop: 10 }}
                >
                  Revisar y finalizar pedido
                </button>
              </aside>
            </main>
          )}

          {!cargando && vista === "confirmacion" && pedidoFinalizado && (
            <main style={{ maxWidth: 760, margin: "0 auto" }}>
              <section className="card">
                <div className="hero green">
                  <p style={{ fontSize: 48 }}>✅</p>
                  <h2>Pedido finalizado</h2>
                  <p>Revisa el consolidado y envíalo a Rafiki por WhatsApp.</p>
                </div>

                <div className="card-pad">
                  <div className="box soft">
                    <h3>Consolidado del pedido</h3>
                    <p>
                      <strong>Cliente:</strong> {obtenerCliente(pedidoFinalizado)}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {pedidoFinalizado.telefono || "Sin teléfono"}
                    </p>
                    <p>
                      <strong>Ubicación:</strong> {pedidoFinalizado.ubicacion}
                    </p>

                    <div className="pedido-text">{pedidoFinalizado.pedido_texto}</div>

                    <div className="total-row">
                      <span>Total</span>
                      <strong>{dinero(pedidoFinalizado.total)}</strong>
                    </div>
                  </div>

                  <pre>{mensajeWhatsAppFinal}</pre>

                  <a
                    href={linkWhatsAppFinal}
                    target="_blank"
                    rel="noreferrer"
                    className="button green link-button"
                  >
                    🟢 Enviar consolidado por WhatsApp
                  </a>

                  <div className="grid-2" style={{ marginTop: 14 }}>
                    <button type="button" onClick={nuevoPedidoCliente} className="button light">
                      Hacer otro pedido
                    </button>
                    <button
                      type="button"
                      onClick={() => setVista("inicio")}
                      className="button light"
                    >
                      Volver al inicio
                    </button>
                  </div>
                </div>
              </section>
            </main>
          )}

          {!cargando && vista === "admin" && (
            <main className="admin-layout">
              <div className="admin-tabs">
                <button
                  type="button"
                  onClick={() => setAdminTab("pedidos")}
                  className={adminTab === "pedidos" ? "active" : ""}
                >
                  Pedidos de hoy
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("menu")}
                  className={adminTab === "menu" ? "active" : ""}
                >
                  Editar menú diario
                </button>
              </div>

              {adminTab === "pedidos" && (
                <section className="card card-pad">
                  <div className="row">
                    <div>
                      <h2>📋 Pedidos de hoy</h2>
                      <p className="muted">
                        Vista organizada para preparar los pedidos sin enredos.
                      </p>
                    </div>
                  </div>

                  <CampoTexto
                    etiqueta="Buscar pedido"
                    value={busqueda}
                    onChange={setBusqueda}
                    placeholder="Buscar por cliente, ubicación o estado..."
                  />

                  <div className="stats">
                    <div className="stat">
                      <span>Pedidos</span>
                      <strong>{pedidos.length}</strong>
                    </div>
                    <div className="stat">
                      <span>Pendientes</span>
                      <strong>{pedidos.filter((p) => p.estado === "Pendiente").length}</strong>
                    </div>
                    <div className="stat">
                      <span>Total vendido</span>
                      <strong>{dinero(totalVendido)}</strong>
                    </div>
                  </div>

                  <div className="card card-pad" style={{ marginBottom: 18 }}>
                    <h3>Consolidado cocina</h3>
                    {Object.keys(consolidado).length === 0 ? (
                      <p className="muted">Todavía no hay productos para consolidar.</p>
                    ) : (
                      <div className="grid-2">
                        {Object.entries(consolidado).map(([producto, cantidadProducto]) => (
                          <div key={producto} className="box row">
                            <strong>{producto}</strong>
                            <strong>{cantidadProducto}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {pedidosFiltrados.length === 0 ? (
                    <div className="box soft">No se encontraron pedidos.</div>
                  ) : (
                    pedidosFiltrados.map((pedido) => (
                      <PedidoCocina
                        key={pedido.id}
                        pedido={pedido}
                        onCambiarEstado={cambiarEstadoPedido}
                      />
                    ))
                  )}
                </section>
              )}

              {adminTab === "menu" && (
                <section className="card card-pad">
                  <h2>✏️ Editar menú diario</h2>
                  <p className="muted">
                    Aquí modificas las proteínas, precios y acompañantes disponibles para los clientes.
                  </p>

                  <CampoTexto
                    etiqueta="Fecha"
                    value={menu.fecha || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, fecha: valor }))}
                  />

                  <CampoTexto
                    etiqueta="Nombre del menú"
                    value={menu.titulo || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, titulo: valor }))}
                  />

                  <CampoTexto
                    etiqueta="Descripción"
                    value={menu.descripcion || ""}
                    onChange={(valor) => setMenu((actual) => ({ ...actual, descripcion: valor }))}
                    multiline
                    rows={3}
                  />

                  <CampoTexto
                    etiqueta="Proteínas del día"
                    value={proteinasATexto(menu.proteinas_detalle || [])}
                    onChange={actualizarProteinasDesdeTexto}
                    placeholder={
                      "Pechuga gratinada:18000\nCarne molida especial:19000\nPollo en salsa criolla:17000"
                    }
                    multiline
                    rows={7}
                  />

                  <CampoTexto
                    etiqueta="Acompañantes del día"
                    value={acompanantesATexto(menu.acompanantes || [])}
                    onChange={actualizarAcompanantesDesdeTexto}
                    placeholder={
                      "Arroz con coco\nEnsalada verde\nPuré de papa\nTajadas maduras\nYuca cocida"
                    }
                    multiline
                    rows={7}
                  />

                  <div className="box soft small">
                    <strong>Proteínas:</strong> escribe una proteína por línea con este formato:
                    <br />
                    Nombre de la proteína:Precio
                    <br />
                    <br />
                    <strong>Ejemplo:</strong> Pollo en salsa criolla:17000
                    <br />
                    <br />
                    <strong>Acompañantes:</strong> escribe un acompañante por línea. Pueden tener varias palabras.
                    El cliente verá todos, pero solo podrá escoger 3.
                    <br />
                    <br />
                    Sopa y bebida siempre van incluidas.
                  </div>

                  <button
                    type="button"
                    onClick={guardarMenu}
                    className="button"
                    style={{ width: "100%", marginTop: 14 }}
                  >
                    Guardar menú del día
                  </button>
                </section>
              )}
            </main>
          )}
        </div>
      </div>
    </>
  );
}
