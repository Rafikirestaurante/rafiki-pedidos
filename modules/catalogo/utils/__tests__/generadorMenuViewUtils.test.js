import { describe, expect, it } from "vitest";
import {
  agruparPlatosVisuales,
  categoriaRotacionMenu,
  crearMapaUltimoUsoMenu,
  ordenarAcompanantesResumen,
  ordenarPlatosResumen,
  ordenarProductosPorUltimoUso,
} from "../generadorMenuViewUtils";

describe("generadorMenuViewUtils", () => {
  it("agrupa visualmente pechuga, pastas y guisos", () => {
    const grupos = agruparPlatosVisuales([
      { nombre: "Pechuga o cerdo en salsa de champiñones" },
      { nombre: "Pastas boloñesa" },
      { nombre: "Pollo guisado" },
    ]);
    expect(grupos.map((grupo) => grupo.key)).toEqual(["pechugaCerdo", "pastas", "guisos"]);
  });

  it("ordena arroz antes y ensalada al final", () => {
    const ordenados = ordenarAcompanantesResumen(["Ensalada", "Papa", "Arroz blanco"]);
    expect(ordenados).toEqual(["Arroz blanco", "Papa", "Ensalada"]);
  });

  it("deja guisos primero, luego pastas, proteínas y sopas", () => {
    const ordenados = ordenarPlatosResumen([
      "Sopa de costilla",
      "Pechuga o cerdo en salsa",
      "Pastas boloñesa",
      "Pollo guisado",
    ]);
    expect(ordenados).toEqual([
      "Pollo guisado",
      "Pastas boloñesa",
      "Pechuga o cerdo en salsa",
      "Sopa de costilla",
    ]);
  });

  it("clasifica la rotación por categoría funcional", () => {
    expect(categoriaRotacionMenu({ categoria: "Sopas", nombre: "Ajiaco" })).toBe("sopas");
    expect(categoriaRotacionMenu({ categoria: "Pastas", nombre: "Pastas" })).toBe("pastas");
    expect(categoriaRotacionMenu({ categoria: "Platos", nombre: "Pechuga asada" })).toBe("platos");
  });
  it("ordena no usados desde el que lleva más tiempo sin aparecer", () => {
    const historial = [
      { fecha: "2026-09-10", platos: [{ nombre: "Pollo guisado" }] },
      { fecha: "2026-08-20", platos: [{ nombre: "Pastas boloñesa" }] },
    ];
    const mapa = crearMapaUltimoUsoMenu(historial);
    const ordenados = ordenarProductosPorUltimoUso([
      { nombre: "Pollo guisado" },
      { nombre: "Nunca usado" },
      { nombre: "Pastas boloñesa" },
    ], mapa);

    expect(ordenados.map((item) => item.nombre)).toEqual([
      "Nunca usado",
      "Pastas boloñesa",
      "Pollo guisado",
    ]);
  });

});
