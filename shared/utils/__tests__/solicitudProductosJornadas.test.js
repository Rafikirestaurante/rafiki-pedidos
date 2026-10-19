import { describe, expect, it } from "vitest";
import {
  clasificarProductosSolicitudPorJornada,
  describirJornadaInsumos
} from "../solicitudInsumosJornadas";

const solicitudes = [
  {
    fecha_solicitud: "2026-08-05",
    insumos: [
      { nombre: "Tomate", jornadaSolicitud: "AM", horaSolicitud: "08:10" },
      { nombre: "Cebolla", jornadaSolicitud: "AM", horaSolicitud: "09:20" }
    ]
  },
  {
    fecha_solicitud: "2026-08-05",
    insumos: [
      { nombre: "Pollo", jornadaSolicitud: "PM", horaSolicitud: "15:30" },
      { nombre: "Cebolla", jornadaSolicitud: "PM", horaSolicitud: "16:05" }
    ]
  }
];

describe("control de solicitudes de insumos por jornada", () => {
  it("omite productos repetidos dentro de la misma jornada", () => {
    const resultado = clasificarProductosSolicitudPorJornada(
      solicitudes,
      [{ nombre: "Tomate" }, { nombre: "Lechuga" }],
      "AM"
    );

    expect(resultado.repetidosMismaJornada.map((item) => item.nombre)).toEqual(["Tomate"]);
    expect(resultado.productosPermitidos.map((item) => item.nombre)).toEqual(["Lechuga"]);
  });

  it("permite una segunda solicitud en la jornada contraria y la marca para confirmar", () => {
    const resultado = clasificarProductosSolicitudPorJornada(
      solicitudes,
      [{ nombre: "Tomate" }, { nombre: "Lechuga" }],
      "PM"
    );

    expect(resultado.repetidosOtraJornada.map((item) => item.nombre)).toEqual(["Tomate"]);
    expect(resultado.productosPermitidos.map((item) => item.nombre)).toEqual(["Tomate", "Lechuga"]);
  });

  it("bloquea una tercera solicitud cuando el producto ya existe en AM y PM", () => {
    const resultado = clasificarProductosSolicitudPorJornada(
      solicitudes,
      [{ nombre: "Cebolla" }],
      "PM"
    );

    expect(resultado.repetidosMismaJornada.map((item) => item.nombre)).toEqual(["Cebolla"]);
    expect(resultado.productosPermitidos).toEqual([]);
  });

  it("compara nombres ignorando mayúsculas y tildes", () => {
    const resultado = clasificarProductosSolicitudPorJornada(
      solicitudes,
      [{ nombre: "CEBOLLA" }],
      "am"
    );

    expect(resultado.repetidosMismaJornada).toHaveLength(1);
  });

  it("describe las jornadas en lenguaje natural", () => {
    expect(describirJornadaInsumos("AM")).toBe("mañana");
    expect(describirJornadaInsumos("PM")).toBe("tarde");
  });
});
