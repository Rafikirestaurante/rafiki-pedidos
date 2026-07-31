import { describe, expect, it } from "vitest";
import {
  calcularTotalItem,
  crearDatosTicketPedido,
  crearTextoItem,
  dinero,
  esAdicionalAlmuerzo,
  esItemCafeteria,
  formatoNumeroPedido,
  limpiarTelefono,
  limpiarTexto,
  normalizarTexto,
  textoParaLlevarItem,
  valorParaLlevarItem
} from "../pedidos";

describe("utils/pedidos", () => {
  it("limpia texto peligroso y espacios repetidos", () => {
    expect(limpiarTexto("  Hola   <Rafiki>  ")).toBe("Hola Rafiki");
  });

  it("limpia teléfonos conservando números y símbolos útiles", () => {
    expect(limpiarTelefono("Tel: +57 (300) 123-45xx")).toBe("+57 (300) 123-45");
  });

  it("formatea el número de pedido con cuatro dígitos", () => {
    expect(formatoNumeroPedido(25)).toBe("0025");
    expect(formatoNumeroPedido(null)).toBe("----");
  });

  it("normaliza texto con tildes", () => {
    expect(normalizarTexto("  Café con Leche  ")).toBe("cafe con leche");
  });

  it("detecta productos de cafetería", () => {
    expect(esItemCafeteria({ tipo: "Batido cremoso", producto: "Milo" })).toBe(true);
    expect(esItemCafeteria({ categoria: "Almuerzo", plato: "Pechuga" })).toBe(false);
  });

  it("calcula empaque para llevar según tipo de producto", () => {
    expect(valorParaLlevarItem({ paraLlevar: true, categoria: "Almuerzo", plato: "Pechuga" })).toBe(1500);
    expect(valorParaLlevarItem({ paraLlevar: true, categoria: "cafeteria", tipo: "Batido", producto: "Milo" })).toBe(0);
    expect(valorParaLlevarItem({ paraLlevar: true, categoria: "cafeteria", tipo: "Desayuno", producto: "Huevos" })).toBe(1000);
  });

  it("genera texto de empaque claro", () => {
    expect(textoParaLlevarItem({ paraLlevar: false })).toBe("Sin empaque para llevar");
    expect(textoParaLlevarItem({ paraLlevar: true, categoria: "cafeteria", tipo: "Batido" })).toBe(
      "Para llevar sin costo adicional"
    );
    expect(textoParaLlevarItem({ paraLlevar: true, categoria: "Almuerzo", plato: "Carne" })).toBe(
      `Para llevar +${dinero(1500)}`
    );
  });
  it("genera texto limpio para jugos tradicionales", () => {
    const item = { categoria: "cafeteria", area: "cafeteria", tipo: "Jugo tradicional", producto: "Fresa 12 oz", tamano: "12 oz", base: "Agua", precio: 8500, cantidad: 1 };
    expect(crearTextoItem(item)).toContain("1 Fresa 12 oz · Agua");
    expect(crearTextoItem(item)).not.toContain("Cafetería: Jugo tradicional");
    expect(crearTextoItem(item)).not.toContain("Base: Agua");
  });

  it("genera comanda de jugo en una sola línea sin repetir tipo ni base", () => {
    const item = { categoria: "cafeteria", area: "cafeteria", tipo: "Jugo tradicional", producto: "Fresa 12 oz", tamano: "12 oz", base: "Agua", precio: 8500, cantidad: 1 };
    const ticket = crearDatosTicketPedido({ numero_pedido: 1, cliente: "Prueba", items: [item] }, { area: "cafeteria", items: [item] });
    expect(ticket.productos).toEqual(["1 FRESA 12 OZ · AGUA"]);
  });

  it("genera comanda de parfait sin duplicar Parfait ni separar frutas", () => {
    const item = { categoria: "cafeteria", area: "cafeteria", tipo: "Parfait", producto: "Parfait Parfait 12 oz - Frutas: Banano, Arándanos, Uva", tamano: "12 oz", frutas: ["Banano", "Arándanos", "Uva"], precio: 12500, cantidad: 1 };
    const ticket = crearDatosTicketPedido({ numero_pedido: 2, cliente: "Prueba", items: [item] }, { area: "cafeteria", items: [item] });
    expect(ticket.productos[0]).toBe("1 PARFAIT 12 OZ · BANANO, ARÁNDANOS, UVA");
    expect(ticket.productos.some((linea) => linea.includes("FRUTAS:"))).toBe(false);
  });

  it("maneja adicionales de almuerzo como productos independientes", () => {
    const adicional = {
      categoria: "Adicionales almuerzo",
      area: "cocina",
      tipo: "adicional_almuerzo",
      plato: "Papas Fritas",
      precioPlato: 5000,
      cantidad: 3,
      paraLlevar: true
    };

    expect(esAdicionalAlmuerzo(adicional)).toBe(true);
    expect(calcularTotalItem(adicional)).toBe(15000);
    expect(valorParaLlevarItem(adicional)).toBe(0);
    expect(crearTextoItem(adicional)).toBe("3 Papas Fritas ($ 5.000)");
  });

});
