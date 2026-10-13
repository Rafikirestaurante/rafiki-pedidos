import React, { useMemo, useState } from "react";
import RafikiModal from "../../../shared/components/RafikiModal";
import { dinero } from "../../../shared/utils/pedidos";

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function FiltrosVentasMensuales({
  catalogo,
  categoria,
  productosSeleccionados,
  onCategoriaChange,
  onToggleProducto,
  onLimpiar
}) {
  const [modalProductos, setModalProductos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const categoriasDisponibles = Array.from(new Set([...(catalogo.categorias || []), categoria].filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "es"));
  const productosBase = categoria
    ? catalogo.productosPorCategoria?.[categoria] || []
    : catalogo.productos || [];
  const productosDisponibles = Array.from(new Set([...productosBase, ...productosSeleccionados]))
    .sort((a, b) => a.localeCompare(b, "es"));
  const productosVisibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    if (!termino) return productosDisponibles;
    return productosDisponibles.filter((producto) => normalizar(producto).includes(termino));
  }, [busqueda, productosDisponibles]);
  const filtrosActivos = Boolean(categoria || productosSeleccionados.length > 0);

  return (
    <section className="ventas-filtros-panel" aria-label="Filtros de ventas por categoría y producto">
      <div className="ventas-filtros-heading">
        <div>
          <strong>🔎 Filtrar ventas</strong>
          <span>Analiza una categoría o compara uno o varios productos.</span>
        </div>
        {filtrosActivos ? (
          <button type="button" className="mini-btn" onClick={onLimpiar}>Limpiar filtros</button>
        ) : null}
      </div>

      <div className="ventas-filtros-controles">
        <label className="ventas-filtro-campo">
          <span>Categoría</span>
          <select value={categoria} onChange={(event) => onCategoriaChange(event.target.value)}>
            <option value="">Todas las categorías</option>
            {categoriasDisponibles.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <div className="ventas-filtro-campo">
          <span>Producto o productos</span>
          <button
            type="button"
            className="ventas-filtro-productos-btn"
            onClick={() => setModalProductos(true)}
            disabled={productosDisponibles.length === 0}
          >
            {productosSeleccionados.length > 0
              ? `${productosSeleccionados.length} seleccionado${productosSeleccionados.length === 1 ? "" : "s"}`
              : "Seleccionar productos"}
          </button>
        </div>
      </div>

      {productosSeleccionados.length > 0 ? (
        <div className="ventas-filtros-chips" aria-label="Productos seleccionados">
          {productosSeleccionados.map((producto) => (
            <button key={producto} type="button" onClick={() => onToggleProducto(producto)} title="Quitar filtro">
              <span>{producto}</span><strong>×</strong>
            </button>
          ))}
        </div>
      ) : null}

      <RafikiModal
        open={modalProductos}
        title="Seleccionar productos"
        description={categoria ? `Productos de ${categoria}` : "Puedes seleccionar uno o varios productos para compararlos."}
        onClose={() => setModalProductos(false)}
        size="md"
        className="ventas-productos-modal"
        footer={(
          <button type="button" className="button" onClick={() => setModalProductos(false)}>Aplicar filtros</button>
        )}
      >
        <label className="ventas-productos-busqueda">
          <span>Buscar producto</span>
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Ejemplo: parfait, pechuga, ajiaco..."
          />
        </label>
        <div className="ventas-productos-lista">
          {productosVisibles.length === 0 ? (
            <p className="muted">No hay productos que coincidan con la búsqueda.</p>
          ) : productosVisibles.map((producto) => {
            const activo = productosSeleccionados.includes(producto);
            return (
              <button
                key={producto}
                type="button"
                className={activo ? "active" : ""}
                onClick={() => onToggleProducto(producto)}
                aria-pressed={activo}
              >
                <span>{activo ? "✓" : "+"}</span>
                <strong>{producto}</strong>
              </button>
            );
          })}
        </div>
      </RafikiModal>
    </section>
  );
}

export function ComparativoProductosVentas({ series = [], nombreMes = "" }) {
  if (series.length === 0) return null;
  const maximoDiario = Math.max(...series.flatMap((serie) => serie.dias || []), 1);
  const totalGeneral = series.reduce((suma, serie) => suma + Number(serie.total || 0), 0);

  return (
    <section className="ventas-mes-panel ventas-comparativo-productos" aria-label={`Comparación de productos de ${nombreMes}`}>
      <div className="ventas-mes-panel-heading">
        <div>
          <h4>Comparación por producto</h4>
          <p>Cada fila muestra el comportamiento diario del producto seleccionado durante {nombreMes}.</p>
        </div>
        <strong className="ventas-comparativo-total">{dinero(totalGeneral)}</strong>
      </div>

      <div className="ventas-comparativo-lista">
        {series.map((serie, indice) => (
          <article key={serie.producto} className={`ventas-comparativo-serie serie-${indice % 8}`}>
            <div className="ventas-comparativo-etiqueta">
              <strong>{serie.producto}</strong>
              <span>{serie.unidades} unid. · {dinero(serie.total)}</span>
            </div>
            <div className="ventas-comparativo-dias" style={{ "--comparativo-dias": serie.dias.length }}>
              {serie.dias.map((valor, index) => {
                const altura = valor > 0 ? Math.max((valor / maximoDiario) * 100, 7) : 0;
                return (
                  <span key={`${serie.producto}-${index}`} title={`Día ${index + 1}: ${dinero(valor)}`}>
                    <i style={{ height: `${altura}%` }} />
                  </span>
                );
              })}
            </div>
          </article>
        ))}
      </div>
      <p className="ventas-barras-ayuda">Todas las filas utilizan la misma escala para que la comparación visual sea directa.</p>
    </section>
  );
}
