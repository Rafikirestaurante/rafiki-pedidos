import React, { useMemo, useState } from "react";
import {
  calcularTotalItem,
  calcularTotalItems,
  crearItemCafeteria,
  crearItemNuevo,
  dinero,
  esCategoriaSopa,
  limpiarAcompanantesCliente,
  limpiarTexto,
  obtenerCodigoPedido,
  precioPorNombre,
  textoParaLlevarItem,
  valorParaLlevarItem
} from "../utils/pedidos";
import { MAX_ACOMPANANTES_CLIENTE } from "../data/menuAlmuerzos";
import { CampoTexto } from "./common";
import {
  CAFETERIA_ACOMPANANTES_DESAYUNO,
  CAFETERIA_BEBIDAS_DESAYUNO,
  CAFETERIA_ADICIONALES_DESAYUNO,
  CAFETERIA_BATIDOS_BASES,
  CAFETERIA_BATIDOS_CREMOSOS_SABORES,
  CAFETERIA_BATIDOS_CREMOSOS_TAMANOS,
  CAFETERIA_BATIDOS_REFRESCANTES_SABORES,
  CAFETERIA_BATIDOS_REFRESCANTES_TAMANOS,
  CAFETERIA_BEBIDAS_CALIENTES,
  CAFETERIA_DESAYUNOS,
  CAFETERIA_OTROS_DESAYUNOS,
  CAFETERIA_FRUTAS,
  CAFETERIA_JUGOS_BASES,
  CAFETERIA_JUGOS_TRADICIONALES_SABORES,
  CAFETERIA_PARFAIT_TAMANOS,
  CAFETERIA_POSTRES,
  CAFETERIA_SANDWICHES
} from "../data/menuCafeteria";
import { SelectorCantidad } from "./common";

function irAElementoMesas(id, delay = 180, block = "start") {
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      const elemento = document.getElementById(id);
      if (!elemento) return;
      elemento.scrollIntoView({ behavior: "smooth", block, inline: "nearest" });
    });
  }, delay);
}

function vibracionCortaMesas() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(18);
  }
}

