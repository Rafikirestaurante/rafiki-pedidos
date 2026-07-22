import { useMemo, useState } from "react";
import RafikiModal from "../../../shared/components/RafikiModal";
import {
  diasEnMesCumpleanos,
  normalizarCodigoClienteEspecial,
  normalizarTelefonoCliente,
  registrarClientePublico,
  validarCodigoClienteEspecial
} from "../../../services/clientesEspecialesService";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const REGISTRO_INICIAL = {
  nombre: "",
  telefono: "",
  ubicacion: "",
  cumple_mes: "",
  cumple_dia: "",
  aceptaDatos: false
};

function normalizarCodigoAcceso(valor) {
  const soloDigitos = String(valor || "").replace(/\D+/g, "");
  if (/^(57)?3\d{9}$/.test(soloDigitos)) return normalizarTelefonoCliente(soloDigitos);
  return normalizarCodigoClienteEspecial(valor);
}

export default function CodigoClienteEspecial({
  clienteEspecialAplicado,
  setClienteEspecialAplicado,
  cliente,
  telefono,
  ubicacion,
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
  const [modalBienvenidaAbierto, setModalBienvenidaAbierto] = useState(false);
  const [tituloBienvenida, setTituloBienvenida] = useState("¡Bienvenido!");
  const [registroAbierto, setRegistroAbierto] = useState(false);
  const [registro, setRegistro] = useState(REGISTRO_INICIAL);
  const [registrando, setRegistrando] = useState(false);
  const [mensajeRegistro, setMensajeRegistro] = useState("");

  const codigoNormalizado = useMemo(() => normalizarCodigoAcceso(codigo), [codigo]);
  const cantidadDiasCumpleanos = useMemo(
    () => diasEnMesCumpleanos(registro.cumple_mes),
    [registro.cumple_mes]
  );

  const aplicarCliente = (clienteEncontrado) => {
    setClienteEspecialAplicado?.(clienteEncontrado);

    if (clienteEncontrado?.nombre) setCliente?.(clienteEncontrado.nombre);
    if (clienteEncontrado?.telefono) setTelefono?.(clienteEncontrado.telefono);

    if (clienteEncontrado?.ubicacion) {
      setComerRestauranteCliente?.(false);
      setUbicacion?.(clienteEncontrado.ubicacion);
    }

    setErrorDatosPedido?.("");
  };

  const validarYAplicar = async (valorCodigo, { titulo = "¡Bienvenido!" } = {}) => {
    const valorNormalizado = normalizarCodigoAcceso(valorCodigo);
    const resultado = await validarCodigoClienteEspecial(valorNormalizado);

    if (!resultado.ok || !resultado.cliente) {
      setClienteEspecialAplicado?.(null);
      return resultado;
    }

    aplicarCliente(resultado.cliente);
    setCodigo(resultado.cliente.codigo || valorNormalizado);
    setMensajeCodigo("");
    setTipoMensajeCodigo("success");
    setTituloBienvenida(titulo);
    setModalBienvenidaAbierto(true);
    return resultado;
  };

  const probarCodigo = async (evento) => {
    evento?.preventDefault?.();

    if (!codigoNormalizado || codigoNormalizado.length < 3) {
      setMensajeCodigo("Ingresa tu celular o código de cliente.");
      setTipoMensajeCodigo("warning");
      return;
    }

    setValidando(true);
    setMensajeCodigo("");

    try {
      const resultado = await validarYAplicar(codigoNormalizado);
      if (!resultado.ok || !resultado.cliente) {
        setMensajeCodigo(resultado.mensaje || "Código no encontrado o inactivo.");
        setTipoMensajeCodigo("error");
      }
    } catch {
      setClienteEspecialAplicado?.(null);
      setMensajeCodigo("No se pudo validar en este momento. Puedes continuar con el pedido normal.");
      setTipoMensajeCodigo("error");
    } finally {
      setValidando(false);
    }
  };

  const abrirRegistro = () => {
    setRegistro({
      ...REGISTRO_INICIAL,
      nombre: String(cliente || ""),
      telefono: normalizarTelefonoCliente(telefono),
      ubicacion: String(ubicacion || "")
    });
    setMensajeRegistro("");
    setRegistroAbierto(true);
  };

  const cerrarRegistro = () => {
    if (registrando) return;
    setRegistroAbierto(false);
    setMensajeRegistro("");
  };

  const cambiarRegistro = (campo, valor) => {
    setRegistro((actual) => {
      const siguiente = {
        ...actual,
        [campo]: campo === "telefono" ? normalizarTelefonoCliente(valor) : valor
      };

      if (campo === "cumple_mes") {
        const maximo = diasEnMesCumpleanos(valor);
        if (Number(siguiente.cumple_dia) > maximo) siguiente.cumple_dia = "";
      }

      return siguiente;
    });
    if (mensajeRegistro) setMensajeRegistro("");
  };

  const registrarCliente = async (evento) => {
    evento?.preventDefault?.();

    if (!registro.aceptaDatos) {
      setMensajeRegistro("Debes autorizar el almacenamiento de tus datos para registrarte.");
      return;
    }

    setRegistrando(true);
    setMensajeRegistro("");

    try {
      const resultado = await registrarClientePublico(registro);
      const celular = normalizarTelefonoCliente(registro.telefono);

      if (resultado.ok && resultado.cliente) {
        aplicarCliente(resultado.cliente);
        setCodigo(resultado.cliente.codigo || celular);
        setRegistroAbierto(false);
        setTituloBienvenida("¡Registro completado!");
        setModalBienvenidaAbierto(true);
        return;
      }

      if (resultado.codigoExistente && celular) {
        const existente = await validarYAplicar(celular, { titulo: "¡Ya estabas registrado!" });
        if (existente.ok && existente.cliente) {
          setRegistroAbierto(false);
          return;
        }
      }

      setMensajeRegistro(resultado.mensaje || "No se pudo completar el registro.");
    } catch {
      setMensajeRegistro("No se pudo completar el registro en este momento.");
    } finally {
      setRegistrando(false);
    }
  };

  const quitarCodigo = () => {
    setClienteEspecialAplicado?.(null);
    setModalBienvenidaAbierto(false);
    setCodigo("");
    setMensajeCodigo("");
    setTipoMensajeCodigo("info");
  };

  const mensajeBienvenida = clienteEspecialAplicado?.mensaje_bienvenida
    || (clienteEspecialAplicado?.nombre ? `Bienvenido, ${clienteEspecialAplicado.nombre}` : "Bienvenido");

  const mostrarMensajeEstado = mensajeCodigo && !clienteEspecialAplicado;
  const cerrarModalBienvenida = () => setModalBienvenidaAbierto(false);
  const esRegistroPublico = clienteEspecialAplicado?.origen_registro === "cliente";

  return (
    <div className="cliente-especial-box cliente-especial-box-discreta fade-step">
      {clienteEspecialAplicado ? (
        <div className="cliente-especial-identidad">
          <div>
            <small>{esRegistroPublico ? "Cliente registrado" : "Código aplicado"}</small>
            <strong>{clienteEspecialAplicado.nombre || clienteEspecialAplicado.codigo}</strong>
          </div>
          <button type="button" className="cliente-especial-link" onClick={quitarCodigo}>
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <div className="cliente-especial-heading cliente-especial-heading-discreta">
            <strong>¿Ya eres cliente?</strong>
            <button type="button" className="cliente-especial-link" onClick={abrirRegistro}>
              Registrarme
            </button>
          </div>

          <form className="cliente-especial-form" onSubmit={probarCodigo}>
            <input
              type="text"
              value={codigo}
              onChange={(evento) => {
                setCodigo(evento.target.value.toUpperCase());
                if (mensajeCodigo) setMensajeCodigo("");
              }}
              placeholder="Celular o código"
              autoComplete="off"
              inputMode="text"
              maxLength={40}
              aria-label="Celular o código de cliente"
            />
            <button type="submit" className="button button-small" disabled={validando}>
              {validando ? "Validando..." : "Aplicar"}
            </button>
          </form>
        </>
      )}

      <RafikiModal
        open={registroAbierto}
        title="Registro de cliente"
        description="Tu número de celular quedará como código para próximos pedidos."
        onClose={cerrarRegistro}
        closeLabel="Cerrar registro"
        size="md"
        className="cliente-registro-modal"
        footer={(
          <>
            <button type="button" className="button light" onClick={cerrarRegistro} disabled={registrando}>
              Cancelar
            </button>
            <button type="submit" form="cliente-registro-form" className="button" disabled={registrando}>
              {registrando ? "Registrando..." : "Registrarme"}
            </button>
          </>
        )}
      >
        <form id="cliente-registro-form" className="cliente-registro-form" onSubmit={registrarCliente}>
          <label className="field-label">
            Nombre
            <input
              value={registro.nombre}
              onChange={(evento) => cambiarRegistro("nombre", evento.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              maxLength={100}
              required
            />
          </label>

          <label className="field-label">
            Celular
            <input
              value={registro.telefono}
              onChange={(evento) => cambiarRegistro("telefono", evento.target.value)}
              placeholder="3001234567"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              required
            />
            <small>Este será tu código de cliente.</small>
          </label>

          <label className="field-label cliente-registro-ubicacion">
            Ubicación habitual
            <input
              value={registro.ubicacion}
              onChange={(evento) => cambiarRegistro("ubicacion", evento.target.value)}
              placeholder="Edificio, oficina, apartamento o barrio"
              autoComplete="street-address"
              maxLength={180}
              required
            />
          </label>

          <fieldset className="cliente-registro-cumpleanos">
            <legend>🎂 Cumpleaños</legend>
            <p>Solo guardaremos el día y el mes, no el año.</p>
            <div>
              <label className="field-label">
                Mes
                <select
                  value={registro.cumple_mes}
                  onChange={(evento) => cambiarRegistro("cumple_mes", evento.target.value)}
                  required
                >
                  <option value="">Selecciona</option>
                  {MESES.map((mes, indice) => (
                    <option key={mes} value={indice + 1}>{mes}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Día
                <select
                  value={registro.cumple_dia}
                  onChange={(evento) => cambiarRegistro("cumple_dia", evento.target.value)}
                  disabled={!registro.cumple_mes}
                  required
                >
                  <option value="">Selecciona</option>
                  {Array.from({ length: cantidadDiasCumpleanos }, (_, indice) => indice + 1).map((dia) => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <label className="cliente-registro-consentimiento">
            <input
              type="checkbox"
              checked={registro.aceptaDatos}
              onChange={(evento) => cambiarRegistro("aceptaDatos", evento.target.checked)}
            />
            <span>Autorizo guardar estos datos para identificarme y agilizar mis próximos pedidos.</span>
          </label>

          {mensajeRegistro ? (
            <div className="cliente-especial-message cliente-especial-message-error" role="alert">
              {mensajeRegistro}
            </div>
          ) : null}
        </form>
      </RafikiModal>

      <RafikiModal
        open={modalBienvenidaAbierto && Boolean(clienteEspecialAplicado)}
        title={tituloBienvenida}
        onClose={cerrarModalBienvenida}
        closeLabel="Cerrar bienvenida"
        size="sm"
        className="cliente-especial-modal-bienvenida"
        footer={(
          <button type="button" className="button" onClick={cerrarModalBienvenida}>
            Continuar pedido
          </button>
        )}
      >
        <div className="cliente-especial-modal-content" role="status">
          <div className="cliente-especial-modal-icon" aria-hidden="true">⭐</div>
          <h2>{mensajeBienvenida}</h2>
          <p>Gracias por preferirnos. Ya puedes continuar con tu pedido.</p>
        </div>
      </RafikiModal>

      {mostrarMensajeEstado ? (
        <div className={`cliente-especial-message cliente-especial-message-${tipoMensajeCodigo}`} role="status">
          {mensajeCodigo}
        </div>
      ) : null}
    </div>
  );
}
