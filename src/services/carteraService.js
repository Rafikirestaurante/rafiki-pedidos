import { supabase, supabaseConfigOk } from "../supabaseClient";
import { METODOS_PAGO, esMetodoPagoCredito } from "../shared/constants/paymentMethods";
import { aPesosEnteros, valoresPesosDiferentes } from "../shared/utils/money";
import {
  calcularEstadoMovimientoCredito,
  evaluarRetiroPedidoCredito,
  normalizarDatosAbono,
  pedidoDebeSalirDeCartera,
  pedidoEstaDescartado,
} from "../shared/utils/financialFlows";
import { asegurarClienteCredito, normalizarNombreClienteCredito } from "./clientesCreditoService";

export const SELECT_CARTERA_MOVIMIENTOS = [
  "id",
  "created_at",
  "cliente_credito_id",
  "pedido_id",
  "numero_pedido",
  "cliente_nombre",
  "tipo_movimiento",
  "concepto",
  "valor",
  "saldo_movimiento",
  "estado",
  "fecha_movimiento",
  "observaciones"
].join(", ");

export const SELECT_CARTERA_ABONOS = [
  "id",
  "created_at",
  "cliente_credito_id",
  "cartera_movimiento_id",
  "pedido_id",
  "numero_pedido",
  "cliente_nombre",
  "valor_abono",
  "metodo_pago",
  "observacion",
  "fecha_abono",
  "saldo_anterior",
  "saldo_nuevo",
  "pago_id",
  "vigente",
  "reemplazado_en",
  "motivo_reemplazo"
].join(", ");

const SELECT_PEDIDO_DETALLE_CARTERA = "id,items,pedido_texto,total";
const TAMANO_LOTE_PEDIDOS_CARTERA = 500;

function normalizarNumero(valor) {
  return aPesosEnteros(valor);
}

function limpiarTexto(valor) {
  return String(valor || "").trim().replace(/\s+/g, " ");
}

function fechaAbonoNormalizada(valor) {
  if (!valor) return new Date().toISOString();
  const texto = String(valor);
  if (texto.includes("T")) return texto;
  return `${texto}T12:00:00-05:00`;
}

function esPagoCredito(tipoPago) {
  return esMetodoPagoCredito(tipoPago);
}

function movimientoNoAnulado(movimiento) {
  return String(movimiento?.estado || "").toLowerCase() !== "anulado";
}

function valoresDiferentes(a, b) {
  return valoresPesosDiferentes(a, b);
}

function seleccionarMovimientoPrincipal(movimientos = [], abonosPorMovimiento = new Map()) {
  const ordenados = [...movimientos].sort((a, b) => {
    const abonosA = normalizarNumero(abonosPorMovimiento.get(a.id));
    const abonosB = normalizarNumero(abonosPorMovimiento.get(b.id));
    if (abonosA !== abonosB) return abonosB - abonosA;
    return new Date(a.created_at || a.fecha_movimiento || 0).getTime() - new Date(b.created_at || b.fecha_movimiento || 0).getTime();
  });
  return ordenados[0] || null;
}

function partirEnLotes(lista = [], tamano = 100) {
  const lotes = [];
  for (let indice = 0; indice < lista.length; indice += tamano) {
    lotes.push(lista.slice(indice, indice + tamano));
  }
  return lotes;
}

async function cargarMovimientosPedidoCredito(pedidoId) {
  if (!supabaseConfigOk || !pedidoId) return [];

  const { data, error } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedidoId))
    .eq("tipo_movimiento", "pedido_credito");

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function cargarAbonosPorMovimientos() {
  // Los abonos pertenecen a la cuenta del cliente; no a un pedido.
  return { abonosPorMovimiento: new Map(), abonos: [], tablaDisponible: true };
}

async function actualizarAbonosMovimiento() {
  return { actualizados: 0 };
}

async function moverAbonosEntreMovimientos() {
  return { movidos: 0, valorMovido: 0 };
}

