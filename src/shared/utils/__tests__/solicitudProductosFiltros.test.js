import { describe, expect, it } from "vitest";
import {
  describirFiltroJornadaInsumos,
  FILTROS_JORNADA_INSUMOS,
  obtenerProductosPendientesDesdeSolicitudes
} from "../solicitudProductos";

const solicitudes = [
  {
    fecha_solicitud: "2026-07-29",
    fecha_para: "2026-07-30",
    insumos: [
      { nombre: "Tomate", categoria: "Verduras", jornadaSolicitud: "PM", horaSolicitud: "16:30" },
      { nombre: "Cebolla", categoria: "Verduras", jornadaSolicitud: "AM", horaSolicitud: "09:10" }
    ]
  },
  {
    fecha_solicitud: "2026-07-30",
    fecha_para: "2026-07-30",
    insumos: [
      { nombre: "Lechuga", categoria: "Verduras", jornadaSolicitud: "AM", horaSolicitud: "08:15" },
      { nombre: "Pollo", categoria: "Carnes", jornadaSolicitud: "PM", horaSolicitud: "15:20" }
    ]
  }
];

describe("filtros de jornada para insumos pendientes", () => {
  it("muestra únicamente solicitudes AM de la fecha base", () => {
    const resultado = obtenerProductosPendientesDesdeSolicitudes(
      solicitudes,
      "2026-07-30",
      FILTROS_JORNADA_INSUMOS.AM
    );
    expect(resultado.map((item) => item.nombre)).toEqual(["Lechuga"]);
  });

  it("muestra únicamente solicitudes PM de la fecha base", () => {
    const resultado = obtenerProductosPendientesDesdeSolicitudes(
      solicitudes,
      "2026-07-30",
      FILTROS_JORNADA_INSUMOS.PM
    );
    expect(resultado.map((item) => item.nombre)).toEqual(["Pollo"]);
  });

  it("combina PM del día anterior con AM del día actual", () => {
    const resultado = obtenerProductosPendientesDesdeSolicitudes(
      solicitudes,
      "2026-07-30",
      FILTROS_JORNADA_INSUMOS.PM_ANTERIOR_AM_ACTUAL
    );
    expect(resultado.map((item) => item.nombre).sort()).toEqual(["Lechuga", "Tomate"]);
    expect(describirFiltroJornadaInsumos(
      FILTROS_JORNADA_INSUMOS.PM_ANTERIOR_AM_ACTUAL,
      "2026-07-30"
    )).toBe("PM del 2026-07-29 + AM del 2026-07-30");
  });
});
