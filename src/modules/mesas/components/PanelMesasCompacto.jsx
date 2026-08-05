import React, { useEffect, useMemo, useState } from "react";
import { CampoTexto } from "../../../shared/components/common";
import RafikiModal from "../../../shared/components/RafikiModal";
import ResumenPedidoItem from "../../../shared/components/ResumenPedidoItem";
import {
  dinero,
  esProductoSinAcompanantes,
  MENSAJE_ACOMPANANTES_DEL_DIA
} from "../../../shared/utils/pedidos";
import { MAX_ACOMPANANTES_CLIENTE } from "../../../data/menuAlmuerzos";
import DatosMesa from "./DatosMesa";

const PASOS = [
  { id: "proteina", numero: 1, titulo: "Proteína" },
  { id: "acompanantes", numero: 2, titulo: "Acompañantes" },
  { id: "datos", numero: 3, titulo: "Datos y envío" }
];

function indicePaso(paso) {
  return Math.max(0, PASOS.findIndex((item) => item.id === paso));
}

export default function PanelMesasCompacto({
  cargandoMenu = false,
  platosAgrupados = {},
  itemsAlmuerzoMesa = [],
  hayProductoSeleccionadoMesa = false,
  hayAlmuerzoSeleccionadoMesa = false,
  gruposResumenMesa = [],
  total = 0,
  modoLlevar = false,
  mesaLocal = "",
  meseroLocal = "",
  tipoPagoMesa = "",
  clientePedido = "",
  modoEdicionAdmin = false,
  pedidoEditando = null,
  onCancelarEdicion,
  navegacionAdminVisible = false,
  puedeVerRafa = false,
  onIrAdmin,
  onIrPedidos,
  onIrGerencia,
  acompanantesDisponibles = [],
  onCrearAlmuerzo,
  onCambiarPlato,
  onCambiarAcompanante,
  onMostrarError,
  onQuitarGrupo,
  onCambiarCantidad,
  onEditarProteina,
  onEditarAcompanantes,
  onAbrirNormalCategoria,
  datosMesaProps = {}
}) {
  const [paso, setPaso] = useState(null);
  const [itemActivoId, setItemActivoId] = useState(null);

  const itemActivo = useMemo(() => {
    const encontrado = itemsAlmuerzoMesa.find((item) => item.id === itemActivoId);
    return encontrado || itemsAlmuerzoMesa[itemsAlmuerzoMesa.length - 1] || itemsAlmuerzoMesa[0] || null;
  }, [itemsAlmuerzoMesa, itemActivoId]);

  const pasoActual = PASOS.find((item) => item.id === paso) || null;
  const itemSinAcompanantes = itemActivo ? esProductoSinAcompanantes(itemActivo) : false;
  const acompanantesItem = Array.isArray(itemActivo?.acompanantes) ? itemActivo.acompanantes : [];

  useEffect(() => {
    if (itemActivoId && itemsAlmuerzoMesa.some((item) => item.id === itemActivoId)) return;
    setItemActivoId(itemsAlmuerzoMesa[itemsAlmuerzoMesa.length - 1]?.id || itemsAlmuerzoMesa[0]?.id || null);
  }, [itemActivoId, itemsAlmuerzoMesa]);

  function abrirPaso(pasoSiguiente, itemId = itemActivo?.id) {
    if (itemId) setItemActivoId(itemId);
    setPaso(pasoSiguiente);
  }

  function iniciarAlmuerzo() {
    const pendiente = itemsAlmuerzoMesa.find((item) => !(item.plato || item.proteina || item.producto));
    const itemId = pendiente?.id || onCrearAlmuerzo?.();
    if (!itemId) return;
    abrirPaso("proteina", itemId);
  }

  function continuarProteina() {
    if (!itemActivo?.plato && !itemActivo?.proteina) {
      onMostrarError?.("Selecciona una proteína para continuar.");
      return;
    }

    if (itemSinAcompanantes) {
      mostrarResumenYDatos();
      return;
    }

    abrirPaso("acompanantes", itemActivo.id);
  }

  function validarAcompanantesActuales() {
    if (!itemSinAcompanantes && acompanantesItem.length === 0) {
      onMostrarError?.("Selecciona al menos un acompañante o usa Con todo.");
      return false;
    }
    return true;
  }

  function desplazarA(elementoId) {
    window.setTimeout(() => {
      document.getElementById(elementoId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function mostrarResumenYDatos() {
    setPaso(null);
    desplazarA("mesa-resumen-compacto");
  }

  function irADatos() {
    setPaso(null);
    desplazarA("mesa-datos-final");
  }

  function continuarAcompanantes() {
    if (!validarAcompanantesActuales()) return;
    mostrarResumenYDatos();
  }

  function agregarOtroAlmuerzoDesdeAcompanantes() {
    if (!validarAcompanantesActuales()) return;
    const itemId = onCrearAlmuerzo?.();
    if (!itemId) return;
    abrirPaso("proteina", itemId);
  }

  return (
    <>
      <main className="order-layout mesas-cliente-layout mesas-panel-layout mesas-beta-layout mesas-compacta-operativa">
        <section className="card card-pad mesas-beta-home">
          <div className="mesa-panel-title mesas-beta-title mesas-compacta-title">
            <h2>Mesas</h2>
          </div>

          {modoEdicionAdmin && pedidoEditando?.id && (
            <div className="alert alert-warning edición-pedido-mesas" role="alert">
              <strong>⚠️ Editando el pedido #{pedidoEditando.numero_pedido || pedidoEditando.id}</strong>
              <p className="muted small">Al guardar, los cambios reemplazarán el pedido original.</p>
              <button type="button" className="button light" onClick={() => onCancelarEdicion?.()}>Cancelar edición</button>
            </div>
          )}

          {navegacionAdminVisible && (
            <div className="mesa-admin-nav" aria-label="Navegación administrativa">
              <button type="button" onClick={onIrPedidos}>Pedidos hoy</button>
              <button type="button" onClick={onIrAdmin}>Admin</button>
              {puedeVerRafa && <button type="button" onClick={onIrGerencia}>Gerencia</button>}
            </div>
          )}

          <div className="mesas-beta-steps" aria-label="Pasos del pedido compacto">
            {PASOS.map((pasoItem) => {
              const activo = paso === pasoItem.id;
              const completado = pasoItem.id === "proteina"
                ? hayAlmuerzoSeleccionadoMesa
                : pasoItem.id === "acompanantes"
                  ? Boolean(hayAlmuerzoSeleccionadoMesa && (itemSinAcompanantes || acompanantesItem.length > 0))
                  : Boolean((modoLlevar || mesaLocal) && meseroLocal);

              return (
                <button
                  key={pasoItem.id}
                  type="button"
                  className={["mesas-beta-step", activo ? "active" : "", completado ? "done" : ""].filter(Boolean).join(" ")}
                  onClick={() => {
                    if (pasoItem.id === "datos") {
                      if (!hayProductoSeleccionadoMesa) {
                        onMostrarError?.("Agrega al menos un almuerzo antes de completar los datos.");
                        return;
                      }
                      irADatos();
                      return;
                    }
                    abrirPaso(pasoItem.id);
                  }}
                >
                  <span>{pasoItem.numero}</span>
                  <strong>{pasoItem.titulo}</strong>
                </button>
              );
            })}
          </div>

          <div className="mesas-beta-actions">
            <button type="button" className="button" onClick={iniciarAlmuerzo}>
              {hayProductoSeleccionadoMesa ? "Agregar almuerzo" : "Iniciar pedido"}
            </button>
            <button type="button" className="button light" onClick={irADatos} disabled={!hayProductoSeleccionadoMesa}>Datos y envío</button>
          </div>

          <div className="mesas-compacta-accesos">
            <button type="button" onClick={() => onAbrirNormalCategoria?.("cafeteria")}>☕ Cafetería</button>
            <button
              type="button"
              onClick={() => onAbrirNormalCategoria?.("almuerzos")}
              disabled={!hayAlmuerzoSeleccionadoMesa}
            >
              + Adicionales
            </button>
          </div>
        </section>

        <aside id="mesa-resumen-compacto" className="card card-pad mesas-beta-preview">
          <h2>{hayProductoSeleccionadoMesa ? "Resumen del pedido" : "Resumen"}</h2>
          {!hayProductoSeleccionadoMesa ? (
            <div className="box soft"><strong>Empieza creando el primer almuerzo.</strong></div>
          ) : (
            <>
              <div className="box soft mesas-beta-datos-resumen">
                <strong>{modoLlevar ? "Pedido para llevar" : `Mesa ${mesaLocal || "sin seleccionar"}`}</strong>
                <span>Mesero: {meseroLocal || "sin seleccionar"}</span>
                <span>Pago: {tipoPagoMesa}</span>
                {clientePedido ? <span>Cliente: {clientePedido}</span> : null}
              </div>

              {gruposResumenMesa.map((grupo) => (
                <ResumenPedidoItem
                  key={grupo.key}
                  grupo={grupo}
                  className="mesas-beta-preview-item"
                  onBorrar={onQuitarGrupo}
                  onCambiarCantidad={onCambiarCantidad}
                  onEditarProteina={onEditarProteina}
                  onEditarAcompanantes={onEditarAcompanantes}
                  mostrarTextoParaLlevar={false}
                />
              ))}

              <div className="total-row mesas-beta-total"><span>Total</span><strong>{dinero(total)}</strong></div>
              <div className="mesas-beta-actions resumen-actions-inline">
                <button type="button" className="button light" onClick={iniciarAlmuerzo}>+ Otro almuerzo</button>
              </div>

              <div className="mesas-compacta-datos-inline">
                <DatosMesa {...datosMesaProps} />
              </div>
            </>
          )}
        </aside>
      </main>

      <RafikiModal
        open={paso === "proteina" || paso === "acompanantes"}
        title={pasoActual ? `${pasoActual.numero}. ${pasoActual.titulo}` : "Mesas"}
        onClose={() => setPaso(null)}
        size="lg"
        className="mesas-beta-modal mesas-compacta-modal"
        footer={(
          <>
            {paso === "proteina" && (
              <>
                <button type="button" className="button light" onClick={() => setPaso(null)}>Cerrar</button>
                <button type="button" className="button green" onClick={continuarProteina}>Continuar</button>
              </>
            )}
            {paso === "acompanantes" && (
              <>
                <button type="button" className="button light" onClick={agregarOtroAlmuerzoDesdeAcompanantes}>Agregar otro almuerzo</button>
                <button type="button" className="button green" onClick={continuarAcompanantes}>Continuar</button>
              </>
            )}
          </>
        )}
      >
        <div className="mesas-beta-modal-progress">
          {PASOS.filter((pasoItem) => pasoItem.id !== "datos").map((pasoItem) => (
            <span key={pasoItem.id} className={indicePaso(paso) >= indicePaso(pasoItem.id) ? "active" : ""}>
              {pasoItem.numero}
            </span>
          ))}
        </div>

        {paso === "proteina" && (
          <div className="mesas-beta-modal-section">
            {cargandoMenu ? (
              <div className="box soft">Cargando menú diario...</div>
            ) : Object.keys(platosAgrupados || {}).length === 0 ? (
              <div className="box soft">No hay menú diario configurado.</div>
            ) : (
              Object.entries(platosAgrupados).map(([categoria, platos]) => (
                <div key={categoria} className="category-block">
                  <h3 className="category-title">{categoria}</h3>
                  <div className="option-grid">
                    {platos.map((plato) => (
                      <button
                        key={`${plato.categoria}-${plato.nombre}`}
                        type="button"
                        onClick={() => onCambiarPlato?.(itemActivo?.id, plato)}
                        className={`option ${itemActivo?.plato === plato.nombre ? "selected" : ""}`}
                      >
                        <div>{plato.nombre}</div>
                        <small>{dinero(plato.precio)}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {paso === "acompanantes" && (
          <div className="mesas-beta-modal-section">
            {itemActivo?.plato || itemActivo?.proteina ? (
              <div className="selected-dish pos-selected-dish">
                <span>✓ {itemActivo.plato || itemActivo.proteina}</span>
                <strong>{dinero(itemActivo.precioPlato || itemActivo.precioProteina)}</strong>
              </div>
            ) : (
              <div className="box soft">Primero selecciona una proteína.</div>
            )}

            {itemSinAcompanantes ? (
              <div className="box soft"><strong>{MENSAJE_ACOMPANANTES_DEL_DIA}</strong></div>
            ) : (
              <>
                <div className="resumen-acompanantes-contador">
                  <strong>{acompanantesItem.length}/{MAX_ACOMPANANTES_CLIENTE} acompañantes</strong>
                  <span>Selecciona hasta {MAX_ACOMPANANTES_CLIENTE}</span>
                </div>
                <div className="chips resumen-acompanantes-chips">
                  {acompanantesDisponibles.map((acompanante) => {
                    const seleccionado = acompanantesItem.includes(acompanante);
                    const bloqueado = !seleccionado && acompanantesItem.length >= MAX_ACOMPANANTES_CLIENTE;
                    return (
                      <button
                        key={acompanante}
                        type="button"
                        onClick={() => onCambiarAcompanante?.(itemActivo.id, acompanante)}
                        disabled={bloqueado}
                        className={`chip ${seleccionado ? "selected" : ""} ${bloqueado ? "blocked" : ""}`}
                      >
                        {seleccionado ? "✓ " : "+ "}{acompanante}
                      </button>
                    );
                  })}
                </div>
                <CampoTexto
                  etiqueta="Observación sobre acompañantes"
                  value={itemActivo?.observacionAcompanantes || ""}
                  onChange={(valor) => datosMesaProps.onActualizarItem?.(itemActivo.id, { observacionAcompanantes: valor.slice(0, 60) })}
                  placeholder="Ejemplo: sin ensalada, más arroz..."
                  multiline
                  rows={2}
                  maxLength={60}
                />
              </>
            )}
          </div>
        )}

      </RafikiModal>
    </>
  );
}
