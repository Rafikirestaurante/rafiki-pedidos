import { describe, expect, it } from "vitest";
import { limpiarLista, limpiarPrecio } from "../generadorMenu";

describe("utils/generadorMenu", () => {
  it("convierte texto por líneas en una lista limpia", () => {
    expect(limpiarLista("Arroz\n\n Ensalada \nPuré")).toEqual(["Arroz", "Ensalada", "Puré"]);
  });

  it("limpia precios dejando solo números y punto", () => {
    expect(limpiarPrecio("$16.000 COP")).toBe("16.000");
  });
});
