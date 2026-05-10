import { VALOR_PARA_LLEVAR, MAX_ACOMPANANTES_CLIENTE, INCLUIDOS_FIJOS, menuFallback } from "../data/menuAlmuerzos";

const STORAGE_PEDIDOS_REVISADOS = "rafikiPedidosRevisados";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function limpiarTexto(valor, max = 120) {
  return String(valor || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function limpiarTelefono(valor) {
  return String(valor || "")
    .replace(/[^\d\s\+\-\(\)]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
}

export function guardarSesionTemporal(claveStorage) {
  const expiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(claveStorage, JSON.stringify({ v: true, exp: expiry }));
}

export function obtenerSesionActiva(claveStorage) {
  try {
    const sesion = JSON.parse(localStorage.getItem(claveStorage) || "null");

    if (!sesion?.v || !sesion?.exp || Date.now() > sesion.exp) {
      localStorage.removeItem(claveStorage);
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem(claveStorage);
    return false;
  }
}


export function precioPorNombre(lista, nombre) {
  return Number(lista.find((item) => item.nombre === nombre)?.precio) || 0;
}

export function crearItemCafeteria({ tipo, producto, precio = 0, cantidad = 1, ...extra }) {
  return {
    id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    categoria: "cafeteria",
    tipo,
    producto,
    plato: producto,
    proteina: producto,
    precio: Number(precio) || 0,
    precioPlato: Number(precio) || 0,
    precioProteina: Number(precio) || 0,
    cantidad: Number(cantidad) || 1,
    acompanantes: [],
    observacionAcompanantes: "",
    paraLlevar: false,
    ...extra
  };
}


export function dinero(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
}

export function formatoNumeroPedido(numero) {
  const valor = Number(numero) || 0;

  if (!valor) return "----";
  if (valor >= 10000) return "10000";

  return String(valor).padStart(4, "0");
}

export function obtenerCodigoPedido(pedido) {
  const numeroBase = pedido?.numero_pedido;
  const numero = formatoNumeroPedido(numeroBase);

  if (numero === "----") return "Sin N°";

  const ciclo = Number(pedido?.ciclo_pedido) || 1;

  return ciclo > 1 ? `C${ciclo}-${numero}` : numero;
}

export function fechaISOColombia(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(fecha);
}

export function formatearFechaHora(fecha) {
  if (!fecha) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(fecha));
}

export function obtenerRangoPedidos(filtro = "hoy", fechaManual = fechaISOColombia()) {
  let baseTexto;

  if (filtro === "dia") {
    baseTexto = fechaManual || fechaISOColombia();
  } else {
    // Cualquier filtro distinto a "dia" se interpreta explícitamente como "hoy".
    baseTexto = fechaISOColombia();
  }

  const base = new Date(`${baseTexto}T00:00:00-05:00`);

  const inicio = new Date(base);
  const fin = new Date(base);
  fin.setDate(fin.getDate() + 1);

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString()
  };
}


export function cargarPedidosRevisadosLocal() {
  try {
    const guardado = localStorage.getItem(STORAGE_PEDIDOS_REVISADOS);
    const ids = JSON.parse(guardado || "[]");
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
}

export function guardarPedidosRevisadosLocal(ids) {
  try {
    localStorage.setItem(STORAGE_PEDIDOS_REVISADOS, JSON.stringify(Array.from(new Set(ids.map(String)))));
  } catch {
    // Si el navegador bloquea localStorage, la app sigue funcionando sin persistir el visto.
  }
}

export function pedidoEsDeHoy(pedido) {
  return fechaISOColombia(new Date(pedido?.created_at || Date.now())) === fechaISOColombia();
}

export function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function esCategoriaSopa(categoria) {
  return normalizarTexto(categoria).includes("sopa");
}

export function esSopaParaLlevarGratis(item) {
  const nombre = normalizarTexto(item?.plato || item?.proteina || item?.nombre);
  const categoria = normalizarTexto(item?.categoria);

  if (!categoria.includes("sopa")) return false;

  const nombresGratis = [
    "sopas medianas sin arroz",
    "sopas medianas con arroz",
    "sancocho de pollo con arroz"
  ];

  return nombresGratis.includes(nombre);
}

export function valorParaLlevarItem(item) {
  if (!item?.paraLlevar) return 0;
  if (esSopaParaLlevarGratis(item)) return 0;
  return VALOR_PARA_LLEVAR;
}

export function textoParaLlevarItem(item) {
  if (!item?.paraLlevar) return "Sin empaque para llevar";

  const valor = valorParaLlevarItem(item);

  if (valor === 0) return "Para llevar sin costo adicional";

  return `Para llevar +${dinero(valor)}`;
}

export function listaPorLineas(texto) {
  return String(texto || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function limpiarAcompanantesMenu(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => item.toLowerCase() !== "sopa");
}

export function limpiarAcompanantesCliente(lista) {
  return limpiarAcompanantesMenu(lista).slice(0, MAX_ACOMPANANTES_CLIENTE);
}

export function textoAPlatosDetalle(texto, { estricto = false } = {}) {
  const lineas = String(texto || "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean);

  const platos = [];
  const errores = [];

  lineas.forEach((linea, index) => {
    const numeroLinea = index + 1;

    if (!linea.includes("|")) {
      if (estricto) {
        errores.push(`Línea ${numeroLinea}: falta el formato "Categoría | Plato:Precio".`);
      }
      return;
    }

    const partesCategoria = linea.split("|");
    const categoria = String(partesCategoria[0] || "Platos").trim() || "Platos";
    const resto = partesCategoria.slice(1).join("|").trim();

    if (!resto) {
      if (estricto) {
        errores.push(`Línea ${numeroLinea}: falta el nombre del plato y el precio.`);
      }
      return;
    }

    const indicePrecio = resto.lastIndexOf(":");

    if (indicePrecio === -1) {
      if (estricto) {
        errores.push(`Línea ${numeroLinea}: falta el precio después de ":".`);
      }
      return;
    }

    const nombre = resto.slice(0, indicePrecio).trim();
    const precioTextoOriginal = resto.slice(indicePrecio + 1).trim();
    const precioTexto = precioTextoOriginal.replace(/[^\d]/g, "");
    const precio = Number(precioTexto);

    if (!nombre) {
      if (estricto) {
        errores.push(`Línea ${numeroLinea}: el nombre del plato está vacío.`);
      }
      return;
    }

    if (!precio || precio <= 0) {
      if (estricto) {
        errores.push(
          `Línea ${numeroLinea}: precio inválido "${precioTextoOriginal || "vacío"}". Usa solo números, ejemplo 18000.`
        );
      }
      return;
    }

    platos.push({ categoria, nombre, precio });
  });

  return { platos, errores };
}

export function platosATexto(platosDetalle) {
  return (platosDetalle || [])
    .map((item) => `${item.categoria || "Platos"} | ${item.nombre}:${Number(item.precio) || 0}`)
    .join("\n");
}

export function acompanantesATexto(acompanantes) {
  return (acompanantes || []).join("\n");
}

export function normalizarPlatos(menu) {
  if (Array.isArray(menu?.platos_detalle) && menu.platos_detalle.length > 0) {
    return menu.platos_detalle
      .map((item) => ({
        categoria: String(item.categoria || "Platos").trim() || "Platos",
        nombre: String(item.nombre || "").trim(),
        precio: Number(item.precio) || 0
      }))
      .filter((item) => item.nombre);
  }

  if (Array.isArray(menu?.proteinas_detalle) && menu.proteinas_detalle.length > 0) {
    return menu.proteinas_detalle
      .map((item) => ({
        categoria: "Platos",
        nombre: String(item.nombre || "").trim(),
        precio: Number(item.precio) || 0
      }))
      .filter((item) => item.nombre);
  }

  if (Array.isArray(menu?.proteinas) && menu.proteinas.length > 0) {
    return menu.proteinas
      .map((nombre) => ({
        categoria: "Platos",
        nombre: String(nombre || "").trim(),
        precio: Number(menu?.precio) || 0
      }))
      .filter((item) => item.nombre);
  }

  return [];
}

export function normalizarMenu(menu) {
  const platosDetalle = normalizarPlatos(menu);
  const acompanantes = limpiarAcompanantesMenu(menu?.acompanantes || []);

  return {
    ...menuFallback,
    ...menu,
    platos_detalle: platosDetalle,
    proteinas_detalle: platosDetalle.map((item) => ({
      nombre: item.nombre,
      precio: item.precio
    })),
    proteinas: platosDetalle.map((item) => item.nombre),
    acompanantes
  };
}

export function agruparPlatosPorCategoria(platos) {
  return (platos || []).reduce((grupos, plato) => {
    const categoria = plato.categoria || "Platos";

    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }

    grupos[categoria].push(plato);
    return grupos;
  }, {});
}

export function obtenerEstadoPedido(pedido) {
  if (pedido.estado === "Finalizado" || pedido.estado === "Entregado") {
    return "Finalizado";
  }

  return "Pendiente";
}

export function limpiarTelefonoWhatsApp(telefono) {
  const digitos = String(telefono || "").replace(/\D/g, "");

  if (!digitos) return "";
  if (digitos.startsWith("57")) return digitos;
  if (digitos.length === 10) return `57${digitos}`;

  return digitos;
}

export function crearMensajePedidoListo(pedido) {
  const cliente = obtenerCliente(pedido);

  return [
    `Hola ${cliente}, su pedido está listo.`,
    "",
    "Gracias por comprar en Rafiki 🍽️"
  ].join("\n");
}

export function crearItemNuevo() {
  return {
    id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    cantidad: 1,
    categoria: "",
    plato: "",
    proteina: "",
    precioPlato: 0,
    precioProteina: 0,
    acompanantes: [],
    observacionAcompanantes: "",
    paraLlevar: true
  };
}

export function calcularTotalItem(item) {
  const cantidad = Number(item.cantidad) || 0;
  const precio = Number(item.precioPlato || item.precioProteina || item.precio || 0);
  const adicional = valorParaLlevarItem(item);

  return cantidad * (precio + adicional);
}

export function calcularTotalItems(items) {
  return items.reduce((suma, item) => suma + calcularTotalItem(item), 0);
}

export function crearTextoItem(item) {
  if (item.categoria === "cafeteria") {
    const nombreProducto = item.producto || item.plato || item.proteina || "Producto cafetería";
    const precio = Number(item.precioPlato || item.precioProteina || item.precio || 0);
    const partes = [`${item.cantidad} ${nombreProducto} (${dinero(precio)})`];

    if (item.tipo) partes.push(`Cafetería: ${item.tipo}`);
    if (item.tamano) partes.push(`Tamaño: ${item.tamano}`);
    if (Array.isArray(item.frutas) && item.frutas.length > 0) partes.push(`Frutas: ${item.frutas.join(", ")}`);
    if (item.cereal) partes.push(`Cereal: ${item.cereal}`);
    if (Number(item.extraFrutas) > 0) partes.push(`Extra 3 frutas: ${dinero(item.extraFrutas)}`);
    if (item.base) partes.push(`Base: ${item.base}`);
    if (item.acompanante) partes.push(`Acompañante: ${item.acompanante}`);
    if (Array.isArray(item.adicionales) && item.adicionales.length > 0) {
      partes.push(`Adicionales: ${item.adicionales.map((x) => x.nombre || x).join(", ")}`);
    }
    if (item.observacionesItem?.trim()) partes.push(`Obs: ${item.observacionesItem.trim()}`);

    return partes.join(" + ");
  }

  const nombrePlato = item.plato || item.proteina || "Plato";
  const precio = Number(item.precioPlato || item.precioProteina || item.precio || 0);
  const partes = [`${item.cantidad} ${nombrePlato} (${dinero(precio)})`];
  const esSopa = esCategoriaSopa(item.categoria);
  const acompanantes = esSopa ? [] : limpiarAcompanantesCliente(item.acompanantes || []);

  if (acompanantes.length > 0) {
    partes.push(acompanantes.join(", "));
  }

  if (!esSopa && item.observacionAcompanantes?.trim()) {
    partes.push(`Obs. acompañantes: ${item.observacionAcompanantes.trim()}`);
  }

  if (!esSopa) {
    partes.push(INCLUIDOS_FIJOS);
  }

  if (item.paraLlevar) {
    const valor = valorParaLlevarItem(item);
    partes.push(valor === 0 ? "Para llevar sin costo adicional" : `Para llevar +${dinero(valor)}`);
  }

  return partes.join(" + ");
}

export function crearTextoPedido(items, observaciones) {
  let texto = items.map(crearTextoItem).join("\n");

  if (observaciones) {
    texto += `\nObservaciones: ${observaciones}`;
  }

  return texto;
}

export function crearMensajeWhatsAppPedido(pedido) {
  return [
    "Hola Rafiki, quiero confirmar este pedido:",
    "",
    `Pedido N°: ${obtenerCodigoPedido(pedido)}`,
    `Cliente: ${pedido.cliente || pedido.cliente_nombre || "Cliente"}`,
    `Teléfono: ${pedido.telefono || "Sin teléfono"}`,
    `Ubicación: ${pedido.ubicacion || "Sin ubicación"}`,
    `Tipo de pago: ${pedido.tipo_pago || "No especificado"}`,
    "",
    "Pedido:",
    pedido.pedido_texto || "",
    "",
    `Total: ${dinero(pedido.total)}`
  ].join("\n");
}

export function esDispositivoMovil() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

export function crearLinkWhatsApp(numero, mensaje, { abrirApp = false } = {}) {
  const telefono = limpiarTelefonoWhatsApp(numero);
  const texto = encodeURIComponent(mensaje || "");

  if (abrirApp && !esDispositivoMovil()) {
    return `https://web.whatsapp.com/send?phone=${telefono}&text=${texto}`;
  }

  return `https://api.whatsapp.com/send?phone=${telefono}&text=${texto}`;
}

export function obtenerCliente(pedido) {
  return pedido.cliente || pedido.cliente_nombre || "Cliente";
}

export function obtenerItemsPedido(pedido) {
  return Array.isArray(pedido.items) ? pedido.items : [];
}

export function textoMayusculasTicket(texto) {
  return String(texto || "")
    .trim()
    .toUpperCase();
}

export function horaTicket(fecha) {
  if (!fecha) return new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(fecha));
}

export function crearDatosTicketPedido(pedido) {
  const items = obtenerItemsPedido(pedido);
  const productos = [];
  const acompanantes = [];
  const observaciones = [];
  const esPedidoMesa = pedido?.tipo_pedido === "mesa" || Boolean(pedido?.mesa);

  items.forEach((item) => {
    const cantidad = Number(item.cantidad) || 1;
    const esCafeteria = item.categoria === "cafeteria";
    const nombreBase = item.plato || item.proteina || item.producto || item.nombre || "Producto";

    if (esCafeteria) {
      const tipo = textoMayusculasTicket(item.tipo || "Cafetería");
      const tamano = textoMayusculasTicket(item.tamano || "");
      const producto = textoMayusculasTicket(item.producto || item.nombre || "");
      const lineaPrincipal = item.tipo === "Parfait"
        ? `${cantidad} PARFAIT${tamano ? ` ${tamano}` : ""}`
        : `${cantidad} ${tipo}${producto ? ` - ${producto}` : ""}`;

      productos.push(lineaPrincipal);

      if (Array.isArray(item.frutas) && item.frutas.length) {
        productos.push(`  FRUTAS: ${item.frutas.map(textoMayusculasTicket).join(", ")}`);
      }

      if (item.cereal) productos.push(`  CEREAL: ${textoMayusculasTicket(item.cereal)}`);
      if (Number(item.extraFrutas) > 0) productos.push("  EXTRA FRUTAS: +$1.000");
      if (item.base) productos.push(`  BASE: ${textoMayusculasTicket(item.base)}`);
      if (item.acompanante) productos.push(`  ACOMPAÑANTE: ${textoMayusculasTicket(item.acompanante)}`);

      if (Array.isArray(item.adicionales) && item.adicionales.length) {
        productos.push(`  ADICIONALES: ${item.adicionales.map((adicional) => textoMayusculasTicket(adicional.nombre || adicional)).join(", ")}`);
      }
    } else {
      productos.push(`${cantidad} ${textoMayusculasTicket(nombreBase)}`);
    }

    if (Array.isArray(item.acompanantes)) {
      item.acompanantes.forEach((acompanante) => {
        const limpio = textoMayusculasTicket(acompanante);
        if (limpio && !acompanantes.includes(limpio)) acompanantes.push(limpio);
      });
    }

    if (item.observacionAcompanantes?.trim()) {
      observaciones.push(`OBS. ACOMPAÑANTES: ${textoMayusculasTicket(item.observacionAcompanantes)}`);
    }

    if (!esPedidoMesa && item.paraLlevar) {
      const textoEmpaque = valorParaLlevarItem(item) > 0 ? "PARA LLEVAR" : "PARA LLEVAR SIN COSTO";
      observaciones.push(`${textoMayusculasTicket(nombreBase)}: ${textoEmpaque}`);
    }
  });

  if (pedido.observaciones?.trim()) {
    observaciones.unshift(textoMayusculasTicket(pedido.observaciones));
  }

  const tieneParaLlevar = items.some((item) => item.paraLlevar);
  const clienteTicket = esPedidoMesa
    ? `${textoMayusculasTicket(pedido.mesa || "MESA")} - ${textoMayusculasTicket(pedido.mesero || "MESERO")}`
    : textoMayusculasTicket(obtenerCliente(pedido));

  return {
    codigo: obtenerCodigoPedido(pedido),
    hora: horaTicket(pedido.created_at),
    cliente: clienteTicket,
    productos: productos.length ? productos : listaPorLineas(pedido.pedido_texto).map(textoMayusculasTicket),
    acompanantes,
    observaciones,
    entrega: esPedidoMesa ? "SERVIR EN MESA" : (tieneParaLlevar ? "PARA LLEVAR" : "SERVIR EN MESA")
  };
}

export function imprimirTicketPedido(pedido) {
  const ticket = crearDatosTicketPedido(pedido);
  const linea = "================";
  const separador = "----------------";
  const crearLineas = (lineas) => lineas.map((lineaTexto) => `<div>${lineaTexto}</div>`).join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Pedido ${ticket.codigo}</title>
        <style>
          @page { size: 58mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
          }
          .ticket {
            width: 58mm;
            padding: 8px 5px 12px;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .linea {
            font-family: "Courier New", monospace;
            font-size: 16px;
            font-weight: 900;
            line-height: 1.1;
            white-space: pre;
          }
          .titulo {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0px;
            margin: 4px 0;
            white-space: nowrap;
          }
          .info {
            font-size: 16px;
            font-weight: 800;
            line-height: 1.35;
            margin: 12px 0 10px;
          }
          .label {
            font-size: 16px;
            font-weight: 900;
            margin-top: 6px;
          }
          .cliente {
            font-size: 18px;
            font-weight: 900;
            margin: 2px 0 10px;
          }
          .bloque {
            font-size: 19px;
            font-weight: 900;
            line-height: 1.32;
            margin: 10px 0;
            text-transform: uppercase;
            word-break: break-word;
          }
          .acompanantes {
            font-size: 18px;
            font-weight: 900;
          }
          .observaciones {
            font-size: 19px;
            font-weight: 900;
          }
          .entrega {
            font-size: 21px;
            font-weight: 900;
            margin: 14px 0 8px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="linea center">${linea}</div>
          <div class="titulo center">RAFIKI&nbsp;PEDIDO</div>
          <div class="linea center">${linea}</div>

          <div class="info">
            <div>Pedido #${ticket.codigo}</div>
            <div>Hora: ${ticket.hora}</div>
          </div>

          <div class="label">Cliente:</div>
          <div class="cliente">${ticket.cliente || "CLIENTE"}</div>

          <div class="linea">${separador}</div>
          <div class="bloque">${crearLineas(ticket.productos)}</div>

          ${ticket.acompanantes.length ? `
            <div class="linea">${separador}</div>
            <div class="bloque acompanantes">${crearLineas(ticket.acompanantes)}</div>
          ` : ""}

          ${ticket.observaciones.length ? `
            <div class="linea">${separador}</div>
            <div class="label">OBSERVACIONES:</div>
            <div class="bloque observaciones">${crearLineas(ticket.observaciones)}</div>
          ` : ""}

          <div class="linea">${separador}</div>
          <div class="entrega">${ticket.entrega}</div>
          <div class="linea center">${linea}</div>
        </div>
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

  const ventana = window.open("", "_blank", "width=420,height=700");

  if (!ventana) {
    alert("El navegador bloqueó la impresión. Permite ventanas emergentes para Rafiki Pedidos.");
    return;
  }

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
}

export function consolidarPedidos(pedidos) {
  const resumen = {};

  pedidos.forEach((pedido) => {
    obtenerItemsPedido(pedido).forEach((item) => {
      const nombre = item.plato || item.proteina || item.producto || item.nombre;

      if (nombre) {
        resumen[nombre] = (resumen[nombre] || 0) + (Number(item.cantidad) || 0);
      }
    });
  });

  return resumen;
}

