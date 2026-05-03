import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const VALOR_PARA_LLEVAR = 1500;
const MAX_ACOMPANANTES = 3;
const INCLUIDOS_FIJOS = "Sopa + bebida incluida";
const WHATSAPP_RAFIKI = import.meta.env.VITE_WHATSAPP_RAFIKI || "573022915098";

const estadosPedido = ["Pendiente", "En preparación", "Enviado", "Entregado", "Cancelado"];

const menuFallback = {
  id: null,
  fecha: new Date().toISOString().slice(0, 10),
  titulo: "Almuerzo ejecutivo Rafiki",
  descripcion: "Escoge una proteína y máximo 3 acompañantes. Incluye sopa y bebida.",
  precio: 17500,
  proteinas: ["Pechuga", "Carne", "Cerdo", "Pollo guisado"],
  acompanantes: ["Arroz", "Ensalada", "Tajada", "Puré", "Yuca", "Papa salada"],
  activo: true
};

function dinero(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
}

function textoALista(texto) {
  return String(texto || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function limpiarAcompanantes(lista) {
  return (Array.isArray(lista) ? lista : [])
    .filter((item) => String(item || "").trim().toLowerCase() !== "sopa")
    .slice(0, MAX_ACOMPANANTES);
}

function calcularTotalItem(item, precioBase) {
  const cantidad = Number(item.cantidad) || 0;
  const adicional = item.paraLlevar ? VALOR_PARA_LLEVAR : 0;
  return cantidad * (Number(precioBase) + adicional);
}

function calcularTotalItems(items, precioBase) {
  return items.reduce((suma, item) => suma + calcularTotalItem(item, precioBase), 0);
}

function crearTextoItem(item) {
  const partes = [`${item.cantidad} ${item.proteina}`];
  const acompanantes = limpiarAcompanantes(item.acompanantes || []);

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
    `Cliente: ${pedido.cliente}`,
    `Teléfono: ${pedido.telefono || "Sin teléfono"}`,
    `Ubicación: ${pedido.ubicacion}`,
    "",
    "Pedido:",
    pedido.pedido_texto || pedido.pedido,
    "",
    `Total: ${dinero(pedido.total)}`
  ].join("\n");
}

function crearLinkWhatsApp(numero, mensaje) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

function crearItemNuevo(menu) {
  return {
    id: Date.now() + Math.random(),
    cantidad: 1,
    proteina: menu.proteinas?.[0] || "",
    acompanantes: limpiarAcompanantes(menu.acompanantes || []),
    paraLlevar: false
  };
}

function consolidarPedidos(pedidos) {
  const resumen = {};

  pedidos.forEach((pedido) => {
    const items = Array.isArray(pedido.items) ? pedido.items : [];

    items.forEach((item) => {
      if (item.proteina) {
        resumen[item.proteina] = (resumen[item.proteina] || 0) + (Number(item.cantidad) || 0);
      }
    });
  });

  return resumen;
}

function CampoTexto({ etiqueta, value, onChange, placeholder, multiline = false, type = "text" }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-stone-700 mb-2">{etiqueta}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-orange-400"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-orange-400"
        />
      )}
    </label>
  );
}