async function anularMovimientosPedido({ movimientos = [], motivo = "Movimiento anulado durante sincronización de cartera." } = {}) {
  const ids = movimientos.map((movimiento) => movimiento.id).filter(Boolean);
  if (!supabaseConfigOk || ids.length === 0) return { anulados: 0 };

  let anulados = 0;
  for (const lote of partirEnLotes(ids, 100)) {
    const { data, error } = await supabase
      .from("cartera_movimientos")
      .update({
        saldo_movimiento: 0,
        estado: "anulado",
        observaciones: motivo,
      })
      .in("id", lote)
      .select("id");

    if (error) throw error;
    anulados += Array.isArray(data) ? data.length : lote.length;
  }

  return { anulados };
}

export async function sincronizarCarteraPedido(pedido = {}, opciones = {}) {
  const resultadoBase = {
    accion: opciones.accion || "sincronizacion_pedido",
    pedidoId: pedido?.id ? String(pedido.id) : null,
    clienteId: null,
    clientesRecalculados: [],
    movimiento: null,
    creado: false,
    actualizado: false,
    anulado: false,
    anulados: 0,
    duplicadosAnulados: 0,
    abonosMovidos: 0,
    abonosSincronizados: 0,
    omitido: false,
    motivo: "",
  };

  if (!supabaseConfigOk || !pedido?.id) {
    return { ...resultadoBase, omitido: true, motivo: "Sin conexión Supabase o pedido sin id." };
  }

  const pedidoId = String(pedido.id);
  const motivoBase = limpiarTexto(opciones.motivo) || `Sincronización automática de cartera para pedido #${pedido.numero_pedido || pedido.id}.`;
  const movimientos = await cargarMovimientosPedidoCredito(pedidoId);
  const { abonosPorMovimiento } = await cargarAbonosPorMovimientos(movimientos);
  const movimientosNoAnulados = movimientos.filter(movimientoNoAnulado);
  const clientesAfectados = new Set(movimientos.map((movimiento) => movimiento.cliente_credito_id).filter(Boolean));
  const totalAbonos = Array.from(abonosPorMovimiento.values()).reduce(
    (total, valor) => total + normalizarNumero(valor),
    0
  );
  const evaluacionRetiro = evaluarRetiroPedidoCredito({
    pedido,
    movimientosActivos: movimientosNoAnulados,
    totalAbonos,
    forzar: Boolean(opciones.forzarAnulacion || opciones.forzar),
  });

  if (pedidoDebeSalirDeCartera(pedido)) {
    if (movimientosNoAnulados.length === 0) {
      const idsClientes = Array.from(clientesAfectados);
      await Promise.all(idsClientes.map((clienteId) => recalcularResumenClienteCredito(clienteId)));
      return {
        ...resultadoBase,
        clientesRecalculados: idsClientes,
        omitido: true,
        motivo: "No había movimientos activos de cartera para este pedido.",
      };
    }

    if (!evaluacionRetiro.permitido) {
      throw new Error(evaluacionRetiro.mensaje);
    }

    const { anulados } = await anularMovimientosPedido({ movimientos: movimientosNoAnulados, motivo: motivoBase });
    const idsClientes = Array.from(clientesAfectados);
    await Promise.all(idsClientes.map((clienteId) => recalcularResumenClienteCredito(clienteId)));

    return {
      ...resultadoBase,
      clientesRecalculados: idsClientes,
      anulado: true,
      anulados,
      motivo: motivoBase,
    };
  }

  const clienteNombre = normalizarNombreClienteCredito(pedido.cliente_nombre || pedido.cliente || "");
  const total = normalizarNumero(pedido.total);

  if (!clienteNombre) {
    throw new Error("El pedido crédito debe tener nombre de cliente para sincronizar cartera.");
  }

  if (total <= 0) {
    throw new Error("El pedido crédito debe tener un valor mayor a cero para sincronizar cartera.");
  }

  const cliente = await asegurarClienteCredito(clienteNombre);
  if (!cliente?.id) throw new Error("No se pudo crear o encontrar el cliente crédito.");
  clientesAfectados.add(cliente.id);

  let principal = seleccionarMovimientoPrincipal(movimientosNoAnulados, abonosPorMovimiento);
  if (!principal?.id && movimientos.length > 0) {
    // Si el pedido fue retirado de crédito y luego vuelve a Crédito, reutilizamos el
    // movimiento anulado para respetar el índice único pedido_id + tipo_movimiento.
    principal = seleccionarMovimientoPrincipal(movimientos, abonosPorMovimiento);
  }
  const fechaPedido = pedido.created_at || new Date().toISOString();
  const payloadComun = {
    cliente_credito_id: cliente.id,
    pedido_id: pedidoId,
    numero_pedido: pedido.numero_pedido || null,
    cliente_nombre: clienteNombre,
    tipo_movimiento: "pedido_credito",
    concepto: `Pedido #${pedido.numero_pedido || pedido.id}`,
    valor: total,
    fecha_movimiento: fechaPedido,
  };

  if (!principal?.id) {
    const { data, error } = await supabase
      .from("cartera_movimientos")
      .insert({
        ...payloadComun,
        saldo_movimiento: total,
        estado: "pendiente",
        observaciones: limpiarTexto(pedido.observaciones) || motivoBase,
      })
      .select(SELECT_CARTERA_MOVIMIENTOS)
      .single();

    if (error) throw error;
    principal = data;
    resultadoBase.creado = true;
  }

  const duplicados = movimientosNoAnulados.filter((movimiento) => movimiento.id !== principal.id);
  let abonosMovidos = 0;
  let abonosMovidosValor = 0;

  for (const duplicado of duplicados) {
    const resultadoMover = await moverAbonosEntreMovimientos({
      movimientoOrigenId: duplicado.id,
      movimientoDestinoId: principal.id,
      payload: {
        cliente_credito_id: cliente.id,
        pedido_id: pedidoId,
        numero_pedido: pedido.numero_pedido || null,
        cliente_nombre: clienteNombre,
      },
    });
    abonosMovidos += resultadoMover.movidos || 0;
    abonosMovidosValor += normalizarNumero(resultadoMover.valorMovido);
  }

  if (duplicados.length > 0) {
    const { anulados } = await anularMovimientosPedido({
      movimientos: duplicados,
      motivo: "Movimiento duplicado anulado automáticamente; se conserva un movimiento principal para este pedido.",
    });
    resultadoBase.duplicadosAnulados = anulados;
  }

  const abonosPrincipal = normalizarNumero(abonosPorMovimiento.get(principal.id)) + abonosMovidosValor;
  const estadoMovimiento = calcularEstadoMovimientoCredito({ total, abonosAplicados: abonosPrincipal });
  const saldoEsperado = estadoMovimiento.saldo;
  const estadoEsperado = estadoMovimiento.estado;
  const cambios = {
    ...payloadComun,
    saldo_movimiento: saldoEsperado,
    estado: estadoEsperado,
  };

  const debeActualizar = resultadoBase.creado
    || String(principal.cliente_credito_id || "") !== String(cliente.id)
    || limpiarTexto(principal.cliente_nombre) !== clienteNombre
    || String(principal.numero_pedido || "") !== String(pedido.numero_pedido || "")
    || valoresDiferentes(principal.valor, total)
    || valoresDiferentes(principal.saldo_movimiento ?? principal.valor, saldoEsperado)
    || String(principal.estado || "").toLowerCase() !== estadoEsperado;

  let movimientoFinal = principal;

  if (debeActualizar) {
    const { data, error } = await supabase
      .from("cartera_movimientos")
      .update(cambios)
      .eq("id", principal.id)
      .select(SELECT_CARTERA_MOVIMIENTOS)
      .single();

    if (error) throw error;
    movimientoFinal = data;
    resultadoBase.actualizado = !resultadoBase.creado;
  }

  const resultadoAbonos = await actualizarAbonosMovimiento(principal.id, {
    cliente_credito_id: cliente.id,
    pedido_id: pedidoId,
    numero_pedido: pedido.numero_pedido || null,
    cliente_nombre: clienteNombre,
  });

  const idsClientes = Array.from(clientesAfectados);
  await Promise.all(idsClientes.map((clienteId) => recalcularResumenClienteCredito(clienteId)));

  return {
    ...resultadoBase,
    clienteId: cliente.id,
    clientesRecalculados: idsClientes,
    movimiento: movimientoFinal,
    creado: resultadoBase.creado,
    actualizado: resultadoBase.actualizado,
    duplicadosAnulados: resultadoBase.duplicadosAnulados,
    abonosMovidos,
    abonosSincronizados: resultadoAbonos.actualizados || 0,
    motivo: motivoBase,
  };
}

