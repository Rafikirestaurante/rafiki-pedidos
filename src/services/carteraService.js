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
  return String(tipoPago || "").trim().toLowerCase() === "crédito" || String(tipoPago || "").trim().toLowerCase() === "credito";
}

function estadoDesdeSaldo(saldo) {
  return normalizarNumero(saldo) <= 0 ? "pagado" : "parcial";
}

function movimientoTieneSaldo(movimiento) {
  const estado = String(movimiento?.estado || "").toLowerCase();
  if (estado === "pagado" || estado === "anulado") return false;
  return normalizarNumero(movimiento?.saldo_movimiento ?? movimiento?.valor) > 0;
}

function movimientoActivoParaSincronizar(movimiento) {
  const estado = String(movimiento?.estado || "").toLowerCase();
  return estado !== "anulado" && estado !== "pagado";
}

function pedidoEstaBorrado(pedido) {
  return String(pedido?.estado || "").trim().toLowerCase() === "borrado";
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

export async function registrarCarteraPedidoCredito(pedido = {}) {
  if (!supabaseConfigOk || !pedido?.id || !esPagoCredito(pedido.tipo_pago)) return null;

  const clienteNombre = normalizarNombreClienteCredito(pedido.cliente_nombre || pedido.cliente || "");
  const total = normalizarNumero(pedido.total);
  if (!clienteNombre || total <= 0) return null;

  const cliente = await asegurarClienteCredito(clienteNombre);
  if (!cliente?.id) return null;

  const { data: existente, error: errorExistente } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedido.id))
    .eq("tipo_movimiento", "pedido_credito")
    .maybeSingle();

  if (errorExistente) {
    console.warn("No se pudo verificar cartera del pedido:", errorExistente.message);
  }

  if (existente?.id) return existente;

  const fechaPedido = pedido.created_at || new Date().toISOString();
  const movimientoPayload = {
    cliente_credito_id: cliente.id,
    pedido_id: String(pedido.id),
    numero_pedido: pedido.numero_pedido || null,
    cliente_nombre: clienteNombre,
    tipo_movimiento: "pedido_credito",
    concepto: `Pedido #${pedido.numero_pedido || pedido.id}`,
    valor: total,
    saldo_movimiento: total,
    estado: "pendiente",
    fecha_movimiento: fechaPedido,
    observaciones: pedido.observaciones || null,
  };

  const { data, error } = await supabase
    .from("cartera_movimientos")
    .insert(movimientoPayload)
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .single();

  if (error) {
    console.warn("No se pudo registrar cartera automática:", error.message);
    throw error;
  }

  const { data: clienteActualizado, error: errorCliente } = await supabase
    .from("clientes_credito")
    .select("id,total_pedidos,saldo_pendiente,fecha_ultimo_pedido")
    .eq("id", cliente.id)
    .maybeSingle();

  if (!errorCliente && clienteActualizado?.id) {
    const totalPedidos = normalizarNumero(clienteActualizado.total_pedidos) + 1;
    const saldoPendiente = normalizarNumero(clienteActualizado.saldo_pendiente) + total;

    const { error: errorUpdateCliente } = await supabase
      .from("clientes_credito")
      .update({
        total_pedidos: totalPedidos,
        saldo_pendiente: saldoPendiente,
        fecha_ultimo_pedido: fechaPedido,
      })
      .eq("id", cliente.id);

    if (errorUpdateCliente) {
      console.warn("No se pudo actualizar saldo del cliente crédito:", errorUpdateCliente.message);
    }
  }

  return data;
}

