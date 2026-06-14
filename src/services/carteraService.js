import { supabase, supabaseConfigOk } from "../supabaseClient";
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
  "saldo_nuevo"
].join(", ");

function normalizarNumero(valor) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) ? numero : 0;
}

function limpiarTexto(valor) {
  return String(valor || "").trim().replace(/\s+/g, " ");
}

function fechaAbonoNormalizada(valor) {
  if (!valor) return new Date().toISOString();
  const texto = String(valor);
  if (texto.includes("T")) return texto;
  return `${texto}T12:00:00`;
}

function esPagoCredito(tipoPago) {
  return String(tipoPago || "").trim().toLowerCase().replace("é", "e") === "credito";
}

function estadoDesdeSaldo(saldo) {
  return normalizarNumero(saldo) <= 0 ? "pagado" : "parcial";
}

function movimientoTieneSaldo(movimiento) {
  const estado = String(movimiento?.estado || "").toLowerCase();
  if (estado === "pagado" || estado === "anulado") return false;
  return normalizarNumero(movimiento?.saldo_movimiento ?? movimiento?.valor) > 0;
}

function movimientoNoAnulado(movimiento) {
  return String(movimiento?.estado || "").toLowerCase() !== "anulado";
}

function pedidoEstaBorrado(pedido) {
  return String(pedido?.estado || "").trim().toLowerCase() === "borrado";
}

function pedidoEstaAnulado(pedido) {
  return String(pedido?.estado || "").trim().toLowerCase() === "anulado";
}

function estadoPendienteDesdeAbonos(saldo, abonosAplicados = 0) {
  const saldoNormalizado = normalizarNumero(saldo);
  if (saldoNormalizado <= 0) return "pagado";
  return normalizarNumero(abonosAplicados) > 0 ? "parcial" : "pendiente";
}

