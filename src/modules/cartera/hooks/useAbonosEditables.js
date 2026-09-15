import { useState } from "react";
import { anularAbonoClienteCredito, editarAbonoClienteCredito } from "../../../services/carteraService";
import { describirErrorSupabase, registrarErrorSupabase } from "../../../shared/utils/supabaseErrors";
import { aPesosEnteros } from "../../../shared/utils/money";
import { fechaColombiaYYYYMMDD } from "../../../shared/utils/fechasColombia";
import { ABONO_INICIAL, METODOS_ABONO, dinero } from "../utils/carteraViewUtils";

export default function useAbonosEditables({ clienteDetalle, guardando, setGuardando, setMensaje, setError, actualizarTodo }) {
  const [abonoEditando, setAbonoEditando] = useState(null);
  const [formularioAbonoEdicion, setFormularioAbonoEdicion] = useState(ABONO_INICIAL);
  const [abonoAnulando, setAbonoAnulando] = useState(null);
  const [motivoAnulacionAbono, setMotivoAnulacionAbono] = useState("");

  function abrirEdicionAbono(linea) {
    const abono = linea?.abono;
    if (!abono?.pago_id) {
      setError("Ejecuta el SQL de la Fase 39 para habilitar la edición de este abono.");
      return;
    }
    setAbonoEditando(abono);
    setFormularioAbonoEdicion({
      valorAbono: String(aPesosEnteros(abono.valor_abono)),
      metodoPago: abono.metodo_pago || METODOS_ABONO[0],
      observacion: abono.observacion || "",
      fechaAbono: String(abono.fecha_abono || abono.created_at || "").slice(0, 10) || fechaColombiaYYYYMMDD(),
    });
    setMensaje("");
    setError("");
  }

  function cerrarEdicionAbono() {
    if (guardando) return;
    setAbonoEditando(null);
    setFormularioAbonoEdicion(ABONO_INICIAL);
  }

  function cambiarCampoAbonoEdicion(campo, valor) {
    setFormularioAbonoEdicion((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardarEdicionAbono(evento) {
    evento.preventDefault();
    if (!abonoEditando?.pago_id || guardando) return;
    const valor = aPesosEnteros(formularioAbonoEdicion.valorAbono);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("El valor del abono debe ser mayor a cero.");
      return;
    }
    const maximoPermitido = aPesosEnteros(clienteDetalle?.saldo_pendiente) + aPesosEnteros(abonoEditando.valor_abono);
    if (valor > maximoPermitido) {
      setError(`El nuevo valor excede la cartera disponible. Máximo permitido para este abono: ${dinero(maximoPermitido)}.`);
      return;
    }
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      await editarAbonoClienteCredito({
        pagoId: abonoEditando.pago_id,
        valorAbono: valor,
        metodoPago: formularioAbonoEdicion.metodoPago,
        observacion: formularioAbonoEdicion.observacion,
        fechaAbono: formularioAbonoEdicion.fechaAbono,
      });
      setAbonoEditando(null);
      setFormularioAbonoEdicion(ABONO_INICIAL);
      setMensaje("Abono actualizado correctamente. Rafiki recalculó la cartera y las aplicaciones FIFO.");
      await actualizarTodo();
    } catch (err) {
      registrarErrorSupabase("editar abono de cartera", err);
      setError(describirErrorSupabase(err, "editar el abono"));
    } finally {
      setGuardando(false);
    }
  }

  function abrirAnulacionAbono(linea) {
    const abono = linea?.abono;
    if (!abono?.pago_id) {
      setError("Ejecuta el SQL de la Fase 39 para habilitar la eliminación segura de este abono.");
      return;
    }
    setAbonoAnulando(abono);
    setMotivoAnulacionAbono("");
    setMensaje("");
    setError("");
  }

  function cerrarAnulacionAbono() {
    if (guardando) return;
    setAbonoAnulando(null);
    setMotivoAnulacionAbono("");
  }

  async function confirmarAnulacionAbono() {
    if (!abonoAnulando?.pago_id || guardando) return;
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      await anularAbonoClienteCredito({ pagoId: abonoAnulando.pago_id, motivo: motivoAnulacionAbono });
      setAbonoAnulando(null);
      setMotivoAnulacionAbono("");
      setMensaje("Abono eliminado de la cartera. El registro se conserva en auditoría y los saldos fueron recalculados.");
      await actualizarTodo();
    } catch (err) {
      registrarErrorSupabase("anular abono de cartera", err);
      setError(describirErrorSupabase(err, "eliminar el abono"));
    } finally {
      setGuardando(false);
    }
  }

  return {
    abonoEditando, formularioAbonoEdicion, abonoAnulando, motivoAnulacionAbono,
    abrirEdicionAbono, cerrarEdicionAbono, cambiarCampoAbonoEdicion, guardarEdicionAbono,
    abrirAnulacionAbono, cerrarAnulacionAbono, confirmarAnulacionAbono, setMotivoAnulacionAbono,
  };
}