export async function registrarCarteraPedidoCredito(pedido = {}, opciones = {}) {
  if (!supabaseConfigOk || !pedido?.id || !esPagoCredito(pedido.tipo_pago)) return null;
  return sincronizarCarteraPedido(pedido, {
    accion: opciones.accion || "registrar_pedido_credito",
    motivo: opciones.motivo || "Pedido crédito registrado o actualizado automáticamente.",
    ...opciones,
  });
}

export async function corregirClienteCreditoDePedido(pedido = {}, nombreDestino = "") {
  if (!supabaseConfigOk || !pedido?.id) return null;

  const nombreLimpio = normalizarNombreClienteCredito(nombreDestino);
  if (!nombreLimpio) throw new Error("Escribe el nombre correcto del cliente crédito.");

  const pedidoSincronizado = {
    ...pedido,
    cliente: nombreLimpio,
    cliente_nombre: nombreLimpio,
    tipo_pago: METODOS_PAGO.CREDITO,
  };

  const resultado = await sincronizarCarteraPedido(pedidoSincronizado, {
    accion: "corregir_cliente_credito",
    motivo: "Cliente crédito corregido desde Pedidos Hoy.",
  });

  const { data: movimientosCorregidos, error: errorMovimientosCorregidos } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedido.id))
    .eq("tipo_movimiento", "pedido_credito");

  if (errorMovimientosCorregidos) throw errorMovimientosCorregidos;

  return {
    cliente: { id: resultado?.clienteId, nombre: nombreLimpio },
    movimientos: Array.isArray(movimientosCorregidos) ? movimientosCorregidos : [],
    resultado,
  };
}

