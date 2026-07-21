import React from "react";
import RafikiModal from "../../../shared/components/RafikiModal";
import { dinero } from "../utils/carteraViewUtils";

export default function CarteraModals({
  mostrarFormulario,
  clienteEditando,
  limpiarFormulario,
  guardarCliente,
  formulario,
  cambiarCampo,
  guardando,
  clienteAbono,
  cerrarAbono,
  guardarAbono,
  formularioAbono,
  cambiarCampoAbono,
  metodosAbono,
  abonoPendienteConfirmacion,
  cerrarConfirmacionAbono,
  confirmarRegistroAbono,
}) {
  return (
    <>
      <RafikiModal
        open={mostrarFormulario}
        title={clienteEditando ? "Editar cliente crédito" : "Nuevo cliente crédito"}
        description="Guarda solo la información básica del cliente. Los saldos se actualizan automáticamente desde pedidos y abonos."
        onClose={limpiarFormulario}
        size="md"
      >
        <form onSubmit={guardarCliente}>
          <div className="cartera-form">
            <input value={formulario.nombre} onChange={(event) => cambiarCampo("nombre", event.target.value)} placeholder="Nombre del cliente" />
            <input value={formulario.telefono} onChange={(event) => cambiarCampo("telefono", event.target.value)} placeholder="Teléfono" />
            <textarea value={formulario.observaciones} onChange={(event) => cambiarCampo("observaciones", event.target.value)} placeholder="Observaciones" />
          </div>
          <div className="cartera-actions">
            <button type="submit" className="button" disabled={guardando}>{guardando ? "Guardando..." : clienteEditando ? "Guardar cambios" : "Crear cliente"}</button>
            <button type="button" className="button light" onClick={limpiarFormulario}>Cancelar</button>
          </div>
        </form>
      </RafikiModal>

      <RafikiModal
        open={Boolean(clienteAbono)}
        title="Registrar abono"
        description={clienteAbono ? `${clienteAbono.nombre} debe actualmente ${dinero(clienteAbono.saldo_pendiente)}. El abono se aplica automáticamente a los pedidos más antiguos.` : ""}
        onClose={cerrarAbono}
        size="lg"
      >
        {clienteAbono && (
          <form onSubmit={guardarAbono}>
            <div className="abono-form-grid">
              <label>
                Valor del abono
                <input type="number" min="0" step="100" value={formularioAbono.valorAbono} onChange={(event) => cambiarCampoAbono("valorAbono", event.target.value)} placeholder="Ej. 50000" required />
              </label>
              <label>
                Método de pago
                <select value={formularioAbono.metodoPago} onChange={(event) => cambiarCampoAbono("metodoPago", event.target.value)}>
                  {metodosAbono.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
                </select>
              </label>
              <label>
                Fecha
                <input type="date" value={formularioAbono.fechaAbono} onChange={(event) => cambiarCampoAbono("fechaAbono", event.target.value)} />
              </label>
              <label>
                Observación
                <input value={formularioAbono.observacion} onChange={(event) => cambiarCampoAbono("observacion", event.target.value)} placeholder="Opcional" />
              </label>
            </div>
            <div className="cartera-actions">
              <button type="submit" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} disabled={guardando}>{guardando ? "Guardando..." : "Guardar abono"}</button>
              <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={cerrarAbono} disabled={guardando}>Cancelar</button>
            </div>
          </form>
        )}
      </RafikiModal>

      <RafikiModal
        open={Boolean(abonoPendienteConfirmacion)}
        title="Confirmar abono"
        description={abonoPendienteConfirmacion ? `Vas a registrar un abono de ${dinero(abonoPendienteConfirmacion.valor)} para ${abonoPendienteConfirmacion.clienteNombre}.` : ""}
        onClose={cerrarConfirmacionAbono}
        size="sm"
        footer={(
          <>
            <button type="button" className="mini-btn" style={{ width: "auto", marginBottom: 0 }} onClick={cerrarConfirmacionAbono} disabled={guardando}>Cancelar</button>
            <button type="button" className="mini-btn green" style={{ width: "auto", marginBottom: 0 }} onClick={confirmarRegistroAbono} disabled={guardando}>{guardando ? "Guardando..." : "Confirmar abono"}</button>
          </>
        )}
      >
        {abonoPendienteConfirmacion ? (
          <div className="cartera-correccion-resumen">
            <p><strong>Cliente:</strong> {abonoPendienteConfirmacion.clienteNombre}</p>
            <p><strong>Saldo actual:</strong> {dinero(abonoPendienteConfirmacion.saldoPendiente)}</p>
            <p><strong>Abono:</strong> {dinero(abonoPendienteConfirmacion.valor)}</p>
            <p><strong>Nuevo saldo estimado:</strong> {dinero(Math.max(0, abonoPendienteConfirmacion.saldoPendiente - abonoPendienteConfirmacion.valor))}</p>
            <p><strong>Método:</strong> {abonoPendienteConfirmacion.metodoPago}</p>
          </div>
        ) : null}
      </RafikiModal>
    </>
  );
}
