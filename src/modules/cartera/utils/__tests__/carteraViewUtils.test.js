import { describe, expect, it } from "vitest";
import {
  agruparAbonosRegistrados,
  construirEstadoCuenta,
  movimientoPendiente,
  resumenPedidoMovimiento,
  resumenSoloProteinaMovimiento,
  saldoMovimiento,
  resumirAbonosPorMetodo,
} from "../carteraViewUtils";

describe("construirEstadoCuenta", () => {
  it("combina pedidos y pagos y calcula el saldo en orden cronológico", () => {
    const lineas = construirEstadoCuenta(
      [{ id: "p1", fecha_movimiento: "2026-08-01T12:00:00", numero_pedido: 10, valor: 25000, estado: "pendiente", concepto: "Almuerzo" }],
      [{ id: "a1", fecha_abono: "2026-08-02T12:00:00", numero_pedido: 10, valor_abono: 10000, metodo_pago: "Efectivo" }]
    );
    expect(lineas).toHaveLength(2);
    expect(lineas[0]).toMatchObject({ tipo: "Pedido a crédito", pedido: 25000, saldo: 25000 });
    expect(lineas[1]).toMatchObject({ tipo: "Pago recibido", pago: 10000, saldo: 15000 });
  });

  it("muestra como un solo abono las aplicaciones FIFO del mismo pago", () => {
    const lineas = construirEstadoCuenta(
      [
        { id: "p1", fecha_movimiento: "2026-07-08T12:00:00", valor: 22500, estado: "pagado" },
        { id: "p2", fecha_movimiento: "2026-07-08T12:30:00", valor: 16000, estado: "pagado" },
      ],
      [
        { id: "a1", cliente_credito_id: "c1", created_at: "2026-07-09T12:00:01Z", fecha_abono: "2026-07-09T07:00:00", numero_pedido: 3597, valor_abono: 22500, metodo_pago: "Efectivo" },
        { id: "a2", cliente_credito_id: "c1", created_at: "2026-07-09T12:00:01Z", fecha_abono: "2026-07-09T07:00:00", numero_pedido: 3691, valor_abono: 16000, metodo_pago: "Efectivo" },
      ]
    );

    expect(lineas).toHaveLength(3);
    expect(lineas[2]).toMatchObject({ referencia: "Abono", pago: 38500, saldo: 0 });
    expect(lineas[2].descripcion).toBe("Efectivo");
  });
});

describe("carteraViewUtils", () => {
  it("calcula el saldo con respaldo en el valor original", () => {
    expect(saldoMovimiento({ saldo_movimiento: 42000, valor: 50000 })).toBe(42000);
    expect(saldoMovimiento({ valor: 18000 })).toBe(18000);
  });

  it("solo considera pendiente un movimiento vigente con saldo", () => {
    expect(movimientoPendiente({ estado: "pendiente", saldo_movimiento: 1000 })).toBe(true);
    expect(movimientoPendiente({ estado: "pagado", saldo_movimiento: 1000 })).toBe(false);
    expect(movimientoPendiente({ estado: "anulado", saldo_movimiento: 1000 })).toBe(false);
  });

  it("resume los productos de un pedido para la tabla", () => {
    const resumen = resumenPedidoMovimiento({
      pedido_items: [
        { cantidad: 2, nombre: "Pechuga", acompanantes: ["Arroz", "Ensalada"] },
        { cantidad: 1, nombre: "Jugo" },
      ],
    });
    expect(resumen).toContain("2 Pechuga");
    expect(resumen).toContain("Arroz");
    expect(resumen).toContain("1 Jugo");
  });

  it("muestra solo la proteína sin acompañantes cuando se solicita", () => {
    const movimiento = {
      pedido_items: [
        { cantidad: 2, nombre: "Almuerzo", proteina: "Pechuga asada", acompanantes: ["Arroz", "Ensalada"] },
        { cantidad: 1, nombre: "Almuerzo", proteina: "Carne bistec", acompanantes: ["Papa"] },
      ],
    };
    expect(resumenSoloProteinaMovimiento(movimiento)).toBe("2 Pechuga asada + 1 Carne bistec");
    expect(construirEstadoCuenta([{ id: "p2", valor: 30000, ...movimiento }], [], { soloProteina: true })[0].descripcion)
      .toBe("2 Pechuga asada + 1 Carne bistec");
  });

  it("agrupa abonos por método", () => {
    const resultado = resumirAbonosPorMetodo([
      { metodo_pago: "Efectivo", valor_abono: 10000 },
      { metodo_pago: "Efectivo", valor_abono: 5000 },
      { metodo_pago: "Transferencia", valor_abono: 7000 },
    ]);
    expect(resultado).toHaveLength(2);
    expect(resultado.find((item) => item.etiqueta.startsWith("Efectivo"))?.valor).toContain("15.000");
  });

  it("no une dos pagos distintos aunque tengan la misma fecha operativa", () => {
    const resultado = agruparAbonosRegistrados([
      { id: "a1", cliente_credito_id: "c1", created_at: "2026-07-09T12:00:01Z", fecha_abono: "2026-07-09T07:00:00", valor_abono: 10000, metodo_pago: "Efectivo" },
      { id: "a2", cliente_credito_id: "c1", created_at: "2026-07-09T12:00:02Z", fecha_abono: "2026-07-09T07:00:00", valor_abono: 5000, metodo_pago: "Efectivo" },
    ]);
    expect(resultado).toHaveLength(2);
  });
});
