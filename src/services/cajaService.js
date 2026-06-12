import { supabase } from "../supabaseClient";
import { cargarGastosDiarios } from "./gastosDiariosService";
import { cargarPedidosRango } from "./pedidosService";
import { obtenerEstadoPedido, obtenerRangoPedidos } from "../shared/utils/pedidos";

const SELECT_CAJA_ARQUEOS = "id, fecha, inicio_data, fin_data, inicio_total, fin_total, creado_en, actualizado_en";

function hoyISOColombia(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(fecha);
}

function numeroSeguro(valor) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) ? numero : 0;
}

export function obtenerFechaCajaHoy() {
  return hoyISOColombia();
}

function normalizarMetodoPago(valor) {
  const texto = String(valor || "No especificado").trim().toLowerCase();
  if (!texto) return "No especificado";
  if (texto.includes("efect")) return "Efectivo";
  if (texto.includes("nequi")) return "Nequi";
  if (texto.includes("rafa")) return "Rafa";
  if (texto.includes("bancolombia") || texto.includes("transfer")) return "Bancolombia / Transferencia";
  if (texto.includes("data") || texto.includes("tarjeta") || texto.includes("datáfono") || texto.includes("datafono")) return "Datáfono";
  return valor || "No especificado";
}

function sumarPorMetodo(lista = [], obtenerMetodo, obtenerValor) {
  return lista.reduce((acc, item) => {
    const metodo = normalizarMetodoPago(obtenerMetodo(item));
    acc[metodo] = numeroSeguro(acc[metodo]) + numeroSeguro(obtenerValor(item));
    return acc;
  }, {});
}

function sumarTotal(lista = [], obtenerValor) {
  return lista.reduce((total, item) => total + numeroSeguro(obtenerValor(item)), 0);
}

async function exigirSesionSupabaseCaja() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`No se pudo validar la sesión de Supabase: ${error.message}`);
  }

  if (!data?.session?.user) {
    throw new Error("Debes iniciar sesión nuevamente como administrador para guardar Caja. La sesión de Supabase no está activa.");
  }

  return data.session;
}

export function normalizarCajaArqueo(registro) {
  if (!registro) return null;
  return {
    id: registro.id,
    fecha: registro.fecha || hoyISOColombia(),
    inicioData: registro.inicio_data || null,
    finData: registro.fin_data || null,
    inicioTotal: numeroSeguro(registro.inicio_total),
    finTotal: numeroSeguro(registro.fin_total),
    creadoEn: registro.creado_en || "",
    actualizadoEn: registro.actualizado_en || "",
  };
}

export async function cargarCajaArqueoPorFecha(fecha = hoyISOColombia()) {
  const fechaConsulta = fecha || hoyISOColombia();
  const { data, error } = await supabase
    .from("caja_arqueos")
    .select(SELECT_CAJA_ARQUEOS)
    .eq("fecha", fechaConsulta)
    .maybeSingle();

  if (error) throw error;
  return normalizarCajaArqueo(data);
}

async function guardarCajaArqueoParcial({ fecha, campoData, campoTotal, estado, total }) {
  await exigirSesionSupabaseCaja();
  const fechaGuardar = fecha || hoyISOColombia();
  const payload = {
    fecha: fechaGuardar,
    [campoData]: estado || null,
    [campoTotal]: numeroSeguro(total),
    actualizado_en: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("caja_arqueos")
    .upsert(payload, { onConflict: "fecha" })
    .select(SELECT_CAJA_ARQUEOS)
    .single();

  if (error) throw error;
  return normalizarCajaArqueo(data);
}

export function guardarInicioCaja({ fecha, estado, total }) {
  return guardarCajaArqueoParcial({
    fecha,
    estado,
    total,
    campoData: "inicio_data",
    campoTotal: "inicio_total",
  });
}

export function guardarFinCaja({ fecha, estado, total }) {
  return guardarCajaArqueoParcial({
    fecha,
    estado,
    total,
    campoData: "fin_data",
    campoTotal: "fin_total",
  });
}

export async function cargarCuadreRealCaja(fecha = hoyISOColombia()) {
  const fechaConsulta = fecha || hoyISOColombia();
  const rango = obtenerRangoPedidos("dia", fechaConsulta);
  const [{ data: pedidosData, error: pedidosError }, gastos] = await Promise.all([
    cargarPedidosRango(rango.inicio, rango.fin, { ascendente: true }),
    cargarGastosDiarios(fechaConsulta),
  ]);

  if (pedidosError) throw pedidosError;

  const pedidosValidos = (pedidosData || []).filter((pedido) => obtenerEstadoPedido(pedido) !== "Borrado");
  const ventasTotal = sumarTotal(pedidosValidos, (pedido) => pedido.total);
  const gastosTotal = sumarTotal(gastos, (gasto) => gasto.valor);

  return {
    fecha: fechaConsulta,
    pedidosCantidad: pedidosValidos.length,
    gastosCantidad: gastos.length,
    ventasTotal,
    gastosTotal,
    ventasPorMetodo: sumarPorMetodo(pedidosValidos, (pedido) => pedido.tipo_pago || pedido.forma_pago || pedido.metodo_pago, (pedido) => pedido.total),
    gastosPorMetodo: sumarPorMetodo(gastos, (gasto) => gasto.metodoPago, (gasto) => gasto.valor),
    gastosDetalle: (gastos || []).map((gasto) => ({
      id: gasto.id,
      proveedor: gasto.proveedor || "Sin proveedor",
      valor: numeroSeguro(gasto.valor),
      categoria: gasto.categoria || "",
      articulos: gasto.articulos || "",
      metodoPago: gasto.metodoPago || "",
      creadoEn: gasto.creadoEn || "",
    })),
  };
}
