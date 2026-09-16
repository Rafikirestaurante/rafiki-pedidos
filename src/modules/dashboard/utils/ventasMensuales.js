import { fechaColombiaYYYYMMDD } from "../../../shared/utils/fechasColombia";
import { aPesosEnteros } from "../../../shared/utils/money";
import { calcularTotalItem, obtenerEstadoPedido } from "../../../shared/utils/pedidos";

const NOMBRES_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function mesValido(mes) {
  return typeof mes === "string" && /^\d{4}-\d{2}$/.test(mes);
}

function fechaUtcMediodia(year, monthIndex, day = 1) {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
}

export function obtenerMesColombia(valor = new Date()) {
  return fechaColombiaYYYYMMDD(valor).slice(0, 7);
}

export function desplazarMes(mes, cantidad = 0) {
  const mesBase = mesValido(mes) ? mes : obtenerMesColombia();
  const [year, month] = mesBase.split("-").map(Number);
  const fecha = fechaUtcMediodia(year, month - 1 + Number(cantidad || 0));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function obtenerRangoMesColombia(mes) {
  const mesBase = mesValido(mes) ? mes : obtenerMesColombia();
  const [year, month] = mesBase.split("-").map(Number);
  const siguiente = fechaUtcMediodia(year, month);
  const siguienteMes = `${siguiente.getUTCFullYear()}-${String(siguiente.getUTCMonth() + 1).padStart(2, "0")}-01`;

  return {
    inicioTexto: `${mesBase}-01`,
    finTexto: `${mesBase}-${String(obtenerDiasDelMes(mesBase)).padStart(2, "0")}`,
    finExclusivoTexto: siguienteMes,
    inicio: new Date(`${mesBase}-01T00:00:00-05:00`).toISOString(),
    fin: new Date(`${siguienteMes}T00:00:00-05:00`).toISOString()
  };
}

export function formatearNombreMes(mes) {
  const mesBase = mesValido(mes) ? mes : obtenerMesColombia();
  const [year, month] = mesBase.split("-").map(Number);
  const texto = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(fechaUtcMediodia(year, month - 1));

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function obtenerDiasDelMes(mes) {
  const mesBase = mesValido(mes) ? mes : obtenerMesColombia();
  const [year, month] = mesBase.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function obtenerOffsetCalendarioLunes(mes) {
  const mesBase = mesValido(mes) ? mes : obtenerMesColombia();
  const [year, month] = mesBase.split("-").map(Number);
  const diaSemanaDomingoCero = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (diaSemanaDomingoCero + 6) % 7;
}

function crearDia(mes, dia) {
  const fecha = `${mes}-${String(dia).padStart(2, "0")}`;
  return {
    fecha,
    dia,
    total: 0,
    pedidos: 0,
    ticketPromedio: 0,
    unidades: 0,
    gastos: 0,
    resultado: 0
  };
}


function textoLimpio(valor) {
  return String(valor || "").replace(/\s+/g, " ").trim();
}

function normalizarFiltro(valor) {
  return textoLimpio(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tituloDesdeTexto(valor, respaldo = "Otros") {
  const texto = textoLimpio(valor) || respaldo;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function obtenerNombreProductoVenta(item = {}) {
  const tipo = normalizarFiltro(item?.tipo);
  if (tipo.includes("parfait") && textoLimpio(item?.tamano)) {
    return `Parfait ${textoLimpio(item.tamano)}`;
  }
  return textoLimpio(item?.producto || item?.plato || item?.proteina || item?.nombre) || "Producto sin nombre";
}

export function obtenerCategoriaProductoVenta(item = {}) {
  const area = normalizarFiltro(item?.area || item?.categoria);
  const tipo = normalizarFiltro(item?.tipo);

  if (area.includes("cafeteria") || normalizarFiltro(item?.categoria).includes("cafeteria")) {
    if (tipo.includes("parfait")) return "Parfait";
    if (tipo.includes("batido") || tipo.includes("jugo")) return "Batidos";
    if (tipo.includes("desayuno")) return "Desayunos";
    if (tipo.includes("comida") || tipo.includes("sandwich")) return "Comida";
    if (tipo.includes("bebida")) return "Bebidas";
    if (tipo.includes("postre")) return "Postres";
    if (tipo.includes("adicional")) return "Adicionales Cafetería";
    return tituloDesdeTexto(item?.tipo, "Cafetería");
  }

  const categoria = tituloDesdeTexto(item?.categoria, "Almuerzos");
  if (normalizarFiltro(categoria).includes("adicional")) return "Adicionales Restaurante";
  return categoria;
}

function obtenerCantidadItemVenta(item = {}) {
  const cantidad = Number(item?.cantidad);
  return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
}

function calcularValorItemVenta(item = {}) {
  return Math.max(calcularTotalItem({ ...item, cantidad: obtenerCantidadItemVenta(item) }), 0);
}

function coincideItemConFiltros(item, filtros = {}) {
  const categoria = textoLimpio(filtros?.categoria);
  const productos = Array.isArray(filtros?.productos) ? filtros.productos.map(textoLimpio).filter(Boolean) : [];

  if (categoria && obtenerCategoriaProductoVenta(item) !== categoria) return false;
  if (productos.length > 0 && !productos.includes(obtenerNombreProductoVenta(item))) return false;
  return true;
}

export function hayFiltrosVentasActivos(filtros = {}) {
  return Boolean(textoLimpio(filtros?.categoria) || (Array.isArray(filtros?.productos) && filtros.productos.length > 0));
}

export function obtenerCatalogoFiltrosVentas(pedidos = []) {
  const porCategoria = new Map();

  (pedidos || []).forEach((pedido) => {
    if (obtenerEstadoPedido(pedido) === "Borrado") return;
    const items = Array.isArray(pedido?.items) ? pedido.items : [];
    items.forEach((item) => {
      const categoria = obtenerCategoriaProductoVenta(item);
      const producto = obtenerNombreProductoVenta(item);
      if (!porCategoria.has(categoria)) porCategoria.set(categoria, new Set());
      porCategoria.get(categoria).add(producto);
    });
  });

  const categorias = Array.from(porCategoria.keys()).sort((a, b) => a.localeCompare(b, "es"));
  const productosPorCategoria = Object.fromEntries(
    categorias.map((categoria) => [categoria, Array.from(porCategoria.get(categoria)).sort((a, b) => a.localeCompare(b, "es"))])
  );
  const productos = Array.from(new Set(Object.values(productosPorCategoria).flat())).sort((a, b) => a.localeCompare(b, "es"));

  return { categorias, productos, productosPorCategoria };
}

export function crearComparacionProductosMensual(pedidos = [], productos = [], mes = obtenerMesColombia(), categoria = "") {
  const seleccionados = Array.from(new Set((productos || []).map(textoLimpio).filter(Boolean)));
  const mesBase = mesValido(mes) ? mes : obtenerMesColombia();
  const cantidadDias = obtenerDiasDelMes(mesBase);

  return seleccionados.map((producto) => {
    const dias = Array.from({ length: cantidadDias }, () => 0);
    let total = 0;
    let unidades = 0;

    (pedidos || []).forEach((pedido) => {
      if (obtenerEstadoPedido(pedido) === "Borrado") return;
      const fecha = fechaColombiaYYYYMMDD(pedido?.created_at);
      if (!fecha || !fecha.startsWith(`${mesBase}-`)) return;
      const dia = Number(fecha.slice(-2));
      const items = (Array.isArray(pedido?.items) ? pedido.items : []).filter((item) => {
        if (obtenerNombreProductoVenta(item) !== producto) return false;
        if (categoria && obtenerCategoriaProductoVenta(item) !== categoria) return false;
        return true;
      });
      const totalPedido = items.reduce((suma, item) => suma + calcularValorItemVenta(item), 0);
      const unidadesPedido = items.reduce((suma, item) => suma + obtenerCantidadItemVenta(item), 0);
      total += totalPedido;
      unidades += unidadesPedido;
      if (dia >= 1 && dia <= cantidadDias) dias[dia - 1] += totalPedido;
    });

    return { producto, total, unidades, dias };
  }).sort((a, b) => b.total - a.total || a.producto.localeCompare(b.producto, "es"));
}

export function crearResumenVentasMensuales(pedidos = [], gastos = [], mes = obtenerMesColombia(), filtros = {}) {
  const mesBase = mesValido(mes) ? mes : obtenerMesColombia();
  const cantidadDias = obtenerDiasDelMes(mesBase);
  const dias = Array.from({ length: cantidadDias }, (_, index) => crearDia(mesBase, index + 1));
  const porFecha = new Map(dias.map((dia) => [dia.fecha, dia]));

  (pedidos || []).forEach((pedido) => {
    if (obtenerEstadoPedido(pedido) === "Borrado") return;

    const fecha = fechaColombiaYYYYMMDD(pedido?.created_at);
    if (!fecha || !fecha.startsWith(`${mesBase}-`)) return;

    const dia = porFecha.get(fecha);
    if (!dia) return;

    const filtrosActivos = hayFiltrosVentasActivos(filtros);
    const items = Array.isArray(pedido?.items) ? pedido.items : [];
    const itemsFiltrados = filtrosActivos ? items.filter((item) => coincideItemConFiltros(item, filtros)) : items;
    if (filtrosActivos && itemsFiltrados.length === 0) return;

    const total = filtrosActivos
      ? itemsFiltrados.reduce((suma, item) => suma + calcularValorItemVenta(item), 0)
      : Math.max(aPesosEnteros(pedido?.total), 0);
    const unidades = itemsFiltrados.reduce((suma, item) => suma + obtenerCantidadItemVenta(item), 0);

    dia.total += total;
    dia.unidades += unidades;
    dia.pedidos += 1;
  });

  (gastos || []).forEach((gasto) => {
    const fecha = String(gasto?.fecha || "").slice(0, 10);
    if (!fecha || !fecha.startsWith(`${mesBase}-`)) return;

    const dia = porFecha.get(fecha);
    if (!dia) return;

    dia.gastos += Math.max(aPesosEnteros(gasto?.valor), 0);
  });

  dias.forEach((dia) => {
    dia.ticketPromedio = dia.pedidos > 0 ? Math.round(dia.total / dia.pedidos) : 0;
    dia.resultado = dia.total - dia.gastos;
  });

  const diasConVenta = dias.filter((dia) => dia.pedidos > 0);
  const totalMes = dias.reduce((suma, dia) => suma + dia.total, 0);
  const totalGastos = dias.reduce((suma, dia) => suma + dia.gastos, 0);
  const totalPedidos = dias.reduce((suma, dia) => suma + dia.pedidos, 0);
  const totalUnidades = dias.reduce((suma, dia) => suma + dia.unidades, 0);
  const mejorDia = diasConVenta.reduce((mejor, dia) => {
    if (!mejor) return dia;
    if (dia.total > mejor.total) return dia;
    if (dia.total === mejor.total && dia.pedidos > mejor.pedidos) return dia;
    return mejor;
  }, null);
  const maximoDiario = mejorDia?.total || 0;

  return {
    mes: mesBase,
    nombreMes: formatearNombreMes(mesBase),
    encabezados: NOMBRES_DIAS,
    offsetInicio: obtenerOffsetCalendarioLunes(mesBase),
    dias,
    totalMes,
    totalGastos,
    resultadoMes: totalMes - totalGastos,
    totalPedidos,
    totalUnidades,
    filtrosActivos: hayFiltrosVentasActivos(filtros),
    diasConVenta: diasConVenta.length,
    promedioDiario: diasConVenta.length > 0 ? Math.round(totalMes / diasConVenta.length) : 0,
    ticketPromedio: totalPedidos > 0 ? Math.round(totalMes / totalPedidos) : 0,
    mejorDia,
    maximoDiario
  };
}

export function obtenerNivelVentaDia(total, maximo) {
  const valor = Math.max(Number(total) || 0, 0);
  const base = Math.max(Number(maximo) || 0, 0);
  if (valor <= 0 || base <= 0) return 0;
  const proporcion = valor / base;
  if (proporcion >= 0.8) return 4;
  if (proporcion >= 0.55) return 3;
  if (proporcion >= 0.3) return 2;
  return 1;
}
