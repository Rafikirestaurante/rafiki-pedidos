import { describe, expect, it } from "vitest";
import {
  movimientoPendiente,
  resumenPedidoMovimiento,
  saldoMovimiento,
  resumirAbonosPorMetodo,
} from "../carteraViewUtils";

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

  it("agrupa abonos por método", () => {
    const resultado = resumirAbonosPorMetodo([
      { metodo_pago: "Efectivo", valor_abono: 10000 },
      { metodo_pago: "Efectivo", valor_abono: 5000 },
      { metodo_pago: "Transferencia", valor_abono: 7000 },
    ]);
    expect(resultado).toHaveLength(2);
    expect(resultado.find((item) => item.etiqueta.startsWith("Efectivo"))?.valor).toContain("15.000");
  });
});