export async function corregirClienteCreditoDePedido(pedido = {}, nombreDestino = "") {
  if (!supabaseConfigOk || !pedido?.id) return null;

  const nombreLimpio = normalizarNombreClienteCredito(nombreDestino);
  if (!nombreLimpio) throw new Error("Escribe el nombre correcto del cliente crédito.");

  const total = normalizarNumero(pedido.total);
  const fechaPedido = pedido.created_at || new Date().toISOString();
  const clienteDestino = await asegurarClienteCredito(nombreLimpio);
  if (!clienteDestino?.id) throw new Error("No se pudo crear o encontrar el cliente crédito.");

  const { data: movimientosActuales, error: errorMovimientosActuales } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedido.id))
    .eq("tipo_movimiento", "pedido_credito");

  if (errorMovimientosActuales) throw errorMovimientosActuales;

  const movimientos = Array.isArray(movimientosActuales) ? movimientosActuales : [];
  const idsClientesAnteriores = Array.from(new Set(
    movimientos
      .map((movimiento) => movimiento.cliente_credito_id)
      .filter((id) => id && id !== clienteDestino.id)
  ));

  if (movimientos.length === 0 && total > 0) {
    const { error: errorInsert } = await supabase
      .from("cartera_movimientos")
      .insert({
        cliente_credito_id: clienteDestino.id,
        pedido_id: String(pedido.id),
        numero_pedido: pedido.numero_pedido || null,
        cliente_nombre: nombreLimpio,
        tipo_movimiento: "pedido_credito",
        concepto: `Pedido #${pedido.numero_pedido || pedido.id}`,
        valor: total,
        saldo_movimiento: total,
        estado: "pendiente",
        fecha_movimiento: fechaPedido,
        observaciones: pedido.observaciones || "Corrección desde Pedidos Hoy",
      });

    if (errorInsert) throw errorInsert;
  } else if (movimientos.length > 0) {
    const { error: errorUpdateMovimientos } = await supabase
      .from("cartera_movimientos")
      .update({
        cliente_credito_id: clienteDestino.id,
        cliente_nombre: nombreLimpio,
      })
      .eq("pedido_id", String(pedido.id))
      .eq("tipo_movimiento", "pedido_credito");

    if (errorUpdateMovimientos) throw errorUpdateMovimientos;
  }

  const idsParaRecalcular = Array.from(new Set([...idsClientesAnteriores, clienteDestino.id].filter(Boolean)));
  await Promise.all(idsParaRecalcular.map((clienteId) => recalcularResumenClienteCredito(clienteId)));

  const { data: movimientosCorregidos, error: errorMovimientosCorregidos } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedido.id))
    .eq("tipo_movimiento", "pedido_credito");

  if (errorMovimientosCorregidos) throw errorMovimientosCorregidos;

  return {
    cliente: clienteDestino,
    movimientos: Array.isArray(movimientosCorregidos) ? movimientosCorregidos : [],
  };
}


