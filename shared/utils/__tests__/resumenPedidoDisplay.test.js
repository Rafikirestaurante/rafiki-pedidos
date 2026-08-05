import { describe, expect, it } from "vitest";
import {
  detalleCafeteriaEstaEnTitulo,
  esBatidoResumen,
  esJugoTradicionalResumen,
  esParfaitResumen,
  nombreCafeteriaResumen,
  obtenerDetallesCafeteria,
  obtenerNombreCafeteria
} from "../resumenPedidoDisplay";

describe("resumenPedidoDisplay", () => {
  it("muestra el parfait en una sola línea con tamaño y frutas", () => {
    const item = {
      categoria: "Cafetería",
      tipo: "Parfait",
      producto: "Parfait 12 oz - Frutas: Frutos rojos, Karibú",
      tamano: "12 oz",
      frutas: ["Frutos rojos", "Karibú"]
    };
    expect(esParfaitResumen(item)).toBe(true);
    expect(nombreCafeteriaResumen(item)).toBe("Parfait 12 oz · Frutos rojos, Karibú");
    expect(detalleCafeteriaEstaEnTitulo(item)).toBe(true);
  });

  it("elimina incluso un prefijo Parfait duplicado heredado", () => {
    expect(nombreCafeteriaResumen({
      categoria: "cafeteria",
      tipo: "Parfait",
      producto: "Parfait Parfait 12 oz - Frutas: Banano, Arándanos, Uva",
      tamano: "12 oz",
      frutas: ["Banano", "Arándanos", "Uva"]
    })).toBe("Parfait 12 oz · Banano, Arándanos, Uva");
  });

  it("muestra el batido cremoso sin repetir el tipo genérico y conserva la base como detalle", () => {
    const item = { categoria: "Cafetería", tipo: "Batido cremoso", producto: "Milo 12 oz", base: "Helado" };
    expect(esBatidoResumen(item)).toBe(true);
    expect(nombreCafeteriaResumen(item)).toBe("Milo 12 oz");
    expect(obtenerDetallesCafeteria(item)).toEqual([{ etiqueta: "Base", valor: "Helado" }]);
  });

  it("muestra el batido refrescante sin repetir el tipo genérico", () => {
    expect(nombreCafeteriaResumen({ categoria: "Cafetería", tipo: "Batido refrescante", producto: "Maracuyá 16 oz" })).toBe("Maracuyá 16 oz");
  });

  it("muestra el jugo tradicional en una sola línea con sabor, tamaño y base", () => {
    const item = { categoria: "cafeteria", tipo: "Jugo tradicional", producto: "Fresa 12 oz", tamano: "12 oz", base: "Agua" };
    expect(esJugoTradicionalResumen(item)).toBe(true);
    expect(nombreCafeteriaResumen(item)).toBe("Fresa 12 oz · Agua");
    expect(obtenerDetallesCafeteria(item)).toEqual([]);
  });

  it("limpia prefijos genéricos repetidos en jugos y batidos", () => {
    expect(obtenerNombreCafeteria({ categoria: "cafeteria", tipo: "Jugos tradicionales", producto: "Jugo tradicional Fresa 12 oz", base: "Leche" })).toBe("Fresa 12 oz · Leche");
    expect(obtenerNombreCafeteria({ categoria: "cafeteria", tipo: "Batidos cremosos", producto: "Batido cremoso Milo 12 oz", base: "Helado" })).toBe("Milo 12 oz");
  });

  it("no cambia desayunos ni restaurante con la regla especial", () => {
    expect(nombreCafeteriaResumen({ categoria: "Cafetería", tipo: "Desayuno", producto: "Huevos" })).toBe("");
    expect(nombreCafeteriaResumen({ categoria: "Almuerzo", tipo: "Parfait", producto: "Prueba" })).toBe("");
  });
});
