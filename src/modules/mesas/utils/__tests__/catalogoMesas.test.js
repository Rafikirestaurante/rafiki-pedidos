import { describe, expect, it } from "vitest";
import { productosCatalogoPorCategoria, saboresCatalogoPorCategoria } from "../catalogoMesas";

describe("catalogoMesas", () => {
  const productos = [
    { linea: "Cafetería", categoria: "Postres", nombre: "Brownie", precio: 7000, orden: 2, activo: true },
    { linea: "Cafetería", categoria: "Postres", nombre: "Torta", precio: 9000, orden: 1, activo: true },
    { linea: "Cafetería", categoria: "Postres", nombre: "Oculto", precio: 5000, orden: 3, activo: false },
    { linea: "Cafetería", categoria: "Frutas", nombre: "Mango", precio: 0, orden: 2, activo: true },
    { linea: "Cafetería", categoria: "Frutas", nombre: "Fresa", precio: 0, orden: 1, activo: true },
  ];

  it("filtra productos activos y los ordena", () => {
    expect(productosCatalogoPorCategoria(productos, "Postres")).toEqual([
      { nombre: "Torta", precio: 9000 },
      { nombre: "Brownie", precio: 7000 },
    ]);
  });

  it("obtiene sabores aunque no tengan precio", () => {
    expect(saboresCatalogoPorCategoria(productos, "Frutas")).toEqual(["Fresa", "Mango"]);
  });
});