export async function anularCarteraPedidoCredito(pedido = {}, motivo = "Pedido retirado de crédito", opciones = {}) {
  if (!supabaseConfigOk || !pedido?.id) return null;

  const { data: movimientosActuales, error: errorMovimientosActuales } = await supabase
    .from("cartera_movimientos")
    .select(SELECT_CARTERA_MOVIMIENTOS)
    .eq("pedido_id", String(pedido.id))
    .eq("tipo_movimiento", "pedido_credito");

  if (errorMovimientosActuales) throw errorMovimientosActuales;

  const movimientos = Array.isArray(movimientosActuales) ? movimientosActuales : [];
  if (movimientos.length === 0) return { movimientos: [], clientesRecalculados: [] };

  const movimientosActivos = movimientos.filter(movimientoActivoParaSincronizar);

  const idsMovimientos = movimientos.map((movimiento) => movimiento.id).filter(Boolean);

  if (idsMovimientos.length > 0) {
    const { data: abonosAsociados, error: errorAbonos } = await supabase
      .from("cartera_abonos")
      .select("id,cartera_movimiento_id,valor_abono")
      .in("cartera_movimiento_id", idsMovimientos)
      .limit(1);

    if (!opciones.forzar && !errorAbonos && Array.isArray(abonosAsociados) && abonosAsociados.length > 0) {
      throw new Error("Este pedido ya tiene abonos registrados. Revisa el historial antes de retirarlo de crédito.");
    }
  }

  if (movimientosActivos.length > 0) {
    const observacionAnulacion = limpiarTexto(motivo) || "Pedido retirado de crédito";
    const idsActivos = movimientosActivos.map((movimiento) => movimiento.id).filter(Boolean);

    const { error: errorUpdateMovimientos } = await supabase
      .from("cartera_movimientos")
      .update({
        saldo_movimiento: 0,
        estado: "anulado",
        observaciones: observacionAnulacion,
      })
      .in("id", idsActivos);

    if (errorUpdateMovimientos) throw errorUpdateMovimientos;
  }

  const idsClientes = Array.from(new Set(
    movimientos
      .map((movimiento) => movimiento.cliente_credito_id)
      .filter(Boolean)
  ));

  await Promise.all(idsClientes.map((clienteId) => recalcularResumenClienteCredito(clienteId)));

  return {
    movimientos: movimientosActivos,
    clientesRecalculados: idsClientes,
  };
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
  const movimientosActivos = lista.filter(movimientoActivoParaSincronizar);
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
  const idsMovimientosActivos = movimientosActivos.map((movimiento) => movimiento.id).filter(Boolean);
  const abonosPorMovimiento = new Map();

  if (idsMovimientosActivos.length > 0) {
    for (const lote of partirEnLotes(idsMovimientosActivos, 100)) {
      const { data: abonosLote, error: errorAbonos } = await supabase
        .from("cartera_abonos")
        .select("cartera_movimiento_id,valor_abono")
        .in("cartera_movimiento_id", lote);

      if (errorAbonos) {
        console.warn("No se pudieron revisar abonos durante auditoría de cartera:", errorAbonos.message);
        break;
      }

      for (const abono of Array.isArray(abonosLote) ? abonosLote : []) {
        const movimientoId = abono.cartera_movimiento_id;
        if (!movimientoId) continue;
        abonosPorMovimiento.set(
          movimientoId,
          normalizarNumero(abonosPorMovimiento.get(movimientoId)) + normalizarNumero(abono.valor_abono)
        );
      }
    }
  }

  const movimientosPorPedido = new Map();
  for (const movimiento of movimientosActivos) {
    const pedidoId = String(movimiento.pedido_id || "");
    if (!pedidoId) continue;
    if (!movimientosPorPedido.has(pedidoId)) movimientosPorPedido.set(pedidoId, []);
    movimientosPorPedido.get(pedidoId).push(movimiento);
  }

  const idsPorAnular = new Set();
  const motivosAnulacion = new Map();
  const clientesAfectados = new Set();
  let anuladosBorrados = 0;
  let anuladosNoCredito = 0;
  let anuladosHuerfanos = 0;
  let duplicadosAnulados = 0;

  for (const movimiento of movimientosActivos) {
    const pedido = pedidosPorId.get(String(movimiento.pedido_id));
    if (!pedido) {
      idsPorAnular.add(movimiento.id);
      motivosAnulacion.set(movimiento.id, "Movimiento anulado automáticamente porque el pedido ya no existe.");
      clientesAfectados.add(movimiento.cliente_credito_id);
      anuladosHuerfanos += 1;
      continue;
    }

    if (pedidoEstaBorrado(pedido)) {
      idsPorAnular.add(movimiento.id);
      motivosAnulacion.set(movimiento.id, "Movimiento anulado automáticamente porque el pedido fue borrado.");
      clientesAfectados.add(movimiento.cliente_credito_id);
      anuladosBorrados += 1;
      continue;
    }

    if (!esPagoCredito(pedido.tipo_pago)) {
      idsPorAnular.add(movimiento.id);
      motivosAnulacion.set(
        movimiento.id,
        `Movimiento anulado automáticamente porque el pedido ya no está marcado como crédito. Pago actual: ${pedido.tipo_pago || "Sin pago"}.`
      );
      clientesAfectados.add(movimiento.cliente_credito_id);
      anuladosNoCredito += 1;
    }
  }

  for (const [pedidoId, movimientosPedido] of movimientosPorPedido.entries()) {
    const pedido = pedidosPorId.get(pedidoId);
    if (!pedido || pedidoEstaBorrado(pedido) || !esPagoCredito(pedido.tipo_pago)) continue;

    const movimientosValidos = movimientosPedido.filter((movimiento) => !idsPorAnular.has(movimiento.id));
    if (movimientosValidos.length <= 1) continue;

    const principal = seleccionarMovimientoPrincipal(movimientosValidos, abonosPorMovimiento);
    for (const movimiento of movimientosValidos) {
      if (movimiento.id === principal?.id) continue;
      idsPorAnular.add(movimiento.id);
      motivosAnulacion.set(
        movimiento.id,
        "Movimiento duplicado anulado automáticamente; se conserva un movimiento principal para este pedido."
      );
      clientesAfectados.add(movimiento.cliente_credito_id);
      duplicadosAnulados += 1;
    }
  }

  for (const loteIds of partirEnLotes(Array.from(idsPorAnular), 100)) {
    for (const movimientoId of loteIds) {
      const { error: errorUpdate } = await supabase
        .from("cartera_movimientos")
        .update({
          saldo_movimiento: 0,
          estado: "anulado",
          observaciones: motivosAnulacion.get(movimientoId) || "Movimiento anulado durante auditoría de cartera.",
        })
        .eq("id", movimientoId);

      if (errorUpdate) throw errorUpdate;
    }
  }

  let valoresAjustados = 0;
  for (const movimiento of movimientosActivos) {
    if (idsPorAnular.has(movimiento.id)) continue;

    const pedido = pedidosPorId.get(String(movimiento.pedido_id));
    if (!pedido || pedidoEstaBorrado(pedido) || !esPagoCredito(pedido.tipo_pago)) continue;

    const totalPedido = normalizarNumero(pedido.total);
    if (totalPedido <= 0) continue;

    const abonosAplicados = normalizarNumero(abonosPorMovimiento.get(movimiento.id));
    const saldoEsperado = Math.max(0, totalPedido - abonosAplicados);
    const estadoEsperado = estadoPendienteDesdeAbonos(saldoEsperado, abonosAplicados);
    const cambios = {};

    if (valoresDiferentes(movimiento.valor, totalPedido)) cambios.valor = totalPedido;
    if (valoresDiferentes(movimiento.saldo_movimiento ?? movimiento.valor, saldoEsperado)) cambios.saldo_movimiento = saldoEsperado;
    if (String(movimiento.estado || "").toLowerCase() !== estadoEsperado) cambios.estado = estadoEsperado;
    if (!movimiento.numero_pedido && pedido.numero_pedido) cambios.numero_pedido = pedido.numero_pedido;

    if (Object.keys(cambios).length > 0) {
      const { error: errorAjuste } = await supabase
        .from("cartera_movimientos")
        .update(cambios)
        .eq("id", movimiento.id);

      if (errorAjuste) throw errorAjuste;
      valoresAjustados += 1;
      clientesAfectados.add(movimiento.cliente_credito_id);
    }
  }

  const idsClientesMovimiento = Array.from(new Set(
    movimientosActivos
      .map((movimiento) => movimiento.cliente_credito_id)
      .filter(Boolean)
  ));
  const idsClientes = Array.from(new Set([...idsClientesMovimiento, ...Array.from(clientesAfectados)].filter(Boolean)));
  await Promise.all(idsClientes.map((clienteId) => recalcularResumenClienteCredito(clienteId)));

  const anulados = idsPorAnular.size;
  const totalCorrecciones = anulados + valoresAjustados;

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
    restante -= valorAplicado;
  }

  await recalcularResumenClienteCredito(clienteId);

  return {
    valor_abono: valor,
    abonos: abonosRegistrados,
    saldo_anterior_total: saldoTotal,
    saldo_nuevo_total: Math.max(0, saldoTotal - valor),
  };
}