export async function anularCarteraPedidoCredito(pedido = {}, motivo = "Pedido retirado de crédito", opciones = {}) {
  if (!supabaseConfigOk || !pedido?.id) return null;

  return sincronizarCarteraPedido(
    {
      ...pedido,
      tipo_pago: opciones.tipoPagoFinal || opciones.tipo_pago || METODOS_PAGO.EFECTIVO,
    },
    {
      accion: opciones.accion || "anular_pedido_credito",
      motivo,
      forzarAnulacion: Boolean(opciones.forzar || opciones.forzarAnulacion),
    }
  );
}

export async function sincronizarCarteraCompleta({ limite = 2000 } = {}) {
  if (!supabaseConfigOk) {
    return {
      movimientosRevisados: 0,
      anulados: 0,
      anuladosBorrados: 0,
      anuladosNoCredito: 0,
      anuladosHuerfanos: 0,
      duplicadosAnulados: 0,
      valoresAjustados: 0,
      clientesRecalculados: [],
      totalCorrecciones: 0,
    };
  }

  const { data: movimientos, error: errorMovimientos } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("tipo_movimiento", "pedido_credito")
    .neq("estado", "anulado")
    .not("pedido_id", "is", null)
    .limit(limite);

  if (errorMovimientos) {
    console.warn("No se pudo auditar cartera:", errorMovimientos.message);
    return {
      movimientosRevisados: 0,
      anulados: 0,
      anuladosBorrados: 0,
      anuladosNoCredito: 0,
      anuladosHuerfanos: 0,
      duplicadosAnulados: 0,
      valoresAjustados: 0,
      clientesRecalculados: [],
      totalCorrecciones: 0,
    };
  }

  const lista = Array.isArray(movimientos) ? movimientos : [];
  const movimientosActivos = lista.filter(movimientoNoAnulado);
  const pedidosIds = Array.from(new Set(movimientosActivos.map((movimiento) => movimiento.pedido_id).filter(Boolean)));

  if (pedidosIds.length === 0) {
    return {
      movimientosRevisados: movimientosActivos.length,
      anulados: 0,
      anuladosBorrados: 0,
      anuladosNoCredito: 0,
      anuladosHuerfanos: 0,
      duplicadosAnulados: 0,
      valoresAjustados: 0,
      clientesRecalculados: [],
      totalCorrecciones: 0,
    };
  }

  const pedidos = [];
  for (const lote of partirEnLotes(pedidosIds, 100)) {
    const loteConsulta = lote.every((id) => /^\d+$/.test(String(id)))
      ? lote.map((id) => Number(id))
      : lote;

    const { data: pedidosLote, error: errorPedidos } = await supabase
      .from("pedidos")
      .select("id,estado,tipo_pago,total,numero_pedido,cliente_nombre,cliente,created_at")
      .in("id", loteConsulta);

    if (errorPedidos) {
      console.warn("No se pudieron revisar pedidos para auditar cartera:", errorPedidos.message);
      continue;
    }

    pedidos.push(...(Array.isArray(pedidosLote) ? pedidosLote : []));
  }

  const pedidosPorId = new Map(pedidos.map((pedido) => [String(pedido.id), pedido]));
  const clientesRecalculados = new Set();
  let anulados = 0;
  let anuladosBorrados = 0;
  let anuladosNoCredito = 0;
  let anuladosHuerfanos = 0;
  let duplicadosAnulados = 0;
  let valoresAjustados = 0;

  for (const [pedidoId, movimientosPedido] of Array.from(
    movimientosActivos.reduce((mapa, movimiento) => {
      const id = String(movimiento.pedido_id || "");
      if (!id) return mapa;
      if (!mapa.has(id)) mapa.set(id, []);
      mapa.get(id).push(movimiento);
      return mapa;
    }, new Map())
  )) {
    const pedido = pedidosPorId.get(pedidoId);

    if (!pedido) {
      const { anulados: totalAnulados } = await anularMovimientosPedido({
        movimientos: movimientosPedido,
        motivo: "Movimiento anulado automáticamente porque el pedido ya no existe.",
      });
      anulados += totalAnulados;
      anuladosHuerfanos += totalAnulados;
      movimientosPedido.forEach((movimiento) => movimiento.cliente_credito_id && clientesRecalculados.add(movimiento.cliente_credito_id));
      continue;
    }

    const resultado = await sincronizarCarteraPedido(pedido, {
      accion: "auditoria_cartera",
      motivo: pedidoEstaDescartado(pedido)
        ? "Movimiento anulado automáticamente porque el pedido fue borrado."
        : !esPagoCredito(pedido.tipo_pago)
          ? `Movimiento anulado automáticamente porque el pedido ya no está marcado como crédito. Pago actual: ${pedido.tipo_pago || "Sin pago"}.`
          : "Movimiento sincronizado durante auditoría de cartera.",
      forzarAnulacion: true,
    });

    anulados += resultado.anulados || 0;
    duplicadosAnulados += resultado.duplicadosAnulados || 0;
    if (pedidoEstaDescartado(pedido)) anuladosBorrados += resultado.anulados || 0;
    if (!pedidoEstaDescartado(pedido) && !esPagoCredito(pedido.tipo_pago)) anuladosNoCredito += resultado.anulados || 0;
    if (resultado.actualizado) valoresAjustados += 1;
    (resultado.clientesRecalculados || []).forEach((clienteId) => clientesRecalculados.add(clienteId));
  }

  const idsClientes = Array.from(clientesRecalculados).filter(Boolean);
  await Promise.all(idsClientes.map((clienteId) => recalcularResumenClienteCredito(clienteId)));

  const totalCorrecciones = anulados + duplicadosAnulados + valoresAjustados;

  return {
    movimientosRevisados: movimientosActivos.length,
    anulados,
    anuladosBorrados,
    anuladosNoCredito,
    anuladosHuerfanos,
    duplicadosAnulados,
    valoresAjustados,
    clientesRecalculados: idsClientes,
    totalCorrecciones,
  };
}