export default function PanelMesasPOS({ menu, platosAgrupados, guardandoPedido, onEnviar }) {
  const [itemsMesa, setItemsMesa] = useState([crearItemNuevo()]);
  const [mesaLocal, setMesaLocal] = useState("");
  const [modoLlevar, setModoLlevar] = useState(false);
  const [clienteLlevar, setClienteLlevar] = useState("");
  const [telefonoLlevar, setTelefonoLlevar] = useState("");
  const [ubicacionLlevar, setUbicacionLlevar] = useState("");
  const [meseroLocal, setMeseroLocal] = useState("");
  const [tipoPagoMesa, setTipoPagoMesa] = useState("Efectivo");
  const [observacionesLocal, setObservacionesLocal] = useState("");
  const [errorMesa, setErrorMesa] = useState("");
  const [categoriaActivaMesa, setCategoriaActivaMesa] = useState("almuerzos");
  const [subcategoriaCafeteria, setSubcategoriaCafeteria] = useState("parfait");
  const [tamanoParfait, setTamanoParfait] = useState("");
  const [frutasParfait, setFrutasParfait] = useState([]);
  const [tipoBatido, setTipoBatido] = useState("");
  const [saborBatido, setSaborBatido] = useState("");
  const [tamanoBatido, setTamanoBatido] = useState("");
  const [baseBatido, setBaseBatido] = useState("");
  const [desayunoSeleccionado, setDesayunoSeleccionado] = useState("");
  const [acompananteDesayuno, setAcompananteDesayuno] = useState("");
  const [bebidaDesayuno, setBebidaDesayuno] = useState("");
  const [adicionalesDesayuno, setAdicionalesDesayuno] = useState([]);
  const [sandwichSeleccionado, setSandwichSeleccionado] = useState("");
  const [bebidaCalienteSeleccionada, setBebidaCalienteSeleccionada] = useState("");
  const [postreSeleccionado, setPostreSeleccionado] = useState("");
  const [pedidoMesaConfirmado, setPedidoMesaConfirmado] = useState(null);
  const [cantidadCafeteria, setCantidadCafeteria] = useState(1);

  const itemsAlmuerzoMesa = useMemo(
    () => itemsMesa.filter((item) => item.categoria !== "cafeteria"),
    [itemsMesa]
  );

  const itemsConProducto = useMemo(
    () => itemsMesa.filter((item) => item.plato || item.proteina || item.producto),
    [itemsMesa]
  );
  const hayProductoSeleccionadoMesa = itemsConProducto.length > 0;
  const total = useMemo(() => calcularTotalItems(itemsConProducto), [itemsConProducto]);
  const itemAlmuerzoActivo = itemsAlmuerzoMesa[itemsAlmuerzoMesa.length - 1];

  function actualizarItemMesa(id, cambios) {
    setItemsMesa((actual) =>
      actual.map((item) => (item.id === id ? { ...item, ...cambios } : item))
    );
  }

  function cambiarPlatoMesa(id, platoSeleccionado) {
    vibracionCortaMesas();
    setItemsMesa((actual) =>
      actual.map((item) => {
        if (item.id !== id) return item;

        const esSopa = esCategoriaSopa(platoSeleccionado.categoria);

        return {
          ...item,
          categoria: platoSeleccionado.categoria || "",
          plato: platoSeleccionado.nombre || "",
          proteina: platoSeleccionado.nombre || "",
          precioPlato: Number(platoSeleccionado.precio) || 0,
          precioProteina: Number(platoSeleccionado.precio) || 0,
          acompanantes: esSopa ? [] : item.acompanantes || [],
          observacionAcompanantes: esSopa ? "" : item.observacionAcompanantes || "",
          paraLlevar: false
        };
      })
    );

    const esSopa = esCategoriaSopa(platoSeleccionado.categoria);

    irAElementoMesas(esSopa ? `mesa-confirmacion-${id}` : `mesa-paso-acompanantes-${id}`, 180, "center");
  }

  function cambiarAcompananteMesa(id, acompanante) {
    vibracionCortaMesas();
    setItemsMesa((actual) =>
      actual.map((item) => {
        if (item.id !== id) return item;

        if (esCategoriaSopa(item.categoria)) {
          return { ...item, acompanantes: [] };
        }

        const acompanantesActuales = Array.isArray(item.acompanantes) ? item.acompanantes : [];
        const seleccionado = acompanantesActuales.includes(acompanante);

        if (seleccionado) {
          return {
            ...item,
            acompanantes: acompanantesActuales.filter((x) => x !== acompanante)
          };
        }

        if (acompanantesActuales.length >= MAX_ACOMPANANTES_CLIENTE) {
          return item;
        }

        const nuevosAcompanantes = [...acompanantesActuales, acompanante];

        return { ...item, acompanantes: nuevosAcompanantes };
      })
    );
  }

  function agregarAlmuerzoMesa() {
    const nuevoItem = crearItemNuevo();
    vibracionCortaMesas();
    setItemsMesa((actual) => [...actual, nuevoItem]);

    setTimeout(() => {
      const elemento = document.getElementById(`mesa-producto-${nuevoItem.id}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  }

  function agregarAlmuerzoRapidoYSiguiente() {
    agregarAlmuerzoMesa();
  }

  function quitarAlmuerzoMesa(id) {
    setItemsMesa((actual) => {
      const filtrados = actual.filter((item) => item.id !== id);
      return filtrados.length > 0 ? filtrados : [crearItemNuevo()];
    });
  }

  function reiniciarPedidoMesa() {
    setItemsMesa([crearItemNuevo()]);
    setMesaLocal("");
    setModoLlevar(false);
    setClienteLlevar("");
    setTelefonoLlevar("");
    setUbicacionLlevar("");
    setMeseroLocal("");
    setTipoPagoMesa("Efectivo");
    setObservacionesLocal("");
    setErrorMesa("");

    // Limpia también los selectores de cafetería para evitar que el siguiente pedido
    // herede tamaño, cereal, frutas o adicionales del pedido anterior.
    setTamanoParfait("");
    setFrutasParfait([]);
    setTipoBatido("");
    setSaborBatido("");
    setTamanoBatido("");
    setBaseBatido("");
    setDesayunoSeleccionado("");
    setAcompananteDesayuno("");
    setBebidaDesayuno("");
    setAdicionalesDesayuno([]);
    setSandwichSeleccionado("");
    setBebidaCalienteSeleccionada("");
    setPostreSeleccionado("");
    setCantidadCafeteria(1);
    setPedidoMesaConfirmado(null);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
  }

  function limpiarSeleccionCafeteria() {
    // Al agregar un producto de cafetería, limpiamos todos los selectores
    // para que el siguiente producto empiece desde cero y no parezca seleccionado.
    setTamanoParfait("");
    setFrutasParfait([]);
    setTipoBatido("");
    setSaborBatido("");
    setTamanoBatido("");
    setBaseBatido("");
    setDesayunoSeleccionado("");
    setAcompananteDesayuno("");
    setBebidaDesayuno("");
    setAdicionalesDesayuno([]);
    setSandwichSeleccionado("");
    setBebidaCalienteSeleccionada("");
    setPostreSeleccionado("");
    setCantidadCafeteria(1);
  }

  function agregarItemCafeteria(item, destino = "categorias") {
    vibracionCortaMesas();
    setItemsMesa((actual) => [...actual, item]);
    limpiarSeleccionCafeteria();
    setErrorMesa("");
    irAElementoMesas(destino === "resumen" ? "mesa-confirmacion-final" : "mesa-categorias-top", 120, "start");
  }

  function toggleFrutaParfait(fruta) {
    setFrutasParfait((actual) => {
      if (actual.includes(fruta)) return actual.filter((item) => item !== fruta);
      if (actual.length >= 3) return actual;
      return [...actual, fruta];
    });
  }

  function toggleAdicionalDesayuno(adicional) {
    setAdicionalesDesayuno((actual) => {
      const existe = actual.some((item) => item.nombre === adicional.nombre);
      return existe ? actual.filter((item) => item.nombre !== adicional.nombre) : [...actual, adicional];
    });
  }

  function agregarParfaitMesa(destino = "categorias") {
    if (!tamanoParfait) {
      setErrorMesa("Selecciona el tamaño del parfait.");
      return;
    }

    if (frutasParfait.length === 0) {
      setErrorMesa("Selecciona al menos una fruta para el parfait.");
      return;
    }

    const precioBase = precioPorNombre(CAFETERIA_PARFAIT_TAMANOS, tamanoParfait);
    const extraFrutas = frutasParfait.length === 3 ? 1000 : 0;
    const frutasSeleccionadas = [...frutasParfait];
    const descripcionParfait = `Parfait ${tamanoParfait} - Frutas: ${frutasSeleccionadas.join(", ")}`;

    agregarItemCafeteria(crearItemCafeteria({
      tipo: "Parfait",
      producto: descripcionParfait,
      precio: precioBase + extraFrutas,
      cantidad: cantidadCafeteria,
      tamano: tamanoParfait,
      frutas: frutasSeleccionadas,
      extraFrutas,
      detalle_impresion: descripcionParfait
    }), destino);

    setFrutasParfait([]);
  }

  function cambiarTipoBatidoMesa(tipo) {
    setTipoBatido(tipo);
    setSaborBatido("");
    setTamanoBatido("");
    setBaseBatido("");
    setErrorMesa("");
  }

  function agregarBatidoMesa(destino = "categorias") {
    if (!tipoBatido) {
      setErrorMesa("Selecciona el tipo de bebida.");
      return;
    }

    if (!saborBatido) {
      setErrorMesa("Selecciona el sabor.");
      return;
    }

    if (!tamanoBatido) {
      setErrorMesa("Selecciona el tamaño.");
      return;
    }

    if ((tipoBatido === "cremoso" || tipoBatido === "jugo") && !baseBatido) {
      setErrorMesa("Selecciona la base.");
      return;
    }

    const tamanos = tipoBatido === "cremoso"
      ? CAFETERIA_BATIDOS_CREMOSOS_TAMANOS
      : CAFETERIA_BATIDOS_REFRESCANTES_TAMANOS;
    const precio = precioPorNombre(tamanos, tamanoBatido);
    const nombreTipo = tipoBatido === "cremoso"
      ? "Batido cremoso"
      : tipoBatido === "refrescante"
        ? "Batido refrescante"
        : "Jugo tradicional";

    agregarItemCafeteria(crearItemCafeteria({
      tipo: nombreTipo,
      producto: `${saborBatido} ${tamanoBatido}`,
      precio,
      cantidad: cantidadCafeteria,
      tamano: tamanoBatido,
      base: baseBatido
    }), destino);
  }

  function agregarDesayunoMesa(destino = "categorias") {
    if (!desayunoSeleccionado) {
      setErrorMesa("Selecciona un desayuno.");
      return;
    }

    const desayunoPrincipal = CAFETERIA_DESAYUNOS.some((item) => item.nombre === desayunoSeleccionado);
    if (desayunoPrincipal && !acompananteDesayuno) {
      setErrorMesa("Selecciona el acompañante del desayuno.");
      return;
    }

    if (desayunoPrincipal && !bebidaDesayuno) {
      setErrorMesa("Selecciona la bebida del desayuno.");
      return;
    }

    const precioBase = precioPorNombre([...CAFETERIA_DESAYUNOS, ...CAFETERIA_OTROS_DESAYUNOS], desayunoSeleccionado);
    const precioAdicionales = adicionalesDesayuno.reduce((suma, item) => suma + Number(item.precio || 0), 0);

    agregarItemCafeteria(crearItemCafeteria({
      tipo: "Desayuno",
      producto: desayunoSeleccionado,
      precio: precioBase + precioAdicionales,
      cantidad: cantidadCafeteria,
      acompanante: acompananteDesayuno,
      bebida: bebidaDesayuno,
      adicionales: adicionalesDesayuno
    }), destino);

    setBebidaDesayuno("");
    setAdicionalesDesayuno([]);
  }

  function agregarProductoSimpleCafeteria(tipo, producto, precio, destino = "categorias") {
    if (!producto) {
      setErrorMesa(`Selecciona un producto de ${tipo}.`);
      return;
    }

    agregarItemCafeteria(crearItemCafeteria({
      tipo,
      producto,
      precio,
      cantidad: cantidadCafeteria
    }), destino);
  }

  function seleccionarCategoriaMesa(categoria) {
    vibracionCortaMesas();
    setCategoriaActivaMesa(categoria);
    setErrorMesa("");
    irAElementoMesas("mesa-categorias-top", 80, "start");
  }

  async function enviarPedidoMesa() {
    if (itemsConProducto.length === 0) {
      setErrorMesa("Agrega al menos un producto.");
      return;
    }

    if (!modoLlevar && !mesaLocal.trim()) {
      setErrorMesa("Selecciona la mesa.");
      return;
    }

    if (!meseroLocal.trim()) {
      setErrorMesa("Selecciona el mesero.");
      return;
    }

    const pedidoGuardado = await onEnviar({
      items: itemsConProducto,
      modoLlevar,
      mesa: modoLlevar ? "Llevar" : mesaLocal,
      cliente: clienteLlevar,
      telefono: telefonoLlevar,
      ubicacion: ubicacionLlevar,
      mesero: meseroLocal,
      tipoPago: tipoPagoMesa,
      observaciones: observacionesLocal
    });

    if (pedidoGuardado) {
      setPedidoMesaConfirmado(pedidoGuardado);
    }
  }

  if (pedidoMesaConfirmado) {
    return (
      <main className="confirmacion-simple-mesa">
        <section className="card confirmacion-restaurante">
          <div className="hero green">
            <div className="confirmacion-check">✓</div>
            <h2>Pedido #{obtenerCodigoPedido(pedidoMesaConfirmado)} enviado a cocina</h2>
            <p>El pedido fue registrado correctamente.</p>
          </div>
          <div className="card-pad" style={{ textAlign: "center" }}>
            <div className="confirmacion-ok">{modoLlevar ? "Llevar" : "Mesa"}: {pedidoMesaConfirmado.mesa || pedidoMesaConfirmado.cliente || mesaLocal}</div>
            <button type="button" onClick={reiniciarPedidoMesa} className="button green" style={{ width: "100%", maxWidth: 340 }}>
              Hacer otro pedido
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="order-layout mesas-cliente-layout">
      <section className="card card-pad" id="mesa-categorias-top">
        <div className="mesa-panel-title">
          <h2>🍽️ Panel Mesas</h2>
        </div>

        <div className="mesas-tabs" aria-label="Categorías del panel mesas">
          <button
            type="button"
            onClick={() => seleccionarCategoriaMesa("almuerzos")}
            className={`mesas-tab ${categoriaActivaMesa === "almuerzos" ? "active" : ""}`}
          >
            <span>🍛</span>
            <strong>Almuerzos</strong>
          </button>

          <button
            type="button"
            onClick={() => seleccionarCategoriaMesa("cafeteria")}
            className={`mesas-tab cafeteria ${categoriaActivaMesa === "cafeteria" ? "active" : ""}`}
          >
            <span>☕</span>
            <strong>Cafetería</strong>
          </button>
        </div>

        {categoriaActivaMesa === "almuerzos" ? (
          menu.platos_detalle.length === 0 ? (
            <div className="box soft">No hay menú diario configurado.</div>
          ) : (
            <>
              {itemsAlmuerzoMesa.map((item, index) => {
              const tienePlato = Boolean(item.plato || item.proteina);
              const itemEsSopa = esCategoriaSopa(item.categoria);
              const acompanantesItem = Array.isArray(item.acompanantes) ? item.acompanantes : [];
              const acompanantesMesaDisponibles = ["Con todo", ...menu.acompanantes.filter((acompanante) => acompanante !== "Con todo")];
              const tieneAcompanantes = itemEsSopa || acompanantesItem.length > 0;
              return (
                <div key={item.id} id={`mesa-producto-${item.id}`} className="product-card">
                  {itemsAlmuerzoMesa.length > 1 && (
                    <div className="product-card-header" style={{ justifyContent: "flex-end" }}>
                      <button type="button" className="mini-danger" onClick={() => quitarAlmuerzoMesa(item.id)}>
                        Quitar
                      </button>
                    </div>
                  )}

                  <div className="step-title">
                    <span className="step-number">1</span>
                    <div>
                      <h4>Escoge la proteína</h4>
                    </div>
                  </div>

                  {tienePlato && (
                    <div className="selected-dish pos-selected-dish">
                      <span>✓ {item.plato || item.proteina}</span>
                      <strong>{dinero(item.precioPlato || item.precioProteina)}</strong>
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
                            onClick={() => cambiarPlatoMesa(item.id, plato)}
                            className={`option ${item.plato === plato.nombre ? "selected" : ""}`}
                          >
                            <div>{plato.nombre}</div>
                            <small>{dinero(plato.precio)}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {tienePlato && !itemEsSopa && (
                    <div id={`mesa-paso-acompanantes-${item.id}`} className="fade-step" style={{ marginTop: 18 }}>
                      <div className="step-title">
                        <span className="step-number">2</span>
                        <div>
                          <h4>Escoge un acompañante</h4>
                        </div>
                      </div>

                      <div className="chips">
                        {acompanantesMesaDisponibles.length === 0 ? (
                          <span className="muted">No hay acompañantes configurados.</span>
                        ) : (
                          acompanantesMesaDisponibles.map((acompanante) => {
                            const seleccionado = acompanantesItem.includes(acompanante);
                            const bloqueado =
                              !seleccionado && acompanantesItem.length >= MAX_ACOMPANANTES_CLIENTE;

                            return (
                              <button
                                key={acompanante}
                                type="button"
                                onClick={() => cambiarAcompananteMesa(item.id, acompanante)}
                                disabled={bloqueado}
                                className={`chip ${seleccionado ? "selected" : ""} ${bloqueado ? "blocked" : ""}`}
                              >
                                {seleccionado ? "✓ " : "+ "}{acompanante}
                              </button>
                            );
                          })
                        )}
                      </div>

                    </div>
                  )}

                  {tienePlato && itemEsSopa && (
                    <div className="box soft fade-step" style={{ marginTop: 18 }}>
                      <strong>🥣 Producto de sopas</strong>
                    </div>
                  )}

                  {tienePlato && (
                    <div id={`mesa-confirmacion-${item.id}`} className="fade-step pedido-paso-compacto" style={{ marginTop: 12 }}>
                      <div className="box compact-box quantity-box">
                        <strong>Cantidad de {item.plato || item.proteina || "producto"}</strong>
                        <SelectorCantidad
                          cantidad={item.cantidad}
                          onChange={(cantidad) => actualizarItemMesa(item.id, { cantidad })}
                        />
                      </div>

                      {!itemEsSopa && (
                        <CampoTexto
                          etiqueta="Observación sobre acompañantes"
                          value={item.observacionAcompanantes || ""}
                          onChange={(valor) => actualizarItemMesa(item.id, { observacionAcompanantes: valor })}
                          placeholder="Ejemplo: sin ensalada, más arroz..."
                          multiline
                          rows={2}
                        />
                      )}

                      <div className="total-row compact-total-row">
                        <span>Subtotal</span>
                        <strong>{dinero(calcularTotalItem(item))}</strong>
                      </div>

                      <div className="pos-next-hint">Listo: puedes agregar otro almuerzo o continuar a datos de mesa.</div>
                    </div>
                  )}
                </div>
              );
            })}

            {hayProductoSeleccionadoMesa && (
              <>
                <button type="button" onClick={agregarAlmuerzoRapidoYSiguiente} className="button add-meal pos-primary-action" style={{ marginTop: 14 }}>
                  +agregar otro producto
                </button>

                <button
                  type="button"
                  onClick={() => irAElementoMesas("mesa-confirmacion-final", 120)}
                  className="button continue-button"
                  style={{ marginTop: 12, background: "#16a34a" }}
                >
                  agregar y continuar
                </button>
              </>
            )}
            </>
          )
        ) : (
          <div className="cafeteria-placeholder fade-step">
            <div className="cafeteria-grid cafeteria-actions compact-cafeteria-actions">
              {[
                ["parfait", "Parfait"],
                ["batidos", "Batidos"],
                ["desayunos", "Desayunos"],
                ["sandwich", "Comida"],
                ["bebidas", "Bebidas"],
                ["postres", "Postres"]
              ].map(([clave, nombre]) => (
                <button
                  key={clave}
                  type="button"
                  onClick={() => { setSubcategoriaCafeteria(clave); setErrorMesa(""); irAElementoMesas("mesa-cafeteria-panel", 100, "start"); }}
                  className={`cafeteria-card cafeteria-button ${subcategoriaCafeteria === clave ? "active" : ""}`}
                >
                  <strong>{nombre}</strong>
                </button>
              ))}
            </div>

            <div id="mesa-cafeteria-panel" />

            {errorMesa && (
              <div className="finalizar-error" role="alert" aria-live="polite" style={{ marginTop: 10 }}>{errorMesa}</div>
            )}

            {subcategoriaCafeteria === "parfait" && (
              <div className="cafeteria-panel fade-step">
                <h3>Parfait</h3>
                <div className="option-grid">
                  {CAFETERIA_PARFAIT_TAMANOS.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => setTamanoParfait(item.nombre)} className={`option ${tamanoParfait === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>

                <h4>Frutas disponibles</h4>
                <div className="chips">
                  {CAFETERIA_FRUTAS.map((fruta) => {
                    const seleccionado = frutasParfait.includes(fruta);
                    const bloqueado = !seleccionado && frutasParfait.length >= 3;
                    return (
                      <button key={fruta} type="button" disabled={bloqueado} onClick={() => toggleFrutaParfait(fruta)} className={`chip ${seleccionado ? "selected" : ""} ${bloqueado ? "blocked" : ""}`}>
                        {seleccionado ? "✓ " : "+ "}{fruta}
                      </button>
                    );
                  })}
                </div>
                <p className="muted">Máximo 3 frutas. Al escoger 3 frutas se suma automáticamente {dinero(1000)}.</p>


                <div className="box compact-box quantity-box">
                  <strong>Cantidad</strong>
                  <SelectorCantidad
                    cantidad={cantidadCafeteria}
                    onChange={setCantidadCafeteria}
                  />
                </div>

                <div className="total-row compact-total-row">
                  <span>Subtotal parfait</span>
                  <strong>{dinero((precioPorNombre(CAFETERIA_PARFAIT_TAMANOS, tamanoParfait) + (frutasParfait.length === 3 ? 1000 : 0)) * cantidadCafeteria)}</strong>
                </div>
                <button type="button" className="button add-meal" onClick={agregarParfaitMesa}>+agregar otro producto</button>
              </div>
            )}

            {subcategoriaCafeteria === "batidos" && (
              <div className="cafeteria-panel fade-step">
                <h3>Batidos</h3>
                <h4>Tipo</h4>
                <div className="option-grid">
                  {[
                    { clave: "cremoso", nombre: "Batido cremoso" },
                    { clave: "refrescante", nombre: "Batido refrescante" },
                    { clave: "jugo", nombre: "Jugo tradicional" }
                  ].map((item) => (
                    <button key={item.clave} type="button" onClick={() => cambiarTipoBatidoMesa(item.clave)} className={`option ${tipoBatido === item.clave ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                    </button>
                  ))}
                </div>
                {tipoBatido && (
                  <>
                    <h4>Sabor</h4>
                    <div className="chips">
                      {(tipoBatido === "cremoso"
                        ? CAFETERIA_BATIDOS_CREMOSOS_SABORES
                        : tipoBatido === "refrescante"
                          ? CAFETERIA_BATIDOS_REFRESCANTES_SABORES
                          : CAFETERIA_JUGOS_TRADICIONALES_SABORES
                      ).map((sabor) => (
                        <button key={sabor} type="button" onClick={() => setSaborBatido(sabor)} className={`chip ${saborBatido === sabor ? "selected" : ""}`}>{saborBatido === sabor ? "✓ " : "+ "}{sabor}</button>
                      ))}
                    </div>
                    {tipoBatido === "cremoso" && (
                      <>
                        <h4>Base</h4>
                        <div className="chips">
                          {CAFETERIA_BATIDOS_BASES.map((base) => (
                            <button key={base} type="button" onClick={() => setBaseBatido(base)} className={`chip ${baseBatido === base ? "selected" : ""}`}>{baseBatido === base ? "✓ " : "+ "}{base}</button>
                          ))}
                        </div>
                      </>
                    )}
                    {tipoBatido === "jugo" && (
                      <>
                        <h4>Base</h4>
                        <div className="chips">
                          {CAFETERIA_JUGOS_BASES.map((base) => (
                            <button key={base} type="button" onClick={() => setBaseBatido(base)} className={`chip ${baseBatido === base ? "selected" : ""}`}>{baseBatido === base ? "✓ " : "+ "}{base}</button>
                          ))}
                        </div>
                      </>
                    )}
                    <h4>Tamaño</h4>
                    <div className="option-grid">
                      {(tipoBatido === "cremoso" ? CAFETERIA_BATIDOS_CREMOSOS_TAMANOS : CAFETERIA_BATIDOS_REFRESCANTES_TAMANOS).map((item) => (
                        <button key={item.nombre} type="button" onClick={() => setTamanoBatido(item.nombre)} className={`option ${tamanoBatido === item.nombre ? "selected" : ""}`}>
                          <div>{item.nombre}</div>
                          <small>{dinero(item.precio)}</small>
                        </button>
                      ))}
                    </div>

                    <div className="box compact-box quantity-box">
                      <strong>Cantidad</strong>
                      <SelectorCantidad
                        cantidad={cantidadCafeteria}
                        onChange={setCantidadCafeteria}
                      />
                    </div>
                    <button type="button" className="button add-meal" onClick={agregarBatidoMesa}>+agregar otro producto</button>
                  </>
                )}
              </div>
            )}

            {subcategoriaCafeteria === "desayunos" && (
              <div className="cafeteria-panel fade-step">
                <h3>Desayunos</h3>
                <div className="option-grid">
                  {CAFETERIA_DESAYUNOS.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => setDesayunoSeleccionado(item.nombre)} className={`option ${desayunoSeleccionado === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>
                <h4>Acompañante</h4>
                <div className="chips">
                  {CAFETERIA_ACOMPANANTES_DESAYUNO.map((acompanante) => (
                    <button key={acompanante} type="button" onClick={() => setAcompananteDesayuno(acompanante)} className={`chip ${acompananteDesayuno === acompanante ? "selected" : ""}`}>{acompananteDesayuno === acompanante ? "✓ " : "+ "}{acompanante}</button>
                  ))}
                </div>
                <h4>Bebida</h4>
                <div className="chips">
                  {CAFETERIA_BEBIDAS_DESAYUNO.map((bebida) => (
                    <button key={bebida} type="button" onClick={() => setBebidaDesayuno(bebida)} className={`chip ${bebidaDesayuno === bebida ? "selected" : ""}`}>{bebidaDesayuno === bebida ? "✓ " : "+ "}{bebida}</button>
                  ))}
                </div>
                <h4>Otros desayunos</h4>
                <div className="option-grid compact-options">
                  {CAFETERIA_OTROS_DESAYUNOS.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => { setDesayunoSeleccionado(item.nombre); setAcompananteDesayuno(""); setBebidaDesayuno(""); setAdicionalesDesayuno([]); }} className={`option ${desayunoSeleccionado === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>
                <div className="box compact-box quantity-box">
                  <strong>Cantidad</strong>
                  <SelectorCantidad
                    cantidad={cantidadCafeteria}
                    onChange={setCantidadCafeteria}
                  />
                </div>

                <div className="total-row compact-total-row">
                  <span>Subtotal desayuno</span>
                  <strong>{dinero((precioPorNombre([...CAFETERIA_DESAYUNOS, ...CAFETERIA_OTROS_DESAYUNOS], desayunoSeleccionado) + adicionalesDesayuno.reduce((suma, item) => suma + Number(item.precio || 0), 0)) * cantidadCafeteria)}</strong>
                </div>
                <button type="button" className="button add-meal" onClick={agregarDesayunoMesa}>+agregar otro producto</button>
              </div>
            )}

            {subcategoriaCafeteria === "sandwich" && (
              <div className="cafeteria-panel fade-step">
                <h3>Comida</h3>
                <div className="option-grid">
                  {CAFETERIA_SANDWICHES.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => setSandwichSeleccionado(item.nombre)} className={`option ${sandwichSeleccionado === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>

                <div className="box compact-box quantity-box">
                  <strong>Cantidad</strong>
                  <SelectorCantidad
                    cantidad={cantidadCafeteria}
                    onChange={setCantidadCafeteria}
                  />
                </div>
                <button type="button" className="button add-meal" onClick={() => agregarProductoSimpleCafeteria("Comida", sandwichSeleccionado, precioPorNombre(CAFETERIA_SANDWICHES, sandwichSeleccionado))}>+agregar otro producto</button>
              </div>
            )}

            {subcategoriaCafeteria === "bebidas" && (
              <div className="cafeteria-panel fade-step">
                <h3>Bebidas</h3>
                <div className="option-grid">
                  {CAFETERIA_BEBIDAS_CALIENTES.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => setBebidaCalienteSeleccionada(item.nombre)} className={`option ${bebidaCalienteSeleccionada === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>

                <div className="box compact-box quantity-box">
                  <strong>Cantidad</strong>
                  <SelectorCantidad
                    cantidad={cantidadCafeteria}
                    onChange={setCantidadCafeteria}
                  />
                </div>
                <button type="button" className="button add-meal" onClick={() => agregarProductoSimpleCafeteria("Bebida caliente", bebidaCalienteSeleccionada, precioPorNombre(CAFETERIA_BEBIDAS_CALIENTES, bebidaCalienteSeleccionada))}>+agregar otro producto</button>
              </div>
            )}

            {subcategoriaCafeteria === "postres" && (
              <div className="cafeteria-panel fade-step">
                <h3>Postres y frutas</h3>
                <div className="option-grid">
                  {CAFETERIA_POSTRES.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => setPostreSeleccionado(item.nombre)} className={`option ${postreSeleccionado === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>

                <div className="box compact-box quantity-box">
                  <strong>Cantidad</strong>
                  <SelectorCantidad
                    cantidad={cantidadCafeteria}
                    onChange={setCantidadCafeteria}
                  />
                </div>
                <button type="button" className="button add-meal" onClick={() => agregarProductoSimpleCafeteria("Postre", postreSeleccionado, precioPorNombre(CAFETERIA_POSTRES, postreSeleccionado))}>+agregar otro producto</button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (subcategoriaCafeteria === "parfait") agregarParfaitMesa("resumen");
                if (subcategoriaCafeteria === "batidos") agregarBatidoMesa("resumen");
                if (subcategoriaCafeteria === "desayunos") agregarDesayunoMesa("resumen");
                if (subcategoriaCafeteria === "sandwich") agregarProductoSimpleCafeteria("Comida", sandwichSeleccionado, precioPorNombre(CAFETERIA_SANDWICHES, sandwichSeleccionado), "resumen");
                if (subcategoriaCafeteria === "bebidas") agregarProductoSimpleCafeteria("Bebida caliente", bebidaCalienteSeleccionada, precioPorNombre(CAFETERIA_BEBIDAS_CALIENTES, bebidaCalienteSeleccionada), "resumen");
                if (subcategoriaCafeteria === "postres") agregarProductoSimpleCafeteria("Postre", postreSeleccionado, precioPorNombre(CAFETERIA_POSTRES, postreSeleccionado), "resumen");
              }}
              className="button continue-button"
              style={{ marginTop: 12, background: "#16a34a" }}
            >
              agregar y continuar
            </button>
          </div>
        )}
      </section>

      <aside className="card card-pad fade-step" id="mesa-confirmacion-final">
        <h2>{hayProductoSeleccionadoMesa ? "Confirmación" : "Resumen"}</h2>

        {!hayProductoSeleccionadoMesa ? (
          <div className="box soft">
            <strong>👈 Empieza seleccionando una proteína</strong>
          </div>
        ) : (
          <>
            <div className="box soft" style={{ marginBottom: 12 }}>
              <h3>Resumen del pedido</h3>

              {itemsConProducto.map((item) => {
                const itemEsCafeteria = item.categoria === "cafeteria";
                const itemEsSopa = esCategoriaSopa(item.categoria);
                const acompanantesItem = Array.isArray(item.acompanantes) ? item.acompanantes : [];

                return (
                  <div key={item.id} className="summary-item">
                    <p><strong>{item.cantidad} x {item.producto || item.plato || item.proteina}</strong> - {dinero(item.precioPlato || item.precioProteina || item.precio)}</p>
                    {itemEsCafeteria ? (
                      <>
                        <p>Categoría: Cafetería{item.tipo ? ` / ${item.tipo}` : ""}</p>
                        {item.tamano && <p>Tamaño: {item.tamano}</p>}
                        {Array.isArray(item.frutas) && item.frutas.length > 0 && <p>Frutas: {item.frutas.join(", ")}</p>}
                        {Number(item.extraFrutas) > 0 && <p>Extra 3 frutas: {dinero(item.extraFrutas)}</p>}
                        {item.base && <p>Base: {item.base}</p>}
                        {item.acompanante && <p>Acompañante: {item.acompanante}</p>}
                        {Array.isArray(item.adicionales) && item.adicionales.length > 0 && (
                          <p>Adicionales: {item.adicionales.map((x) => x.nombre || x).join(", ")}</p>
                        )}
                      </>
                    ) : (
                      <>
                        {item.categoria && <p>Categoría: {item.categoria}</p>}
                        {!itemEsSopa && <p>{acompanantesItem.join(", ") || "Sin acompañantes"}</p>}
                        {!itemEsSopa && item.observacionAcompanantes?.trim() && (
                          <p>Obs. acompañantes: {item.observacionAcompanantes.trim()}</p>
                        )}
                        {itemEsSopa && <p>Acompañantes: No aplica</p>}
                        {!itemEsSopa && <p>Sopa + bebida incluida</p>}
                      </>
                    )}
                  </div>
                );
              })}

              <div className="total-row">
                <span>Total</span>
                <strong>{dinero(total)}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => irAElementoMesas("mesa-datos-final", 120)}
              className="button continue-button"
              style={{ marginTop: 8, background: "#16a34a" }}
            >
              continuar
            </button>

            <button type="button" onClick={reiniciarPedidoMesa} className="button light small-reset">
              Borrar y volver a empezar
            </button>

            <div id="mesa-datos-final" className="step-title" style={{ marginTop: 18 }}>
              <span className="step-number">3</span>
              <div>
                <h4>Datos de mesa</h4>
              </div>
            </div>

            <div className="mesa-datos-grid">
              <div className="mesa-dato-bloque">
                <h4>🍽️ Mesa o llevar <span className="requerido">*</span></h4>
                <div className={`mesa-selector-grid ${modoLlevar ? "llevar-activo" : ""}`} aria-label="Seleccionar mesa o llevar">
                  <button
                    type="button"
                    onClick={() => {
                      setModoLlevar(false);
                      setMesaLocal("1A");
                      setErrorMesa("");
                    }}
                    className={`option mesa-boton ${!modoLlevar && mesaLocal === "1A" ? "selected" : ""}`}
                    disabled={modoLlevar}
                  >
                    1A
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModoLlevar(false);
                      setMesaLocal("1B");
                      setErrorMesa("");
                    }}
                    className={`option mesa-boton ${!modoLlevar && mesaLocal === "1B" ? "selected" : ""}`}
                    disabled={modoLlevar}
                  >
                    1B
                  </button>
                  {["2A", "2B", "3A", "3B", "4A", "4B", "5B"].map((mesa) => (
                    <button
                      key={mesa}
                      type="button"
                      onClick={() => {
                        setModoLlevar(false);
                        setMesaLocal(mesa);
                        setErrorMesa("");
                      }}
                      className={`option mesa-boton ${mesa === "5B" ? "mesa-5b" : ""} ${!modoLlevar && mesaLocal === mesa ? "selected" : ""}`}
                      disabled={modoLlevar}
                    >
                      {mesa}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setModoLlevar(true);
                      setMesaLocal("");
                      setErrorMesa("");
                    }}
                    className={`option mesa-boton mesa-llevar ${modoLlevar ? "selected" : ""}`}
                  >
                    Llevar
                  </button>
                </div>

                {modoLlevar && (
                  <div className="datos-llevar-grid">
                    <CampoTexto
                      etiqueta="Datos del cliente"
                      value={clienteLlevar}
                      onChange={(valor) => { setClienteLlevar(valor); setErrorMesa(""); }}
                      placeholder="Nombre del cliente"
                    />
                    <CampoTexto
                      etiqueta="Teléfono"
                      value={telefonoLlevar}
                      onChange={(valor) => { setTelefonoLlevar(valor); setErrorMesa(""); }}
                      placeholder="Número de contacto"
                      type="tel"
                    />
                    <CampoTexto
                      etiqueta="Ubicación"
                      value={ubicacionLlevar}
                      onChange={(valor) => { setUbicacionLlevar(valor); setErrorMesa(""); }}
                      placeholder="Dirección o referencia"
                    />
                  </div>
                )}
              </div>

              <div className="mesa-dato-bloque">
                <h4>👤 Mesero <span className="requerido">*</span></h4>
                <div className="chips">
                  {["Rafa", "Ara", "Pao", "Jesús"].map((mesero) => (
                    <button
                      key={mesero}
                      type="button"
                      onClick={() => { setMeseroLocal(mesero); setErrorMesa(""); }}
                      className={`chip ${meseroLocal === mesero ? "selected" : ""}`}
                    >
                      {meseroLocal === mesero ? "✓ " : ""}{mesero}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mesa-dato-bloque">
                <h4>💳 Forma de pago</h4>
                <div className="chips">
                  {["Efectivo", "Transferencia", "Datafono"].map((pago) => (
                    <button
                      key={pago}
                      type="button"
                      onClick={() => setTipoPagoMesa(pago)}
                      className={`chip ${tipoPagoMesa === pago ? "selected" : ""}`}
                    >
                      {tipoPagoMesa === pago ? "✓ " : ""}{pago}
                    </button>
                  ))}
                </div>
              </div>

              <CampoTexto
                etiqueta="Observaciones generales"
                value={observacionesLocal}
                onChange={setObservacionesLocal}
                placeholder="Ej: sin cubiertos, mesa espera bebida..."
                multiline
              />
            </div>

            <div className="sticky-total">
              <div>
                <div className="sticky-total-label">Total</div>
                <div className="sticky-total-amount">{dinero(total)}</div>
              </div>
              <div className="finalizar-area">
                {errorMesa && (
                  <div className="finalizar-error" role="alert" aria-live="polite">{errorMesa}</div>
                )}

                <button
                  type="button"
                  onClick={enviarPedidoMesa}
                  disabled={guardandoPedido || itemsConProducto.length === 0}
                  className="button"
                  style={{ margin: 0, padding: "12px 20px", fontSize: 15 }}
                >
                  {guardandoPedido ? "Guardando..." : "Enviar a cocina →"}
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}