function valoresDiferentes(a, b) {
  return Math.abs(normalizarNumero(a) - normalizarNumero(b)) > 0.5;
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

async function cargarAbonosPorMovimientos(movimientos = []) {
  const idsMovimientos = movimientos.map((movimiento) => movimiento.id).filter(Boolean);
  const abonosPorMovimiento = new Map();
  const abonos = [];

  if (!supabaseConfigOk || idsMovimientos.length === 0) {
    return { abonosPorMovimiento, abonos, tablaDisponible: true };
  }

  for (const lote of partirEnLotes(idsMovimientos, 100)) {
    const { data, error } = await supabase
      .from("cartera_abonos")
      .select(SELECT_CARTERA_ABONOS)
      .in("cartera_movimiento_id", lote);

    if (error) {
      console.warn("No se pudieron revisar abonos de cartera:", error.message);
      return { abonosPorMovimiento, abonos, tablaDisponible: false, error };
    }

    for (const abono of Array.isArray(data) ? data : []) {
      const movimientoId = abono.cartera_movimiento_id;
      if (!movimientoId) continue;
      abonos.push(abono);
      abonosPorMovimiento.set(
        movimientoId,
        normalizarNumero(abonosPorMovimiento.get(movimientoId)) + normalizarNumero(abono.valor_abono)
      );
    }
  }

  return { abonosPorMovimiento, abonos, tablaDisponible: true };
}

async function actualizarAbonosMovimiento(movimientoId, payload = {}) {
  if (!supabaseConfigOk || !movimientoId) return { actualizados: 0 };

  const { data, error } = await supabase
    .from("cartera_abonos")
    .update(payload)
    .eq("cartera_movimiento_id", movimientoId)
    .select("id");

  if (error) {
    console.warn("No se pudieron sincronizar abonos de cartera:", error.message);
    return { actualizados: 0, error };
  }

  return { actualizados: Array.isArray(data) ? data.length : 0 };
}

async function moverAbonosEntreMovimientos({ movimientoOrigenId, movimientoDestinoId, payload = {} } = {}) {
  if (!supabaseConfigOk || !movimientoOrigenId || !movimientoDestinoId || movimientoOrigenId === movimientoDestinoId) {
    return { movidos: 0 };
  }

  const { data, error } = await supabase
    .from("cartera_abonos")
    .update({ ...payload, cartera_movimiento_id: movimientoDestinoId })
    .eq("cartera_movimiento_id", movimientoOrigenId)
    .select("id,valor_abono");

  if (error) {
    console.warn("No se pudieron mover abonos de un movimiento duplicado:", error.message);
    return { movidos: 0, error };
  }

  const movidos = Array.isArray(data) ? data.length : 0;
  const valorMovido = (Array.isArray(data) ? data : []).reduce((total, abono) => total + normalizarNumero(abono.valor_abono), 0);
  return { movidos, valorMovido };
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
  const tieneAbonos = Array.from(abonosPorMovimiento.values()).some((valor) => normalizarNumero(valor) > 0);
  const debeAnular = pedidoEstaBorrado(pedido) || pedidoEstaAnulado(pedido) || !esPagoCredito(pedido.tipo_pago);

  if (debeAnular) {
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

    if (tieneAbonos && !opciones.forzarAnulacion && !opciones.forzar) {
      throw new Error("Este pedido ya tiene abonos registrados. Revisa el historial antes de retirarlo de crédito.");
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
  const saldoEsperado = Math.max(0, total - abonosPrincipal);
  const estadoEsperado = estadoPendienteDesdeAbonos(saldoEsperado, abonosPrincipal);
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
    tipo_pago: "Crédito",
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
      tipo_pago: opciones.tipoPagoFinal || opciones.tipo_pago || "Efectivo",
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
      motivo: pedidoEstaBorrado(pedido)
        ? "Movimiento anulado automáticamente porque el pedido fue borrado."
        : !esPagoCredito(pedido.tipo_pago)
          ? `Movimiento anulado automáticamente porque el pedido ya no está marcado como crédito. Pago actual: ${pedido.tipo_pago || "Sin pago"}.`
          : "Movimiento sincronizado durante auditoría de cartera.",
      forzarAnulacion: true,
    });

    anulados += resultado.anulados || 0;
    duplicadosAnulados += resultado.duplicadosAnulados || 0;
    if (pedidoEstaBorrado(pedido)) anuladosBorrados += resultado.anulados || 0;
    if (!pedidoEstaBorrado(pedido) && !esPagoCredito(pedido.tipo_pago)) anuladosNoCredito += resultado.anulados || 0;
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

  const { data: movimientos, error } = await supabase
    .from("cartera_movimientos")
    .select("id,valor,saldo_movimiento,estado,fecha_movimiento,tipo_movimiento")
    .eq("cliente_credito_id", clienteId)
    .eq("tipo_movimiento", "pedido_credito");

  if (error) {
    console.warn("No se pudo recalcular cliente crédito:", error.message);
    return null;
  }

  const lista = Array.isArray(movimientos) ? movimientos : [];
  const movimientosActivos = lista.filter((movimiento) => String(movimiento.estado || "").toLowerCase() !== "anulado");
  const pedidos = movimientosActivos.length;
  const saldo = movimientosActivos.reduce((total, movimiento) => {
    const estado = String(movimiento.estado || "").toLowerCase();
    if (estado === "pagado" || estado === "anulado") return total;
    return total + normalizarNumero(movimiento.saldo_movimiento ?? movimiento.valor);
  }, 0);
  const ultimaFecha = movimientosActivos
    .map((movimiento) => movimiento.fecha_movimiento)
    .filter(Boolean)
    .sort()
    .pop() || null;

  const { data, error: errorUpdate } = await supabase
    .from("clientes_credito")
    .update({
      total_pedidos: pedidos,
      saldo_pendiente: saldo,
      fecha_ultimo_pedido: ultimaFecha,
    })
    .eq("id", clienteId)
    .select("id,nombre,total_pedidos,saldo_pendiente,fecha_ultimo_pedido")
    .maybeSingle();

  if (errorUpdate) {
    console.warn("No se pudo actualizar resumen del cliente crédito:", errorUpdate.message);
    return null;
  }

  return data || null;
}

export async function listarMovimientosCartera({ clienteId = null, estado = "pendiente", limite = 300 } = {}) {
  if (!supabaseConfigOk) return [];

  let consulta = supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .order("fecha_movimiento", { ascending: false })
    .limit(limite);

  if (clienteId) consulta = consulta.eq("cliente_credito_id", clienteId);
  if (estado && estado !== "todos") consulta = consulta.eq("estado", estado);

  const { data, error } = await consulta;

  if (error) {
    console.warn("No se pudieron cargar movimientos de cartera:", error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

export async function listarAbonosCartera({ clienteId = null, movimientoId = null, limite = 500 } = {}) {
  if (!supabaseConfigOk) return [];

  let consulta = supabase
    .from("cartera_abonos")
    .select(SELECT_CARTERA_ABONOS)
    .order("fecha_abono", { ascending: false })
    .limit(limite);

  if (clienteId) consulta = consulta.eq("cliente_credito_id", clienteId);
  if (movimientoId) consulta = consulta.eq("cartera_movimiento_id", movimientoId);

  const { data, error } = await consulta;

  if (error) {
    console.warn("No se pudieron cargar abonos de cartera:", error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

export async function registrarAbonoClienteCredito({
  clienteId,
  valorAbono,
  metodoPago = "Efectivo",
  observacion = "",
  fechaAbono = "",
} = {}) {
  if (!supabaseConfigOk || !clienteId) return null;

  const valor = normalizarNumero(valorAbono);
  if (valor <= 0) throw new Error("El valor del abono debe ser mayor a cero.");

  const { error: errorTablaAbonos } = await supabase
    .from("cartera_abonos")
    .select("id")
    .limit(1);

  if (errorTablaAbonos) {
    throw new Error("Primero ejecuta el SQL de la Fase 29F para crear la tabla cartera_abonos.");
  }

  const { data: movimientosData, error: errorMovimientos } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("cliente_credito_id", clienteId)
    .eq("tipo_movimiento", "pedido_credito")
    .order("fecha_movimiento", { ascending: true });

  if (errorMovimientos) throw errorMovimientos;

  const movimientosPendientes = (Array.isArray(movimientosData) ? movimientosData : [])
    .filter(movimientoTieneSaldo)
    .sort((a, b) => new Date(a.fecha_movimiento || a.created_at).getTime() - new Date(b.fecha_movimiento || b.created_at).getTime());

  const saldoTotal = movimientosPendientes.reduce((total, movimiento) => total + normalizarNumero(movimiento.saldo_movimiento ?? movimiento.valor), 0);
  if (saldoTotal <= 0) throw new Error("Este cliente no tiene cartera pendiente para abonar.");
  if (valor > saldoTotal) throw new Error("El abono no puede ser mayor al saldo pendiente del cliente.");

  let restante = valor;
  const fechaRegistro = fechaAbonoNormalizada(fechaAbono);
  const abonosRegistrados = [];
  const movimientosAfectados = [];

  for (const movimiento of movimientosPendientes) {
    if (restante <= 0) break;

    const saldoAnterior = normalizarNumero(movimiento.saldo_movimiento ?? movimiento.valor);
    const valorAplicado = Math.min(restante, saldoAnterior);
    const saldoNuevo = Math.max(0, saldoAnterior - valorAplicado);
    const estadoNuevo = estadoDesdeSaldo(saldoNuevo);

    const { error: errorUpdateMovimiento } = await supabase
      .from("cartera_movimientos")
      .update({
        saldo_movimiento: saldoNuevo,
        estado: estadoNuevo,
      })
      .eq("id", movimiento.id);

    if (errorUpdateMovimiento) throw errorUpdateMovimiento;

    const { data: abonoCreado, error: errorInsertAbono } = await supabase
      .from("cartera_abonos")
      .insert({
        cliente_credito_id: clienteId,
        cartera_movimiento_id: movimiento.id,
        pedido_id: movimiento.pedido_id || null,
        numero_pedido: movimiento.numero_pedido || null,
        cliente_nombre: movimiento.cliente_nombre || null,
        valor_abono: valorAplicado,
        metodo_pago: limpiarTexto(metodoPago) || "Efectivo",
        observacion: limpiarTexto(observacion),
        fecha_abono: fechaRegistro,
        saldo_anterior: saldoAnterior,
        saldo_nuevo: saldoNuevo,
      })
      .select(SELECT_CARTERA_ABONOS)
      .single();

    if (errorInsertAbono) throw errorInsertAbono;

    abonosRegistrados.push(abonoCreado);
    movimientosAfectados.push({ ...movimiento, saldo_movimiento: saldoNuevo, estado: estadoNuevo });
    restante -= valorAplicado;
  }

  const idsClientesAfectados = new Set([clienteId]);
  for (const movimiento of movimientosAfectados) {
    if (movimiento.pedido_id) {
      try {
        const resultado = await sincronizarCarteraPedido({
          id: movimiento.pedido_id,
          numero_pedido: movimiento.numero_pedido,
          cliente: movimiento.cliente_nombre,
          cliente_nombre: movimiento.cliente_nombre,
          tipo_pago: "Crédito",
          total: movimiento.valor,
          created_at: movimiento.fecha_movimiento,
        }, {
          accion: "abono_cliente_credito",
          motivo: "Saldo de cartera recalculado después de registrar abono.",
        });
        (resultado?.clientesRecalculados || []).forEach((id) => idsClientesAfectados.add(id));
      } catch (errorSync) {
        console.warn("No se pudo resincronizar movimiento después del abono:", errorSync?.message || errorSync);
      }
    }
  }

  await Promise.all(Array.from(idsClientesAfectados).map((id) => recalcularResumenClienteCredito(id)));

  return {
    valor_abono: valor,
    abonos: abonosRegistrados,
    saldo_anterior_total: saldoTotal,
    saldo_nuevo_total: Math.max(0, saldoTotal - valor),
  };
}
