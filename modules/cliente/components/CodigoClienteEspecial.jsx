import { useMemo, useState } from "react";
import {
  normalizarCodigoClienteEspecial,
  validarCodigoClienteEspecial
} from "../../../services/clientesEspecialesService";

export default function CodigoClienteEspecial({
  clienteEspecialAplicado,
  setClienteEspecialAplicado,
  setCliente,
  setTelefono,
  setUbicacion,
  setComerRestauranteCliente,
  setErrorDatosPedido
}) {
  const [codigo, setCodigo] = useState("");
  const [validando, setValidando] = useState(false);
  const [mensajeCodigo, setMensajeCodigo] = useState("");
  const [tipoMensajeCodigo, setTipoMensajeCodigo] = useState("info");

  const codigoNormalizado = useMemo(() => normalizarCodigoClienteEspecial(codigo), [codigo]);

  const aplicarClienteEspecial = (clienteEspecial) => {
    setClienteEspecialAplicado?.(clienteEspecial);

    if (clienteEspecial?.nombre) setCliente?.(clienteEspecial.nombre);
    if (clienteEspecial?.telefono) setTelefono?.(clienteEspecial.telefono);

    if (clienteEspecial?.ubicacion) {
      setComerRestauranteCliente?.(false);
      setUbicacion?.(clienteEspecial.ubicacion);
    }

    setErrorDatosPedido?.("");
  };

  const probarCodigo = async (evento) => {
    evento?.preventDefault?.();

    if (!codigoNormalizado || codigoNormalizado.length < 3) {
      setMensajeCodigo("Ingresa un código válido de mínimo 3 caracteres.");
      setTipoMensajeCodigo("warning");
      return;
    }

    setValidando(true);
    setMensajeCodigo("");

    try {
      const resultado = await validarCodigoClienteEspecial(codigoNormalizado);

      if (!resultado.ok || !resultado.cliente) {
        setClienteEspecialAplicado?.(null);
        setMensajeCodigo(resultado.mensaje || "Código no encontrado o inactivo.");
        setTipoMensajeCodigo("error");
        return;
      }

      aplicarClienteEspecial(resultado.cliente);
      setCodigo(resultado.cliente.codigo || codigoNormalizado);
      setMensajeCodigo(resultado.mensaje || `Bienvenido, ${resultado.cliente.nombre}`);
      setTipoMensajeCodigo("success");
    } catch {
      setClienteEspecialAplicado?.(null);
      setMensajeCodigo("No se pudo validar el código en este momento. Puedes continuar con el pedido normal.");
      setTipoMensajeCodigo("error");
    } finally {
      setValidando(false);
    }
  };

  const quitarCodigo = () => {
    setClienteEspecialAplicado?.(null);
    setCodigo("");
    setMensajeCodigo("Código retirado. Puedes continuar con el pedido normal.");
    setTipoMensajeCodigo("info");
  };

  return (
    <div className="cliente-especial-box fade-step">
      <div className="cliente-especial-heading">
        <div>
          <strong>⭐ ¿Tienes código de cliente?</strong>
          <p className="muted u-mb-0">
            Ingresa tu código para cargar tus datos guardados.
          </p>
        </div>
        {clienteEspecialAplicado ? (
          <span className="cliente-especial-pill">Activo</span>
        ) : null}
      </div>

      <form className="cliente-especial-form" onSubmit={probarCodigo}>
        <input
          type="text"
          value={codigo}
          onChange={(evento) => {
            setCodigo(evento.target.value.toUpperCase());
            if (mensajeCodigo) setMensajeCodigo("");
          }}
          placeholder="Ej: RAFIKI-VIP"
          autoComplete="off"
          inputMode="text"
          aria-label="Código de cliente especial"
        />
        <button type="submit" className="button" disabled={validando}>
          {validando ? "Validando..." : "Aplicar"}
        </button>
      </form>

      {mensajeCodigo ? (
        <div className={`cliente-especial-message cliente-especial-message-${tipoMensajeCodigo}`} role="status">
          {mensajeCodigo}
        </div>
      ) : null}

      {clienteEspecialAplicado ? (
        <div className="cliente-especial-aplicado">
          <strong>{clienteEspecialAplicado.nombre}</strong>
          <span>Código: {clienteEspecialAplicado.codigo}</span>
          <small>
            Se precargaron los datos disponibles. Puedes modificar teléfono o ubicación antes de enviar el pedido.
          </small>
          <button type="button" className="button light" onClick={quitarCodigo}>
            Quitar código
          </button>
        </div>
      ) : null}
    </div>
  );
}
