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
  precioPorNombre,
  textoParaLlevarItem,
  valorParaLlevarItem
} from "../utils/pedidos";
import { MAX_ACOMPANANTES_CLIENTE } from "../data/menuAlmuerzos";
import { CampoTexto } from "./common";
import {
  CAFETERIA_ACOMPANANTES_DESAYUNO,
  CAFETERIA_ADICIONALES_DESAYUNO,
  CAFETERIA_BATIDOS_BASES,
  CAFETERIA_BATIDOS_CREMOSOS_SABORES,
  CAFETERIA_BATIDOS_CREMOSOS_TAMANOS,
  CAFETERIA_BATIDOS_REFRESCANTES_SABORES,
  CAFETERIA_BATIDOS_REFRESCANTES_TAMANOS,
  CAFETERIA_BEBIDAS_CALIENTES,
  CAFETERIA_CEREALES,
  CAFETERIA_DESAYUNOS,
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
  const [mesaLocal, setMesaLocal] = useState("Mesa 1");
  const [meseroLocal, setMeseroLocal] = useState("");
  const [observacionesLocal, setObservacionesLocal] = useState("");
  const [errorMesa, setErrorMesa] = useState("");
  const [categoriaActivaMesa, setCategoriaActivaMesa] = useState("almuerzos");
  const [subcategoriaCafeteria, setSubcategoriaCafeteria] = useState("parfait");
  const [tamanoParfait, setTamanoParfait] = useState("12 oz");
  const [frutasParfait, setFrutasParfait] = useState([]);
  const [cerealParfait, setCerealParfait] = useState("Granola");
  const [tipoBatido, setTipoBatido] = useState("cremoso");
  const [saborBatido, setSaborBatido] = useState("Frutos rojos");
  const [tamanoBatido, setTamanoBatido] = useState("12 oz");
  const [baseBatido, setBaseBatido] = useState("Yogurt");
  const [desayunoSeleccionado, setDesayunoSeleccionado] = useState("Huevos tomate y cebolla");
  const [acompananteDesayuno, setAcompananteDesayuno] = useState("Arepa");
  const [adicionalesDesayuno, setAdicionalesDesayuno] = useState([]);
  const [sandwichSeleccionado, setSandwichSeleccionado] = useState("Sándwich de jamón y queso");
  const [bebidaCalienteSeleccionada, setBebidaCalienteSeleccionada] = useState("Café americano");
  const [postreSeleccionado, setPostreSeleccionado] = useState("Fresas con crema");

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
  const pasoRapidoAlmuerzo = itemAlmuerzoActivo?.plato || itemAlmuerzoActivo?.proteina
    ? esCategoriaSopa(itemAlmuerzoActivo.categoria)
      ? "Revisa cantidad y agrega"
      : (Array.isArray(itemAlmuerzoActivo.acompanantes) && itemAlmuerzoActivo.acompanantes.length > 0)
        ? "Revisa cantidad y agrega"
        : "Escoge acompañantes"
    : "Toca una proteína";

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

        if (nuevosAcompanantes.length >= 1) {
          irAElementoMesas(`mesa-confirmacion-${id}`, 180, "center");
        }

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
    setMesaLocal("Mesa 1");
    setMeseroLocal("");
    setObservacionesLocal("");
    setErrorMesa("");
  }

  function agregarItemCafeteria(item) {
    vibracionCortaMesas();
    setItemsMesa((actual) => [...actual, item]);
    setErrorMesa("");
    irAElementoMesas("mesa-categorias-top", 120, "start");
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

  function agregarParfaitMesa() {
    if (frutasParfait.length === 0) {
      setErrorMesa("Selecciona al menos una fruta para el parfait.");
      return;
    }

    const precioBase = precioPorNombre(CAFETERIA_PARFAIT_TAMANOS, tamanoParfait);
    const extraFrutas = frutasParfait.length === 3 ? 1000 : 0;

    agregarItemCafeteria(crearItemCafeteria({
      tipo: "Parfait",
      producto: `Parfait ${tamanoParfait}`,
      precio: precioBase + extraFrutas,
      tamano: tamanoParfait,
      frutas: frutasParfait,
      cereal: cerealParfait,
      extraFrutas
    }));

    setFrutasParfait([]);
  }

  function cambiarTipoBatidoMesa(tipo) {
    setTipoBatido(tipo);
    setTamanoBatido("12 oz");

    if (tipo === "cremoso") {
      setSaborBatido(CAFETERIA_BATIDOS_CREMOSOS_SABORES[0]);
      setBaseBatido("Yogurt");
      return;
    }

    if (tipo === "refrescante") {
      setSaborBatido(CAFETERIA_BATIDOS_REFRESCANTES_SABORES[0]);
      setBaseBatido("");
      return;
    }

    setSaborBatido(CAFETERIA_JUGOS_TRADICIONALES_SABORES[0]);
    setBaseBatido("Agua");
  }

  function agregarBatidoMesa() {
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
      tamano: tamanoBatido,
      base: baseBatido
    }));
  }

  function agregarDesayunoMesa() {
    const precioBase = precioPorNombre(CAFETERIA_DESAYUNOS, desayunoSeleccionado);
    const precioAdicionales = adicionalesDesayuno.reduce((suma, item) => suma + Number(item.precio || 0), 0);

    agregarItemCafeteria(crearItemCafeteria({
      tipo: "Desayuno",
      producto: desayunoSeleccionado,
      precio: precioBase + precioAdicionales,
      acompanante: acompananteDesayuno,
      adicionales: adicionalesDesayuno
    }));

    setAdicionalesDesayuno([]);
  }

  function agregarProductoSimpleCafeteria(tipo, producto, precio) {
    agregarItemCafeteria(crearItemCafeteria({
      tipo,
      producto,
      precio
    }));
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

    if (!mesaLocal.trim()) {
      setErrorMesa("Selecciona la mesa.");
      return;
    }

    if (!meseroLocal.trim()) {
      setErrorMesa("Escribe el nombre del mesero.");
      return;
    }

    const ok = await onEnviar({
      items: itemsConProducto,
      mesa: mesaLocal,
      mesero: meseroLocal,
      observaciones: observacionesLocal
    });

    if (ok) {
      reiniciarPedidoMesa();
    }
  }

  return (
    <main className="order-layout mesas-cliente-layout">
      <section className="card card-pad" id="mesa-categorias-top">
        <div className="mesa-pos-header">
          <div>
            <span className="mesa-pos-kicker">Modo rápido meseros</span>
            <h2>TOCAR → AGREGAR → SIGUIENTE</h2>
          </div>
          <div className="mesa-pos-pill">{itemsConProducto.length} items · {dinero(total)}</div>
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

        {categoriaActivaMesa === "almuerzos" && (
          <div className="mesa-step-strip" aria-label="Paso actual">
            <span className="active">1. Proteína</span>
            <span className={(itemAlmuerzoActivo?.plato || itemAlmuerzoActivo?.proteina) ? "active" : ""}>2. Acompañantes</span>
            <span className={hayProductoSeleccionadoMesa ? "active" : ""}>3. Agregar / Continuar</span>
            <strong>{pasoRapidoAlmuerzo}</strong>
          </div>
        )}

        {categoriaActivaMesa === "almuerzos" ? (
          menu.platos_detalle.length === 0 ? (
            <div className="box soft">No hay menú diario configurado.</div>
          ) : (
            <>
              {itemsAlmuerzoMesa.map((item, index) => {
              const tienePlato = Boolean(item.plato || item.proteina);
              const itemEsSopa = esCategoriaSopa(item.categoria);
              const acompanantesItem = Array.isArray(item.acompanantes) ? item.acompanantes : [];
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
                      <h4>Toca la proteína</h4>
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
                          <h4>Toca acompañantes</h4>
                        </div>
                      </div>

                      <div className="chips">
                        {menu.acompanantes.length === 0 ? (
                          <span className="muted">No hay acompañantes configurados.</span>
                        ) : (
                          menu.acompanantes.map((acompanante) => {
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
                  + Agregar y tomar otro
                </button>

                <button
                  type="button"
                  onClick={() => irAElementoMesas("mesa-datos-final", 120)}
                  className="button continue-button"
                  style={{ marginTop: 12, background: "#16a34a" }}
                >
                  Continuar a datos de mesa
                </button>
              </>
            )}
            </>
          )
        ) : (
          <div className="cafeteria-placeholder fade-step">
            <h2>☕ Cafetería</h2>
            <p className="muted">
              Agrega parfait, batidos, desayunos, sándwiches, bebidas calientes y postres al mismo pedido de mesa.
            </p>

            <div className="cafeteria-grid cafeteria-actions">
              {[
                ["parfait", "🍓", "Parfait"],
                ["batidos", "🥤", "Batidos"],
                ["desayunos", "🍳", "Desayunos"],
                ["sandwich", "🥪", "Sándwich"],
                ["bebidas", "☕", "Bebidas calientes"],
                ["postres", "🍰", "Postres"]
              ].map(([clave, icono, nombre]) => (
                <button
                  key={clave}
                  type="button"
                  onClick={() => { setSubcategoriaCafeteria(clave); setErrorMesa(""); irAElementoMesas("mesa-cafeteria-panel", 100, "start"); }}
                  className={`cafeteria-card cafeteria-button ${subcategoriaCafeteria === clave ? "active" : ""}`}
                >
                  <span>{icono}</span>
                  <strong>{nombre}</strong>
                </button>
              ))}
            </div>

            <div id="mesa-cafeteria-panel" />

            {subcategoriaCafeteria === "parfait" && (
              <div className="cafeteria-panel fade-step">
                <h3>🍓 Parfait</h3>
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

                <h4>Cereal</h4>
                <div className="chips">
                  {CAFETERIA_CEREALES.map((cereal) => (
                    <button key={cereal} type="button" onClick={() => setCerealParfait(cereal)} className={`chip ${cerealParfait === cereal ? "selected" : ""}`}>
                      {cerealParfait === cereal ? "✓ " : "+ "}{cereal}
                    </button>
                  ))}
                </div>

                <div className="total-row compact-total-row">
                  <span>Subtotal parfait</span>
                  <strong>{dinero(precioPorNombre(CAFETERIA_PARFAIT_TAMANOS, tamanoParfait) + (frutasParfait.length === 3 ? 1000 : 0))}</strong>
                </div>
                <button type="button" className="button add-meal" onClick={agregarParfaitMesa}>+ Agregar y seguir</button>
              </div>
            )}

            {subcategoriaCafeteria === "batidos" && (
              <div className="cafeteria-panel fade-step">
                <h3>🥤 Batidos</h3>
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
                <button type="button" className="button add-meal" onClick={agregarBatidoMesa}>+ Agregar y seguir</button>
              </div>
            )}

            {subcategoriaCafeteria === "desayunos" && (
              <div className="cafeteria-panel fade-step">
                <h3>🍳 Desayunos</h3>
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
                <h4>Adicionales</h4>
                <div className="chips">
                  {CAFETERIA_ADICIONALES_DESAYUNO.map((adicional) => {
                    const seleccionado = adicionalesDesayuno.some((item) => item.nombre === adicional.nombre);
                    return (
                      <button key={adicional.nombre} type="button" onClick={() => toggleAdicionalDesayuno(adicional)} className={`chip ${seleccionado ? "selected" : ""}`}>
                        {seleccionado ? "✓ " : "+ "}{adicional.nombre} {dinero(adicional.precio)}
                      </button>
                    );
                  })}
                </div>
                <div className="total-row compact-total-row">
                  <span>Subtotal desayuno</span>
                  <strong>{dinero(precioPorNombre(CAFETERIA_DESAYUNOS, desayunoSeleccionado) + adicionalesDesayuno.reduce((suma, item) => suma + Number(item.precio || 0), 0))}</strong>
                </div>
                <button type="button" className="button add-meal" onClick={agregarDesayunoMesa}>+ Agregar y seguir</button>
              </div>
            )}

            {subcategoriaCafeteria === "sandwich" && (
              <div className="cafeteria-panel fade-step">
                <h3>🥪 Sándwich</h3>
                <div className="option-grid">
                  {CAFETERIA_SANDWICHES.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => setSandwichSeleccionado(item.nombre)} className={`option ${sandwichSeleccionado === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>
                <button type="button" className="button add-meal" onClick={() => agregarProductoSimpleCafeteria("Sándwich", sandwichSeleccionado, precioPorNombre(CAFETERIA_SANDWICHES, sandwichSeleccionado))}>+ Agregar y seguir</button>
              </div>
            )}

            {subcategoriaCafeteria === "bebidas" && (
              <div className="cafeteria-panel fade-step">
                <h3>☕ Bebidas calientes</h3>
                <div className="option-grid">
                  {CAFETERIA_BEBIDAS_CALIENTES.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => setBebidaCalienteSeleccionada(item.nombre)} className={`option ${bebidaCalienteSeleccionada === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>
                <button type="button" className="button add-meal" onClick={() => agregarProductoSimpleCafeteria("Bebida caliente", bebidaCalienteSeleccionada, precioPorNombre(CAFETERIA_BEBIDAS_CALIENTES, bebidaCalienteSeleccionada))}>+ Agregar y seguir</button>
              </div>
            )}

            {subcategoriaCafeteria === "postres" && (
              <div className="cafeteria-panel fade-step">
                <h3>🍰 Postres y frutas</h3>
                <div className="option-grid">
                  {CAFETERIA_POSTRES.map((item) => (
                    <button key={item.nombre} type="button" onClick={() => setPostreSeleccionado(item.nombre)} className={`option ${postreSeleccionado === item.nombre ? "selected" : ""}`}>
                      <div>{item.nombre}</div>
                      <small>{dinero(item.precio)}</small>
                    </button>
                  ))}
                </div>
                <button type="button" className="button add-meal" onClick={() => agregarProductoSimpleCafeteria("Postre", postreSeleccionado, precioPorNombre(CAFETERIA_POSTRES, postreSeleccionado))}>+ Agregar y seguir</button>
              </div>
            )}

            {hayProductoSeleccionadoMesa && (
              <button
                type="button"
                onClick={() => irAElementoMesas("mesa-datos-final", 120)}
                className="button continue-button"
                style={{ marginTop: 12, background: "#16a34a" }}
              >
                Continuar
              </button>
            )}
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
                        {item.cereal && <p>Cereal: {item.cereal}</p>}
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

            <button type="button" onClick={reiniciarPedidoMesa} className="button light small-reset">
              Borrar y volver a empezar
            </button>

            <div id="mesa-datos-final" className="step-title" style={{ marginTop: 18 }}>
              <span className="step-number">3</span>
              <div>
                <h4>Datos de mesa</h4>
              </div>
            </div>

            <label className="field">
              <span>🍽️ Mesa</span>
              <select value={mesaLocal} onChange={(e) => { setMesaLocal(e.target.value); setErrorMesa(""); }}>
                {Array.from({ length: 30 }, (_, i) => (
                  <option key={i + 1} value={`Mesa ${i + 1}`}>{`Mesa ${i + 1}`}</option>
                ))}
              </select>
            </label>

            <CampoTexto
              etiqueta="👤 Mesero"
              value={meseroLocal}
              onChange={(valor) => { setMeseroLocal(valor); if (errorMesa) setErrorMesa(""); }}
              placeholder="Nombre mesero"
            />

            <CampoTexto
              etiqueta="Observaciones generales"
              value={observacionesLocal}
              onChange={setObservacionesLocal}
              placeholder="Ej: sin cubiertos, mesa espera bebida..."
              multiline
            />

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