function EstadoBadge({ estado }) {
  const estilos = {
    Pendiente: "bg-amber-100 text-amber-800 border-amber-200",
    "En preparación": "bg-blue-100 text-blue-800 border-blue-200",
    Enviado: "bg-purple-100 text-purple-800 border-purple-200",
    Entregado: "bg-green-100 text-green-800 border-green-200",
    Cancelado: "bg-red-100 text-red-800 border-red-200"
  };

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${estilos[estado] || "bg-stone-100 text-stone-700 border-stone-200"}`}>
      {estado}
    </span>
  );
}

function SelectorCantidad({ cantidad, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(1, cantidad - 1))} className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-xl font-black">
        −
      </button>
      <span className="w-8 text-center text-2xl font-black">{cantidad}</span>
      <button type="button" onClick={() => onChange(cantidad + 1)} className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-xl font-black">
        +
      </button>
    </div>
  );
}

export default function App() {
  const [vista, setVista] = useState("inicio");
  const [menu, setMenu] = useState(menuFallback);
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

  const totalPedido = useMemo(() => calcularTotalItems(itemsPedido, menu.precio), [itemsPedido, menu.precio]);
  const consolidado = useMemo(() => consolidarPedidos(pedidos), [pedidos]);
  const totalVendido = useMemo(() => pedidos.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0), [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return pedidos;

    return pedidos.filter((pedido) =>
      `${pedido.cliente} ${pedido.telefono} ${pedido.ubicacion} ${pedido.pedido_texto} ${pedido.estado}`
        .toLowerCase()
        .includes(q)
    );
  }, [pedidos, busqueda]);

  const mensajeWhatsAppFinal = pedidoFinalizado ? crearMensajeWhatsAppPedido(pedidoFinalizado) : "";
  const linkWhatsAppFinal = pedidoFinalizado ? crearLinkWhatsApp(WHATSAPP_RAFIKI, mensajeWhatsAppFinal) : "#";

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);

    const { data: menuData, error: menuError } = await supabase
      .from("menu_diario")
      .select("*")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (menuError) {
      setMensaje(`Error cargando menú: ${menuError.message}`);
    }

    if (menuData) {
      setMenu(menuData);
      setItemsPedido([crearItemNuevo(menuData)]);
    }

    const { data: pedidosData, error: pedidosError } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (pedidosError) {
      setMensaje(`Error cargando pedidos: ${pedidosError.message}`);
    }

    if (pedidosData) {
      setPedidos(pedidosData);
    }

    setCargando(false);
  }

  function actualizarItem(id, cambios) {
    setItemsPedido((actual) => actual.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
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

        if (item.acompanantes.length >= MAX_ACOMPANANTES) {
          setMensaje(`Solo puedes escoger ${MAX_ACOMPANANTES} acompañantes por almuerzo. La sopa y la bebida ya están incluidas.`);
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
    setItemsPedido((actual) => (actual.length === 1 ? actual : actual.filter((item) => item.id !== id)));
  }

  async function registrarPedido() {
    const itemsValidos = itemsPedido
      .filter((item) => item.proteina)
      .map((item) => ({
        ...item,
        acompanantes: limpiarAcompanantes(item.acompanantes)
      }));

    const pedidoTexto = crearTextoPedido(itemsValidos, observaciones.trim());
    const total = calcularTotalItems(itemsValidos, menu.precio);

    const nuevoPedido = {
      cliente: cliente.trim() || "Cliente",
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
    const menuActualizado = {
      titulo: menu.titulo,
      descripcion: menu.descripcion,
      precio: Number(menu.precio) || 0,
      proteinas: menu.proteinas,
      acompanantes: limpiarAcompanantes(menu.acompanantes),
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

      setMenu(data);
      setMensaje("Menú actualizado correctamente.");
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

    setMenu(data);
    setMensaje("Menú creado correctamente.");
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

  function actualizarListaMenu(campo, texto) {
    const nuevaLista = campo === "acompanantes" ? limpiarAcompanantes(textoALista(texto)) : textoALista(texto);

    setMenu((actual) => ({
      ...actual,
      [campo]: nuevaLista
    }));

    if (campo === "proteinas") {
      setItemsPedido((actual) =>
        actual.map((item) => ({
          ...item,
          proteina: nuevaLista.includes(item.proteina) ? item.proteina : nuevaLista[0] || ""
        }))
      );
    }

    if (campo === "acompanantes") {
      setItemsPedido((actual) =>
        actual.map((item) => ({
          ...item,
          acompanantes: limpiarAcompanantes(item.acompanantes.filter((a) => nuevaLista.includes(a)))
        }))
      );
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 text-stone-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
              🍽️ Rafiki Pedidos
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Menú diario y pedidos por WhatsApp
            </h1>
            <p className="mt-2 max-w-2xl text-stone-600">
              App real conectada a Supabase.
            </p>
          </div>

          {vista !== "inicio" && (
            <div className="flex w-full gap-1 rounded-2xl border bg-white p-1 shadow-sm md:w-auto">
              <button
                type="button"
                onClick={() => setVista("cliente")}
                className={`flex-1 rounded-xl px-5 py-3 font-black transition md:flex-none ${vista === "cliente" ? "bg-orange-500 text-white shadow" : "text-stone-600 hover:bg-orange-50"}`}
              >
                Vista cliente
              </button>
              <button
                type="button"
                onClick={() => setVista("inicio")}
                className="flex-1 rounded-xl px-5 py-3 font-black text-stone-600 transition hover:bg-orange-50 md:flex-none"
              >
                Inicio
              </button>
            </div>
          )}
        </header>

        {mensaje && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 font-semibold text-green-800">
            {mensaje}
          </div>
        )}

        {cargando && (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow">
            Cargando datos de Rafiki...
          </div>
        )}

        {!cargando && vista === "inicio" && (
          <main className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-xl">
              <div className="bg-gradient-to-br from-orange-500 to-amber-400 p-8 text-white">
                <p className="text-5xl">🍽️</p>
                <h2 className="mt-3 text-4xl font-black">Pedido cliente</h2>
                <p className="mt-2 text-orange-50">
                  Esta es la opción que usarán tus clientes.
                </p>
              </div>
              <div className="p-6 md:p-8">
                <ul className="mb-6 space-y-3 text-sm font-semibold text-stone-600">
                  <li>✅ Ver menú del día</li>
                  <li>✅ Escoger proteína</li>
                  <li>✅ Escoger máximo 3 acompañantes</li>
                  <li>✅ Enviar consolidado por WhatsApp</li>
                </ul>
                <button
                  type="button"
                  onClick={() => setVista("cliente")}
                  className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-lg font-black text-white shadow transition hover:bg-orange-600"
                >
                  Entrar como cliente
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl">
              <div className="bg-gradient-to-br from-stone-800 to-stone-600 p-8 text-white">
                <p className="text-5xl">🔐</p>
                <h2 className="mt-3 text-4xl font-black">Panel administrativo</h2>
                <p className="mt-2 text-stone-200">
                  Entrada interna para Rafiki.
                </p>
              </div>
              <div className="p-6 md:p-8">
                <ul className="mb-6 space-y-3 text-sm font-semibold text-stone-600">
                  <li>✅ Editar menú diario</li>
                  <li>✅ Ver pedidos recibidos</li>
                  <li>✅ Cambiar estado del pedido</li>
                  <li>✅ Revisar consolidado de cocina</li>
                </ul>
                <button
                  type="button"
                  onClick={() => setVista("admin")}
                  className="w-full rounded-2xl bg-stone-800 px-5 py-4 text-lg font-black text-white shadow transition hover:bg-stone-900"
                >
                  Entrar al panel admin
                </button>
              </div>
            </section>
          </main>
        )}

        {!cargando && vista === "cliente" && (
          <main className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-xl">
              <div className="bg-gradient-to-br from-orange-500 to-amber-400 p-8 text-white">
                <p className="font-semibold opacity-90">{menu.fecha}</p>
                <h2 className="mt-2 text-4xl font-black">{menu.titulo}</h2>
                <p className="mt-3 text-lg text-orange-50">{menu.descripcion}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="inline-flex rounded-2xl bg-white px-5 py-3 text-2xl font-black text-orange-600 shadow">
                    {dinero(menu.precio)}
                  </div>
                  <div className="inline-flex rounded-2xl bg-orange-900/20 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30">
                    Para llevar suma {dinero(VALOR_PARA_LLEVAR)}
                  </div>
                  <div className="inline-flex rounded-2xl bg-white/20 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30">
                    Incluye sopa y bebida
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6 md:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">🛍️ Almuerzos del pedido</h3>
                    <p className="text-sm font-semibold text-stone-500">
                      Agrega uno o varios almuerzos. Máximo 3 acompañantes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={agregarAlmuerzo}
                    className="rounded-2xl bg-orange-500 px-5 py-3 font-black text-white shadow transition hover:bg-orange-600"
                  >
                    + Agregar almuerzo
                  </button>
                </div>

                {itemsPedido.map((item, index) => (
                  <div key={item.id} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="text-xl font-black">Almuerzo #{index + 1}</h4>
                      {itemsPedido.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarAlmuerzo(item.id)}
                          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <h5 className="mb-3 font-black">Proteína</h5>
                    <div className="mb-5 grid gap-3 sm:grid-cols-2">
                      {menu.proteinas.map((proteina) => (
                        <button
                          key={proteina}
                          type="button"
                          onClick={() => actualizarItem(item.id, { proteina })}
                          className={`rounded-2xl border p-4 text-left font-bold transition ${
                            item.proteina === proteina
                              ? "border-orange-500 bg-white text-orange-700 shadow-sm"
                              : "border-stone-200 bg-white/70 hover:border-orange-300"
                          }`}
                        >
                          {proteina}
                        </button>
                      ))}
                    </div>

                    <div className="mb-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h5 className="font-black">Acompañantes</h5>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-200">
                          {item.acompanantes.length}/{MAX_ACOMPANANTES}
                        </span>
                      </div>
                      <p className="mb-3 text-sm font-semibold text-stone-500">
                        Puedes escoger máximo {MAX_ACOMPANANTES}.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {menu.acompanantes.map((acompanante) => {
                          const seleccionado = item.acompanantes.includes(acompanante);
                          const bloqueado = !seleccionado && item.acompanantes.length >= MAX_ACOMPANANTES;

                          return (
                            <button
                              key={acompanante}
                              type="button"
                              onClick={() => cambiarAcompananteItem(item.id, acompanante)}
                              disabled={bloqueado}
                              className={`rounded-full border px-4 py-3 font-bold ${
                                seleccionado
                                  ? "border-green-300 bg-green-100 text-green-700"
                                  : bloqueado
                                  ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                                  : "border-stone-200 bg-white"
                              }`}
                            >
                              {seleccionado ? "✓ " : "+ "}
                              {acompanante}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-5 rounded-2xl border bg-white p-4">
                      <p className="font-black">🥣 Sopa y bebida</p>
                      <p className="text-sm font-semibold text-stone-500">
                        Incluidas automáticamente.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h5 className="mb-3 font-black">Cantidad</h5>
                        <div className="rounded-2xl border bg-white p-3">
                          <SelectorCantidad
                            cantidad={item.cantidad}
                            onChange={(cantidad) => actualizarItem(item.id, { cantidad })}
                          />
                        </div>
                      </div>

                      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border bg-white p-4">
                        <div>
                          <p className="font-black">🥡 Para llevar</p>
                          <p className="text-sm font-semibold text-stone-500">
                            Suma {dinero(VALOR_PARA_LLEVAR)}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={item.paraLlevar}
                          onChange={(e) => actualizarItem(item.id, { paraLlevar: e.target.checked })}
                          className="h-6 w-6 accent-orange-500"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex justify-between rounded-2xl border bg-white p-4">
                      <span className="font-semibold text-stone-500">Subtotal</span>
                      <span className="text-xl font-black text-orange-600">
                        {dinero(calcularTotalItem(item, menu.precio))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl lg:sticky lg:top-6">
              <h3 className="mb-2 text-2xl font-black">Datos de entrega</h3>
              <p className="mb-5 text-stone-500">
                Estos datos se guardan y luego el cliente puede enviar el consolidado por WhatsApp.
              </p>

              <div className="mb-5 rounded-3xl border bg-stone-50 p-5">
                <h4 className="mb-3 text-lg font-black">Resumen</h4>
                <div className="space-y-3">
                  {itemsPedido.map((item, index) => (
                    <div key={item.id} className="rounded-2xl border bg-white p-3 text-sm font-semibold text-stone-700">
                      <p className="font-black text-stone-900">
                        #{index + 1} {item.cantidad} {item.proteina || "Sin proteína"}
                      </p>
                      <p>{item.acompanantes.join(", ") || "Sin acompañantes"}</p>
                      <p>Sopa + bebida incluida</p>
                      <p>{item.paraLlevar ? "Para llevar" : "Sin empaque para llevar"}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between border-t pt-4">
                  <span className="font-black">Total</span>
                  <span className="text-2xl font-black text-orange-600">{dinero(totalPedido)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <CampoTexto etiqueta="👤 Nombre" value={cliente} onChange={setCliente} placeholder="Ej: Laura Pérez" />
                <CampoTexto etiqueta="📞 Teléfono" value={telefono} onChange={setTelefono} placeholder="Ej: 300 123 4567" />
                <CampoTexto etiqueta="📍 Ubicación" value={ubicacion} onChange={setUbicacion} placeholder="Ej: Edificio, oficina o barrio" />
                <CampoTexto etiqueta="Observaciones generales" value={observaciones} onChange={setObservaciones} placeholder="Ej: llevar a recepción, sin cubiertos, pago en efectivo..." multiline />
              </div>

              <button
                type="button"
                onClick={registrarPedido}
                disabled={itemsPedido.every((item) => !item.proteina)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-lg font-black text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-50"
              >
                Revisar y finalizar pedido
              </button>
            </aside>
          </main>
        )}

        {!cargando && vista === "confirmacion" && pedidoFinalizado && (
          <main className="mx-auto max-w-3xl">
            <section className="overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-xl">
              <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-8 text-white">
                <p className="text-5xl">✅</p>
                <h2 className="mt-3 text-4xl font-black">Pedido finalizado</h2>
                <p className="mt-2 text-green-50">
                  Revisa el consolidado y envíalo a Rafiki por WhatsApp.
                </p>
              </div>

              <div className="space-y-5 p-6 md:p-8">
                <div className="rounded-3xl border bg-stone-50 p-5">
                  <h3 className="mb-4 text-2xl font-black">Consolidado del pedido</h3>
                  <p><strong>Cliente:</strong> {pedidoFinalizado.cliente}</p>
                  <p><strong>Teléfono:</strong> {pedidoFinalizado.telefono}</p>
                  <p><strong>Ubicación:</strong> {pedidoFinalizado.ubicacion}</p>
                  <div className="mt-4 whitespace-pre-line rounded-2xl border bg-white p-4 font-semibold">
                    {pedidoFinalizado.pedido_texto}
                  </div>
                  <div className="mt-4 flex justify-between rounded-2xl border bg-white p-4">
                    <span className="text-lg font-black">Total</span>
                    <span className="text-3xl font-black text-orange-600">{dinero(pedidoFinalizado.total)}</span>
                  </div>
                </div>

                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border bg-green-50 p-4 text-sm font-semibold text-stone-700">
                  {mensajeWhatsAppFinal}
                </pre>

                <a
                  href={linkWhatsAppFinal}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-2xl bg-green-500 px-5 py-4 text-center text-lg font-black text-white shadow-lg transition hover:bg-green-600"
                >
                  🟢 Enviar consolidado por WhatsApp
                </a>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={nuevoPedidoCliente}
                    className="rounded-2xl border bg-white px-5 py-4 font-black text-stone-700 transition hover:bg-stone-50"
                  >
                    Hacer otro pedido
                  </button>
                  <button
                    type="button"
                    onClick={() => setVista("inicio")}
                    className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 font-black text-orange-700 transition hover:bg-orange-100"
                  >
                    Volver al inicio
                  </button>
                </div>
              </div>
            </section>
          </main>
        )}

        {!cargando && vista === "admin" && (
          <main className="grid gap-6 xl:grid-cols-[380px_1fr]">
            <section className="space-y-6">
              <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl">
                <h2 className="mb-5 text-2xl font-black">✏️ Editar menú diario</h2>
                <div className="space-y-4">
                  <CampoTexto etiqueta="Fecha" value={menu.fecha || ""} onChange={(valor) => setMenu((actual) => ({ ...actual, fecha: valor }))} />
                  <CampoTexto etiqueta="Nombre del menú" value={menu.titulo || ""} onChange={(valor) => setMenu((actual) => ({ ...actual, titulo: valor }))} />
                  <CampoTexto etiqueta="Descripción" value={menu.descripcion || ""} onChange={(valor) => setMenu((actual) => ({ ...actual, descripcion: valor }))} multiline />
                  <CampoTexto etiqueta="Precio base del almuerzo" type="number" value={String(menu.precio || 0)} onChange={(valor) => setMenu((actual) => ({ ...actual, precio: Number(valor) || 0 }))} />
                  <CampoTexto etiqueta="Proteínas separadas por coma" value={(menu.proteinas || []).join(", ")} onChange={(valor) => actualizarListaMenu("proteinas", valor)} multiline />
                  <CampoTexto etiqueta="Acompañantes adicionales separados por coma" value={(menu.acompanantes || []).join(", ")} onChange={(valor) => actualizarListaMenu("acompanantes", valor)} multiline />
                </div>
                <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-semibold text-orange-800">
                  Sopa y bebida siempre van incluidas. Solo se editan acompañantes adicionales.
                </div>
                <button
                  type="button"
                  onClick={guardarMenu}
                  className="mt-5 w-full rounded-2xl bg-orange-500 py-4 font-black text-white shadow transition hover:bg-orange-600"
                >
                  Guardar menú del día
                </button>
              </div>

              <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-2xl font-black">Consolidado cocina</h2>
                <div className="space-y-3">
                  {Object.keys(consolidado).length === 0 ? (
                    <p className="rounded-2xl border bg-stone-50 p-4 font-semibold text-stone-500">
                      Todavía no hay productos para consolidar.
                    </p>
                  ) : (
                    Object.entries(consolidado).map(([producto, cantidadProducto]) => (
                      <div key={producto} className="flex items-center justify-between rounded-2xl border bg-stone-50 p-4">
                        <span className="font-bold">{producto}</span>
                        <span className="text-xl font-black text-orange-600">{cantidadProducto}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-black">📋 Pedidos de hoy</h2>
                  <p className="text-stone-500">Revisa pedidos, ubicación, total y estado.</p>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">🔎</span>
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar pedido..."
                    className="w-full rounded-2xl border bg-stone-50 py-3 pl-11 pr-4 outline-none focus:border-orange-400 md:w-72"
                  />
                </div>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
                  <p className="font-semibold text-stone-500">Pedidos</p>
                  <p className="text-3xl font-black">{pedidos.length}</p>
                </div>
                <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
                  <p className="font-semibold text-stone-500">Entregados</p>
                  <p className="text-3xl font-black">{pedidos.filter((p) => p.estado === "Entregado").length}</p>
                </div>
                <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5">
                  <p className="font-semibold text-stone-500">Total vendido</p>
                  <p className="text-3xl font-black">{dinero(totalVendido)}</p>
                </div>
              </div>

Need respond next steps. Mention canvas has corrupted duplicate manual edit; but real project code from previous is clean? The developer context shows manual canvas contains duplicate corruption at the end, should refer if edit requested. Here user says they executed. Need answer with next step: create Vercel env and files. Since we already gave full code. Now maybe guide to Vercel and variables. Need mention Supabase URL/key. Maybe say don't use canvas code because duplicate in canvas? But user probably not asking. "ya ejecuté". We need provide specific next actions.

Need perhaps suggest "perfecto, ahora haz GitHub files; after create send link." We can include the 3 env variables and how to add in Vercel. Maybe because step now.

Need maybe mention "NO copies from canvas because it currently has duplicate block" due context. Since user may use canvas. For safe, say usaremos code from previous message for App.jsx, not canvas unless we clean it. But maybe should update canvas to set WHATSAPP_RAFIKI to provided and remove duplicate? We may not need. But maybe user wants make reality with code, not canvas. Since canmore only single file, not full project. Could offer to clean App.jsx? But final should provide step-by-step.

Need maybe note exact where variables in Vercel. Also need "commit" steps.

Need include citations from web used. "Vite variables VITE_ ..." cite; "Vercel env ..." cite. Since web used, cite statements. "Supabase JS createClient"? search poor, but cite Supabase homepage? It didn't show createClient. Use another search? Maybe official docs by URL maybe open maybe reference. We'll cite Vite/Vercel only, not Supabase? But we can mention no citation maybe. Need if called web, all internet facts cited. We can cite Supabase generic? Better use docs search for createClient maybe. use web open? Search better. 
Need no more tools? Maybe enough. We can cite Supabase docs? Search result not specific. Could mention "Supabase project is postgres ..." irrelevant. We need cite if saying Vercel environment. We have sources. Fine.

Need answer Spanish.

Need include that user shouldn't paste service_role. They provided public key. But no secret. Fine.

Final with exact steps:
1. In GitHub create/edit files.
2. In Vercel import project: Add New Project -> import GitHub -> framework auto Vite -> env vars: all 3 -> deploy.
3. After deploy if error, "Redeploy" after env variables because changes don't apply old deployments cite Vercel.
4. Test flows.

But user asked "ya", so "siguiente paso".

Need maybe include "cuando app cargue, error common: not connected if RLS/policies". But okay.

Need not end with "I can". Could say "Cuando termines el deploy, envíame captura..." Is that follow-up suggestion one max. Fine.

Let's respond. 
Also could mention "VITE_SUPABASE_ANON_KEY" uses publishable key. 
VITE docs: cite. Vercel env cite.
Need no raw URLs. Good.

Final desired oververbosity 4. Need concise but clear.

Let's produce with steps. 
Also state "No compartas secret/service_role". Good. 
Use markdown. 
Need "siguiente paso: subir app a GitHub" etc. 
Ensure no "if you want". Avoid "Si quieres". Use "Ahora haz". 
Ok. 
Wait user said "ya ejecuté SQL" but not created GitHub? Maybe maybe they have repo already. We need phrase "Ahora vamos a GitHub". Good. 
Include variables values. 
Need maybe mention "después de agregar variables, deploy." 
Need mention "en Vercel variables must be in Production/Preview/Development and redeploy after changes" cite. 

Final. 

::contentReference[oaicite:1]{index=1}