export async function sincronizarCarteraConPedidosBorrados({ limite = 1500 } = {}) {
  const resultado = await sincronizarCarteraCompleta({ limite });
  return {
    anulados: resultado.anuladosBorrados || 0,
    clientesRecalculados: resultado.clientesRecalculados || [],
    resultadoCompleto: resultado,
  };
}

export async function recalcularResumenClienteCredito(clienteId) {
  if (!supabaseConfigOk || !clienteId) return null;
  const { data, error } = await supabase.rpc("recalcular_libro_cartera_cliente", { p_cliente_id: clienteId });
  if (error) throw new Error(`No se pudo actualizar el libro de cartera. Ejecuta el SQL de Fase 44. ${error.message}`);
  return data?.cliente || null;
}

async function cargarPedidosDetalleCartera(pedidoIds = []) {
  if (!supabaseConfigOk || pedidoIds.length === 0) return new Map();

  const detalles = new Map();
  const idsUnicos = Array.from(new Set(pedidoIds.map((id) => String(id || "").trim()).filter(Boolean)));

  for (let indice = 0; indice < idsUnicos.length; indice += TAMANO_LOTE_PEDIDOS_CARTERA) {
    const lote = idsUnicos.slice(indice, indice + TAMANO_LOTE_PEDIDOS_CARTERA);
    const { data, error } = await supabase
      .from("pedidos")
      .select(SELECT_PEDIDO_DETALLE_CARTERA)
      .in("id", lote);

    if (error) {
      console.warn("No se pudieron cargar detalles de pedidos para cartera:", error.message);
      continue;
    }

    (Array.isArray(data) ? data : []).forEach((pedido) => {
      detalles.set(String(pedido.id), pedido);
    });
  }

  return detalles;
}

