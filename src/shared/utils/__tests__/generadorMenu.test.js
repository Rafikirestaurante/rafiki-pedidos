import { describe, expect, it } from "vitest";
import {
  limpiarLista,
  limpiarPrecio,
  generarTextoEditorMenu,
  generarTextoAcompanantesEditor,
  aplicarSaAutomaticoArrocesPastas
} from "../generadorMenu";

describe("utils/generadorMenu", () => {
  it("convierte texto por líneas en una lista limpia", () => {
    expect(limpiarLista("Arroz\n\n Ensalada \nPuré")).toEqual(["Arroz", "Ensalada", "Puré"]);
  });

  it("limpia precios dejando solo números y punto", () => {
    expect(limpiarPrecio("$16.000 COP")).toBe("16.000");
  });

  it("genera el texto del editor separando pechuga/cerdo, sopas y productos fijos", () => {
    const texto = generarTextoEditorMenu([
      { nombre: "Pastas boloñesa", precio: "17.000" },
      { nombre: "Pechuga o cerdo en salsa miel mostaza", precio: "16000" },
      { nombre: "Sancocho de costilla", precio: "17.000" }
    ]);

    expect(texto).toContain("Platos | pastas boloñesa:17000");
    expect(texto).toContain("Platos | pechuga en salsa miel mostaza:16000");
    expect(texto).toContain("Platos | cerdo en salsa miel mostaza:16000");
    expect(texto).toContain("Sopas | sancocho de costilla:17000");
    expect(texto).toContain("Platos | Pechuga Asada sin salsa:16000");
    expect(texto).toContain("Sopas | Sancocho de pollo con arroz:15000");
  });


  it("aplica SA automáticamente solo a arroces y pastas al importar al editor", () => {
    const resultado = aplicarSaAutomaticoArrocesPastas(
      [
        "Platos | Arroz con pollo:18000",
        "Platos | Pastas boloñesa:19000",
        "Sopas | Sancocho de pollo con arroz:16500",
        "Platos | Carne guisada:19000",
        "Pastas SA | Pasta carbonara:20000"
      ].join("\n")
    );

    expect(resultado.texto).toContain("Platos SA | Arroz con pollo:18000");
    expect(resultado.texto).toContain("Platos SA | Pastas boloñesa:19000");
    expect(resultado.texto).toContain("Sopas | Sancocho de pollo con arroz:16500");
    expect(resultado.texto).toContain("Platos | Carne guisada:19000");
    expect(resultado.texto).toContain("Pastas SA | Pasta carbonara:20000");
    expect(resultado.platosConSa).toEqual([
      { nombre: "Arroz con pollo", tipo: "Arroz" },
      { nombre: "Pastas boloñesa", tipo: "Pasta" }
    ]);
  });

  it("genera acompañantes separados por 'o' y agrega Solo esos dos", () => {
    expect(generarTextoAcompanantesEditor(["Arroz de cebolla", "Tajadas o lentejas"])).toBe(
      "Arroz de cebolla\nTajadas\nlentejas\nSolo esos dos"
    );
  });
});
