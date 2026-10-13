import { describe, expect, it } from "vitest";
import {
  crearComparacionProductosMensual,
  crearResumenVentasMensuales,
  desplazarMes,
  obtenerCatalogoFiltrosVentas,
  obtenerNivelVentaDia,
  obtenerOffsetCalendarioLunes,
  obtenerRangoMesColombia
} from "../ventasMensuales";

describe("dashboard/ventasMensuales", () => {
  it("calcula el rango mensual usando la zona horaria de Colombia", () => {
    expect(obtenerRangoMesColombia("2026-07")).toEqual({
      inicioTexto: "2026-07-01",
      finTexto: "2026-07-31",
      finExclusivoTexto: "2026-08-01",
      inicio: "2026-07-01T05:00:00.000Z",
      fin: "2026-08-01T05:00:00.000Z"
    });
  });

  it("agrupa ventas y gastos por fecha Colombia y excluye pedidos borrados", () => {
    const resumen = crearResumenVentasMensuales([
      { created_at: "2026-07-03T15:00:00.000Z", total: 20000, estado: "Finalizado" },
      { created_at: "2026-07-03T23:30:00.000Z", total: 10000, estado: "Pendiente" },
      { created_at: "2026-07-04T02:00:00.000Z", total: 5000, estado: "Borrado" },
      { created_at: "2026-08-01T04:30:00.000Z", total: 30000, estado: "Finalizado" }
    ], [
      { fecha: "2026-07-03", valor: 8000 },
      { fecha: "2026-07-03", valor: 2000 },
      { fecha: "2026-07-31", valor: 5000 },
      { fecha: "2026-08-01", valor: 9999 }
    ], "2026-07");

    const dia3 = resumen.dias.find((dia) => dia.dia === 3);
    const dia31 = resumen.dias.find((dia) => dia.dia === 31);

    expect(resumen.totalMes).toBe(60000);
    expect(resumen.totalGastos).toBe(15000);
    expect(resumen.resultadoMes).toBe(45000);
    expect(resumen.totalPedidos).toBe(3);
    expect(dia3.total).toBe(32000);
    expect(dia3.gastos).toBe(10000);
    expect(dia3.resultado).toBe(20000);
    expect(dia3.pedidos).toBe(2);
    expect(dia31.total).toBe(30000);
    expect(dia31.gastos).toBe(5000);
    expect(dia31.resultado).toBe(25000);
  });

  it("construye navegación, calendario lunes primero y niveles de barras", () => {
    expect(desplazarMes("2026-01", -1)).toBe("2025-12");
    expect(desplazarMes("2026-12", 1)).toBe("2027-01");
    expect(obtenerOffsetCalendarioLunes("2026-07")).toBe(2);
    expect(obtenerNivelVentaDia(0, 100)).toBe(0);
    expect(obtenerNivelVentaDia(25, 100)).toBe(1);
    expect(obtenerNivelVentaDia(35, 100)).toBe(2);
    expect(obtenerNivelVentaDia(60, 100)).toBe(3);
    expect(obtenerNivelVentaDia(90, 100)).toBe(4);
  });

  it("filtra el calendario por categoría y producto usando los items reales del pedido", () => {
    const pedidos = [
      {
        created_at: "2026-07-03T15:00:00.000Z",
        total: 50000,
        estado: "Finalizado",
        items: [
          { categoria: "Platos", plato: "Pechuga", precio: 20000, precioPlato: 20000, cantidad: 1 },
          { categoria: "cafeteria", area: "cafeteria", tipo: "Parfait", producto: "Parfait 16 oz - Frutas: Mango", tamano: "16 oz", precio: 15000, cantidad: 2 }
        ]
      }
    ];

    const resumen = crearResumenVentasMensuales(pedidos, [], "2026-07", { categoria: "Parfait", productos: ["Parfait 16 oz"] });
    const dia3 = resumen.dias.find((dia) => dia.dia === 3);

    expect(resumen.filtrosActivos).toBe(true);
    expect(resumen.totalMes).toBe(32000);
    expect(resumen.totalUnidades).toBe(2);
    expect(resumen.totalPedidos).toBe(1);
    expect(dia3.total).toBe(30000);
    expect(dia3.unidades).toBe(2);
  });

  it("construye categorías y productos disponibles sin fragmentar los parfait por frutas", () => {
    const catalogo = obtenerCatalogoFiltrosVentas([
      {
        estado: "Finalizado",
        items: [
          { categoria: "cafeteria", area: "cafeteria", tipo: "Parfait", producto: "Parfait 16 oz - Frutas: Mango", tamano: "16 oz" },
          { categoria: "cafeteria", area: "cafeteria", tipo: "Parfait", producto: "Parfait 16 oz - Frutas: Fresa", tamano: "16 oz" },
          { categoria: "Platos", plato: "Pechuga" }
        ]
      }
    ]);

    expect(catalogo.categorias).toContain("Parfait");
    expect(catalogo.categorias).toContain("Platos");
    expect(catalogo.productosPorCategoria.Parfait).toEqual(["Parfait 16 oz"]);
  });

  it("crea series comparables para varios productos seleccionados", () => {
    const series = crearComparacionProductosMensual([
      {
        created_at: "2026-07-03T15:00:00.000Z",
        estado: "Finalizado",
        items: [
          { categoria: "Platos", plato: "Pechuga", precioPlato: 20000, cantidad: 2 },
          { categoria: "Platos", plato: "Cerdo", precioPlato: 16000, cantidad: 1 }
        ]
      }
    ], ["Pechuga", "Cerdo"], "2026-07", "Platos");

    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({ producto: "Pechuga", total: 40000, unidades: 2 });
    expect(series[0].dias[2]).toBe(40000);
    expect(series[1]).toMatchObject({ producto: "Cerdo", total: 16000, unidades: 1 });
  });

});