function anexarDetallePedidoMovimiento(movimiento, pedido) {
  if (!pedido) return movimiento;

  return {
    ...movimiento,
    pedido_items: Array.isArray(pedido.items) ? pedido.items : [],
    pedido_texto_detalle: pedido.pedido_texto || "",
    pedido_total_detalle: pedido.total ?? null,
  };
}

export async function listarMovimientosCartera({ clienteId = null, estado = "pendiente", limite = 300 } = {}) {
  if (!supabaseConfigOk) return [];

  const movimientos = [];
  for (let desde = 0; ; desde += 500) {
    let consulta = supabase.from("cartera_movimientos").select(SELECT_CARTERA_MOVIMIENTOS)
      .order("fecha_movimiento", { ascending: false }).order("id", { ascending: false })
      .range(desde, desde + 499);
    if (clienteId) consulta = consulta.eq("cliente_credito_id", clienteId);
    if (estado && estado !== "todos") consulta = consulta.eq("estado", estado);
    const { data, error } = await consulta;
    if (error) throw error;
    movimientos.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  const pedidoIds = movimientos.map((movimiento) => movimiento.pedido_id).filter(Boolean);

  if (pedidoIds.length === 0) return movimientos;

  const pedidosDetalle = await cargarPedidosDetalleCartera(pedidoIds);

  return movimientos.map((movimiento) => {
    const pedido = pedidosDetalle.get(String(movimiento.pedido_id || ""));
    return anexarDetallePedidoMovimiento(movimiento, pedido);
  });
}

export async function listarAbonosCartera({ clienteId = null } = {}) {
  if (!supabaseConfigOk) return [];
  const resultados = [];
  // Leer todas las páginas evita perder pagos anteriores al calcular el saldo.
  for (let desde = 0; ; desde += 500) {
    let consulta = supabase.from("cartera_pagos")
      .select("id,created_at,cliente_credito_id,cliente_nombre,valor_abono,metodo_pago,observacion,fecha_abono,estado")
      .eq("estado", "activo").order("fecha_abono", { ascending: false }).order("id", { ascending: false })
      .range(desde, desde + 499);
    if (clienteId) consulta = consulta.eq("cliente_credito_id", clienteId);
    const { data, error } = await consulta;
    if (error) throw error;
    resultados.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  return resultados.map((pago) => ({ ...pago, pago_id: pago.id, vigente: true }));
}

export async function registrarAbonoClienteCredito({
  clienteId,
  valorAbono,
  metodoPago = METODOS_PAGO.EFECTIVO,
  observacion = "",
  fechaAbono = "",
} = {}) {
  if (!supabaseConfigOk || !clienteId) return null;

  const datosAbono = normalizarDatosAbono({ valorAbono, metodoPago, observacion });
  const valor = datosAbono.valor;
  const metodoPagoControlado = datosAbono.metodoPago;
  const fechaRegistro = fechaAbonoNormalizada(fechaAbono);

  const { data, error } = await supabase.rpc("registrar_abono_cliente_credito", {
    p_cliente_id: clienteId,
    p_valor_abono: valor,
    p_metodo_pago: metodoPagoControlado,
    p_observacion: datosAbono.observacion,
    p_fecha_abono: fechaRegistro,
  });

  if (error) {
    const mensaje = String(error?.message || error?.details || error?.hint || "");
    const rpcNoDisponible = mensaje.toLowerCase().includes("registrar_abono_cliente_credito")
      || mensaje.toLowerCase().includes("could not find the function")
      || mensaje.toLowerCase().includes("schema cache");

    if (rpcNoDisponible) {
      throw new Error("Primero ejecuta en Supabase el SQL de la Fase 33 para activar los abonos seguros con RPC.");
    }

    throw error;
  }

  return data || {
    valor_abono: valor,
    abonos: [],
    saldo_anterior_total: 0,
    saldo_nuevo_total: 0,
  };
}

export async function editarAbonoClienteCredito({
  pagoId,
  valorAbono,
  metodoPago = METODOS_PAGO.EFECTIVO,
  observacion = "",
  fechaAbono = "",
} = {}) {
  if (!supabaseConfigOk || !pagoId) return null;

  const datosAbono = normalizarDatosAbono({ valorAbono, metodoPago, observacion });
  const fechaRegistro = fechaAbonoNormalizada(fechaAbono);

  const { data, error } = await supabase.rpc("editar_abono_cliente_credito", {
    p_pago_id: pagoId,
    p_valor_abono: datosAbono.valor,
    p_metodo_pago: datosAbono.metodoPago,
    p_observacion: datosAbono.observacion,
    p_fecha_abono: fechaRegistro,
  });

  if (error) {
    const mensaje = String(error?.message || error?.details || error?.hint || "");
    const rpcNoDisponible = mensaje.toLowerCase().includes("editar_abono_cliente_credito")
      || mensaje.toLowerCase().includes("could not find the function")
      || mensaje.toLowerCase().includes("schema cache");
    if (rpcNoDisponible) {
      throw new Error("Ejecuta primero el SQL de la Fase 39 para habilitar la edición segura de abonos.");
    }
    throw error;
  }

  return data || null;
}

export async function anularAbonoClienteCredito({ pagoId, motivo = "" } = {}) {
  if (!supabaseConfigOk || !pagoId) return null;

  const { data, error } = await supabase.rpc("anular_abono_cliente_credito", {
    p_pago_id: pagoId,
    p_motivo: String(motivo || "").trim(),
  });

  if (error) {
    const mensaje = String(error?.message || error?.details || error?.hint || "");
    const rpcNoDisponible = mensaje.toLowerCase().includes("anular_abono_cliente_credito")
      || mensaje.toLowerCase().includes("could not find the function")
      || mensaje.toLowerCase().includes("schema cache");
    if (rpcNoDisponible) {
      throw new Error("Ejecuta primero el SQL de la Fase 39 para habilitar la anulación segura de abonos.");
    }
    throw error;
  }

  return data || null;
}

