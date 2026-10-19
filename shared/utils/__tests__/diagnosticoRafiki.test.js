import { describe, expect, it } from "vitest";
import {
  crearInformeTecnicoDiagnostico,
  guardarErrorDiagnostico,
  leerErroresDiagnostico,
  leerUltimaSincronizacionDiagnostico,
  registrarSincronizacionDiagnostico
} from "../diagnosticoRafiki";

function crearStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key)
  };
}

describe("diagnosticoRafiki", () => {
  it("conserva únicamente los ocho errores más recientes", () => {
    const storage = crearStorage();
    for (let i = 1; i <= 10; i += 1) guardarErrorDiagnostico({ origen: "prueba", message: `Error ${i}` }, storage);
    const errores = leerErroresDiagnostico(storage);
    expect(errores).toHaveLength(8);
    expect(errores[0].mensaje).toBe("Error 3");
    expect(errores[7].mensaje).toBe("Error 10");
  });

  it("registra la última sincronización sin depender del navegador", () => {
    const storage = crearStorage();
    const registro = registrarSincronizacionDiagnostico({ origen: "Pedidos", detalle: "Sin pendientes." }, storage, null);
    expect(registro.origen).toBe("Pedidos");
    expect(leerUltimaSincronizacionDiagnostico(storage)?.detalle).toBe("Sin pendientes.");
  });

  it("crea un informe técnico listo para copiar", () => {
    const informe = crearInformeTecnicoDiagnostico({
      versionActual: "127.7",
      versionRemota: "127.7",
      online: true,
      supabaseConfig: true,
      errores: [{ fecha: "2026-07-21", origen: "app", mensaje: "Prueba" }]
    });
    expect(informe).toContain("RAFIKI PEDIDOS — INFORME TÉCNICO");
    expect(informe).toContain("Versión instalada: 127.7");
    expect(informe).toContain("Internet: Online");
    expect(informe).toContain("Prueba");
  });
});
