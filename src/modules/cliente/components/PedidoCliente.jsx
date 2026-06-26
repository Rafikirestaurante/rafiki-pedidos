import { CampoTexto, SelectorCantidad, useAlertaRafiki } from "../../../shared/components/common";
import { MAX_ACOMPANANTES_CLIENTE } from "../../../data/menuAlmuerzos";
import {
  calcularTotalItem,
  dinero,
  esProductoSinAcompanantes,
  textoParaLlevarItem,
  valorParaLlevarItem,
} from "../../../shared/utils/pedidos";
import { FORMAS_PAGO_CLIENTE } from "../../../shared/constants/paymentMethods";
import CodigoClienteEspecial from "./CodigoClienteEspecial";

export default function PedidoCliente({
  menu,
  cargandoMenu,
  itemsPedido,
  itemsConProducto,
  platosAgrupados,
  hayProductoSeleccionado,
  totalPedido,
  cliente,
  telefono,
  ubicacion,
  comerRestauranteCliente = false,
  tipoPago,
  observaciones,
  errorDatosPedido,
  guardandoPedido,
  clienteEspecialAplicado,
  setClienteEspecialAplicado,
  setCliente,
  setTelefono,
  setUbicacion,
  setComerRestauranteCliente,
  setTipoPago,
  setObservaciones,
  setErrorDatosPedido,
  cambiarPlatoItem,
  cambiarAcompananteItem,
  actualizarItem,
  agregarAlmuerzo,
  eliminarAlmuerzo,
  reiniciarPedido,
  irAElemento,
  registrarPedido,
}) {
  const [mostrarAlertaRafiki, modalAlertaRafiki] = useAlertaRafiki();

  const obtenerItemsSinMinimoAcompanantes = () => itemsPedido
    .filter((item) => item.plato || item.proteina)
    .filter((item) => !esProductoSinAcompanantes(item))
    .filter((item) => !Array.isArray(item.acompanantes) || item.acompanantes.length < 2);

  const mostrarAlertaMinimoAcompanantes = (itemsSinMinimo) => {
    const primerItem = itemsSinMinimo[0];
    const nombreProducto = primerItem?.plato || primerItem?.proteina || "este producto";

    mostrarAlertaRafiki({
      tipo: "advertencia",
      titulo: "Faltan acompañantes",
      mensaje: `Debes seleccionar mínimo 2 acompañantes para ${nombreProducto}.\nPor favor completa los acompañantes antes de continuar.`,
      textoCerrar: "Entendido"
    });

    if (primerItem?.id) {
      irAElemento(`paso-acompanantes-${primerItem.id}`);
    }
  };

  const validarMinimoAcompanantesCliente = () => {
    const itemsSinMinimo = obtenerItemsSinMinimoAcompanantes();

    if (itemsSinMinimo.length === 0) return true;

    mostrarAlertaMinimoAcompanantes(itemsSinMinimo);
    return false;
  };

  const irAResumenSiCumpleAcompanantes = () => {
    if (!validarMinimoAcompanantesCliente()) return;
    irAElemento("resumen-pedido");
  };

  const irADatosSiCumpleAcompanantes = () => {
    if (!validarMinimoAcompanantesCliente()) return;
    irAElemento("paso-datos-entrega");
  };

  const registrarPedidoSiCumpleAcompanantes = () => {
    if (!validarMinimoAcompanantesCliente()) return;
    registrarPedido();
  };

  return (
<main className="layout">
              <section className="card" id="inicio-pedido-cliente">
                <div className="hero">
                  <p>{menu.fecha}</p>
                  <h2>{menu.titulo}</h2>
                  <p>{menu.descripcion}</p>
                </div>

                <div className="section">
                  <CodigoClienteEspecial
                    clienteEspecialAplicado={clienteEspecialAplicado}
                    setClienteEspecialAplicado={setClienteEspecialAplicado}
                    setCliente={setCliente}
                    setTelefono={setTelefono}
                    setUbicacion={setUbicacion}
                    setComerRestauranteCliente={setComerRestauranteCliente}
                    setErrorDatosPedido={setErrorDatosPedido}
                  />

                  {cargandoMenu ? (
                    <div className="box soft">
                      Cargando menú de hoy...
                    </div>
                  ) : menu.platos_detalle.length === 0 ? (
                    <div className="box soft">
                      Todavía no hay platos configurados para el menú de hoy. Entra al panel administrativo y agrega los platos del día.
                    </div>
                  ) : (
                  <>
                      <div className="u-mb-18">
                        <h3>🛍️ Arma tu pedido paso a paso</h3>
                        <p className="muted">Primero selecciona tu proteína. Luego aparecerán los siguientes pasos.</p>
                      </div>

                      {itemsPedido.map((item, index) => {
                        const itemSinAcompanantes = esProductoSinAcompanantes(item);
                        const acompanantesItem = Array.isArray(item.acompanantes) ? item.acompanantes : [];
                        const tienePlato = Boolean(item.plato || item.proteina);
                        const tieneAcompanantes = itemSinAcompanantes || acompanantesItem.length > 0;

                        const pasos = itemSinAcompanantes
                          ? ["Producto", "Datos"]
                          : ["Producto", "Acomp.", "Datos"];
                        const pasoActual = !tienePlato ? 0 : !tieneAcompanantes ? 1 : pasos.length - 1;

                        return (
                          <div key={item.id} id={`producto-${item.id}`} className="meal-card">
                            <div className="row">
                              <h3>Producto #{index + 1}</h3>

                              {itemsPedido.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => eliminarAlmuerzo(item.id)}
                                  className="button danger"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>

                            <div className="progress-bar-wrap">
                              {pasos.map((nombre, i) => (
                                <div key={`barra-${nombre}`} className={`progress-step ${i <= pasoActual ? "done" : ""}`} />
                              ))}
                            </div>
                            <div className="progress-labels">
                              {pasos.map((nombre, i) => (
                                <span key={`etiqueta-${nombre}`} className={`progress-label ${i <= pasoActual ? "done" : ""}`}>{nombre}</span>
                              ))}
                            </div>

                            <div className="step-title">
                              <span className="step-number">1</span>
                              <div>
                                <h4>Primero selecciona tu proteína</h4>
                                <p className="muted u-mb-0">
                                  Toca una opción para continuar.
                                </p>
                              </div>
                            </div>

                            {tienePlato && (
                              <div className="selected-dish">
                                Seleccionado: {item.plato || item.proteina} —{" "}
                                {dinero(item.precioPlato || item.precioProteina)}
                              </div>
                            )}

                            {Object.entries(platosAgrupados).map(([categoria, platos]) => (
                              <div key={categoria} className="category-block">
                                <h3 className="category-title">{categoria}</h3>

                                <div className="option-grid">
                                  {platos.map((plato) => (
                                    <button
                                      key={`${plato.categoria}-${plato.nombre}`}
                                      type="button"
                                      onClick={() => cambiarPlatoItem(item.id, plato)}
                                      className={`option ${item.plato === plato.nombre ? "selected" : ""}`}
                                    >
                                      <div>{plato.nombre}</div>
                                      <small>{dinero(plato.precio)}</small>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {tienePlato && !itemSinAcompanantes && (
                              <div id={`paso-acompanantes-${item.id}`} className="fade-step u-mt-18">
                                <div className="step-title">
                                  <span className="step-number">2</span>
                                  <div>
                                    <h4>Escoge tus acompañantes</h4>
                                    <p className="muted u-mb-0">
                                      Selecciona hasta {MAX_ACOMPANANTES_CLIENTE} opciones para completar tu almuerzo.
                                    </p>
                                  </div>
                                </div>

                                <div className="chips">
                                  {menu.acompanantes.length === 0 ? (
                                    <span className="muted">No hay acompañantes configurados.</span>
                                  ) : (
                                    menu.acompanantes.map((acompanante) => {
                                      const seleccionado = acompanantesItem.includes(acompanante);
                                      const bloqueado =
                                        !seleccionado &&
                                        acompanantesItem.length >= MAX_ACOMPANANTES_CLIENTE;

                                      return (
                                        <button
                                          key={acompanante}
                                          type="button"
                                          onClick={() => cambiarAcompananteItem(item.id, acompanante)}
                                          disabled={bloqueado}
                                          className={`chip ${seleccionado ? "selected" : ""} ${
                                            bloqueado ? "blocked" : ""
                                          }`}
                                        >
                                          {seleccionado ? "✓ " : "+ "}
                                          {acompanante}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="box compact-info u-mt-12">
                                  <strong>🥣 Sopa y bebida incluida</strong>
                                </div>
                              </div>
                            )}

                            {tienePlato && itemSinAcompanantes && (
                              <div className="box soft fade-step u-mt-18">
                                <strong>🥣 Producto de sopas</strong>
                                <p className="muted u-mb-0">
                                  Este producto no requiere acompañantes.
                                </p>
                              </div>
                            )}

                            {tienePlato && (
                              <div id={`paso-cantidad-${item.id}`} className="fade-step pedido-paso-compacto u-mt-12">
                                <div className="box compact-box quantity-box">
                                  <strong>Cantidad de {item.plato || item.proteina || "proteína escogida"}</strong>
                                  <SelectorCantidad
                                    cantidad={item.cantidad}
                                    onChange={(cantidad) => actualizarItem(item.id, { cantidad })}
                                  />
                                </div>

                                {!itemSinAcompanantes && (
                                  <CampoTexto
                                    etiqueta="Observación sobre tus acompañantes"
                                    value={item.observacionAcompanantes || ""}
                                    onChange={(valor) => actualizarItem(item.id, { observacionAcompanantes: valor })}
                                    placeholder="Ejemplo: sin ensalada, más arroz..."
                                    multiline
                                    rows={2}
                                    maxLength={60}
                                  />
                                )}

                                <label className="box row compact-box takeout-box">
                                  <div>
                                    <strong>🥡 Para llevar</strong>
                                    <p className="muted u-mb-0">
                                      {comerRestauranteCliente
                                        ? "No aplica si comes en el restaurante"
                                        : valorParaLlevarItem({ ...item, paraLlevar: true }) === 0
                                          ? "Sin costo adicional"
                                          : `Suma ${dinero(valorParaLlevarItem({ ...item, paraLlevar: true }))}`}
                                    </p>
                                  </div>

                                  <input
                                    type="checkbox"
                                    checked={!comerRestauranteCliente}
                                    disabled
                                    readOnly
                                    className="u-icon-sm"
                                  />
                                </label>

                                <div className="total-row compact-total-row">
                                  <span>Subtotal</span>
                                  <strong>{dinero(calcularTotalItem(item))}</strong>
                                </div>

                                <button
                                  type="button"
                                  className="button continue-button"
                                  onClick={irAResumenSiCumpleAcompanantes}
                                >
                                  Ver resumen y continuar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button type="button" onClick={agregarAlmuerzo} className="button add-meal">
                        + Agregar otro almuerzo o producto
                      </button>
                    </>
                  )}
                </div>
              </section>

              <aside className="card card-pad fade-step" id="resumen-pedido">
                <h2>{hayProductoSeleccionado ? "Resumen del pedido" : "Resumen"}</h2>

                {!hayProductoSeleccionado ? (
                  <div className="box soft">
                    <strong>👈 Empieza seleccionando una proteína</strong>
                    <p className="muted u-mb-0">
                      Cuando selecciones un producto, aquí aparecerá el resumen y los datos de entrega.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="muted">Revisa tu pedido antes de finalizar.</p>

                    <div className="box soft u-mb-12">
                      <h3>Resumen del pedido</h3>

                      {itemsPedido
                        .filter((item) => item.plato || item.proteina)
                        .map((item) => {
                          const itemSinAcompanantes = esProductoSinAcompanantes(item);
                          const acompanantesItem = Array.isArray(item.acompanantes) ? item.acompanantes : [];

                          return (
                            <div key={item.id} className="summary-item">
                              <div className="summary-item-header">
                                <p>
                                  <strong>{item.cantidad} x {item.plato || item.proteina}</strong> - {" "}
                                  {dinero(item.precioPlato || item.precioProteina)}
                                </p>
                                <button
                                  type="button"
                                  className="mini-danger"
                                  onClick={() => eliminarAlmuerzo(item.id)}
                                  aria-label={`Borrar ${item.plato || item.proteina || "producto"} del pedido`}
                                >
                                  Borrar
                                </button>
                              </div>

                              {item.categoria && <p>Categoría: {item.categoria}</p>}

                              {!itemSinAcompanantes && <p>{acompanantesItem.join(", ") || "Sin acompañantes"}</p>}
                              {!itemSinAcompanantes && item.observacionAcompanantes?.trim() && (
                                <p>Obs. acompañantes: {item.observacionAcompanantes.trim()}</p>
                              )}
                              {itemSinAcompanantes && <p>Acompañantes: No aplica</p>}

                              {!itemSinAcompanantes && <p>Sopa + bebida incluida</p>}

                              <p>{textoParaLlevarItem(item)}</p>
                            </div>
                          );
                        })}

                      <div className="total-row">
                        <span>Total</span>
                        <strong>{dinero(totalPedido)}</strong>
                      </div>
                    </div>


                    <button
                      type="button"
                      onClick={irADatosSiCumpleAcompanantes}
                      className="button continue-button"
                    >
                      Continuar
                    </button>

                    <button type="button" onClick={reiniciarPedido} className="button light small-reset">
                      Borrar y volver a empezar
                    </button>

                    <div id="paso-datos-entrega" className="step-title u-mt-18">
                      <span className="step-number">3</span>
                      <div>
                        <h4>Datos de entrega</h4>
                        <p className="muted u-mb-0">
                          Así sabremos a dónde llevar tu pedido.
                        </p>
                      </div>
                    </div>

                    <CampoTexto
                      etiqueta="👤 Nombre"
                      value={cliente}
                      onChange={(valor) => {
                        setCliente(valor);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: Laura Pérez"
                    />

                    <CampoTexto
                      etiqueta="📞 Teléfono"
                      value={telefono}
                      onChange={(valor) => {
                        setTelefono(valor);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: 300 123 4567"
                    />

                    <label className="field cliente-restaurante-toggle">
                      <span>🍽️ Comer en el restaurante</span>
                      <label className="inline-check cliente-restaurante-check">
                        <input
                          type="checkbox"
                          checked={comerRestauranteCliente}
                          onChange={(e) => {
                            const marcado = e.target.checked;
                            setComerRestauranteCliente?.(marcado);
                          }}
                        />
                        <span>Registrar este pedido para comer en el restaurante</span>
                      </label>
                      {comerRestauranteCliente ? (
                        <small className="muted">Se guardará internamente como mesa 5A, con ubicación “Comer en restaurante”, y sin recargo de para llevar.</small>
                      ) : null}
                    </label>

                    <CampoTexto
                      etiqueta="📍 Ubicación"
                      value={comerRestauranteCliente ? "Comer en restaurante" : ubicacion}
                      onChange={(valor) => {
                        setUbicacion(valor);
                        if (comerRestauranteCliente) setComerRestauranteCliente?.(false);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}
                      placeholder="Ej: Edificio, oficina o barrio"
                    />

                    <label className="field">
                      <span>💳 Tipo de pago</span>
                      <select value={tipoPago} onChange={(e) => {
                        setTipoPago(e.target.value);
                        if (errorDatosPedido) setErrorDatosPedido("");
                      }}>
                        <option value="">Selecciona una forma de pago</option>
                        {FORMAS_PAGO_CLIENTE.map((metodo) => (
                          <option key={metodo} value={metodo}>{metodo}</option>
                        ))}
                      </select>
                    </label>

                    <CampoTexto
                      etiqueta="Observaciones generales"
                      value={observaciones}
                      onChange={setObservaciones}
                      placeholder="Ej: llevar a recepción, sin cubiertos, pago en efectivo..."
                      multiline
                      maxLength={80}
                    />

                    {hayProductoSeleccionado && (
                      <div className="sticky-total">
                        <div>
                          <div className="sticky-total-label">Total</div>
                          <div className="sticky-total-amount">{dinero(totalPedido)}</div>
                        </div>
                        <div className="finalizar-area">
                          {errorDatosPedido && (
                            <div className="finalizar-error" role="alert" aria-live="polite">{errorDatosPedido}</div>
                          )}

                          <button
                            type="button"
                            onClick={registrarPedidoSiCumpleAcompanantes}
                            disabled={guardandoPedido || itemsConProducto.length === 0}
                            className="button pedido-cliente-submit"
                          >
                            {guardandoPedido ? "Guardando..." : "Enviar a cocina →"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </aside>
              {modalAlertaRafiki}
            </main>
  );
}
