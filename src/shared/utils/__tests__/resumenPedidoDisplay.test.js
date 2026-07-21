import { describe, expect, it } from "vitest";
import {
  detalleCafeteriaEstaEnTitulo,
  esBatidoResumen,
  esParfaitResumen,
  nombreCafeteriaResumen
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

  it("muestra el batido cremoso sin repetir el tipo genérico", () => {
    const item = { categoria: "Cafetería", tipo: "Batido cremoso", producto: "Milo 12 oz", base: "Helado" };
    expect(esBatidoResumen(item)).toBe(true);
    expect(nombreCafeteriaResumen(item)).toBe("Milo 12 oz");
  });

  it("muestra el batido refrescante sin repetir el tipo genérico", () => {
    expect(nombreCafeteriaResumen({ categoria: "Cafetería", tipo: "Batido refrescante", producto: "Maracuyá 16 oz" })).toBe("Maracuyá 16 oz");
  });

  it("no cambia jugos, desayunos ni restaurante", () => {
    expect(nombreCafeteriaResumen({ categoria: "Cafetería", tipo: "Jugo tradicional", producto: "Mango" })).toBe("");
    expect(nombreCafeteriaResumen({ categoria: "Cafetería", tipo: "Desayuno", producto: "Huevos" })).toBe("");
    expect(nombreCafeteriaResumen({ categoria: "Almuerzo", tipo: "Parfait", producto: "Prueba" })).toBe("");
  });
});
