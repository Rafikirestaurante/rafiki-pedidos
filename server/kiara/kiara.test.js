import { calcularTotalItems } from "../../src/shared/utils/pedidos.js";
import { describe, it, expect, vi } from "vitest";
import { crearCatalogo, validarCarrito, validarCliente, crearItems, totalCarrito } from "./catalogo.js";
import { firmarEstado, leerEstado } from "./seguridad.js";
import { conversarGemini } from "./gemini.js";
import { crearHandler } from "../../api/kiara.js";
const secret = "clave-solo-para-pruebas-con-al-menos-32-caracteres";
const rows = [
  {
    id: "cafe",
    linea: "Cafetería",
    categoria: "Bebidas",
    nombre: "Café americano",
    precio: 3500,
    activo: true
  },
  {
    id: "parfait",
    linea: "Cafetería",
    categoria: "Parfait",
    nombre: "Parfait 12 oz",
    precio: 12500,
    activo: true
  },
  {
    id: "batido",
    linea: "Cafetería",
    categoria: "Batidos cremosos",
    nombre: "Mambo",
    precio: null,
    activo: true
  },
  {
    id: "huevo",
    linea: "Cafetería",
    categoria: "Desayunos",
    nombre: "Huevos revueltos",
    precio: 11000,
    activo: true
  },
  { id: "pollo", linea: "Restaurante", categoria: "Proteínas", nombre: "Pollo", precio: 15000, activo: true },
  {
    id: "agotado",
    linea: "Cafetería",
    categoria: "Bebidas",
    nombre: "Agotado",
    precio: 3500,
    activo: true,
    agotado: true
  },
  {
    id: "inactivo",
    linea: "Cafetería",
    categoria: "Bebidas",
    nombre: "Inactivo",
    precio: 3500,
    activo: false
  }
];
const catalogo = crearCatalogo(rows);
const linea = { productoId: "cafe", cantidad: 2, opciones: {}, precio: 1 };
const env = {
  KIARA_SESSION_SECRET: secret,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "solo-pruebas",
  GEMINI_API_KEY: "gemini-pruebas"
};
function dbMock() {
  const insertados = new Map();
  return {
    insertados,
    from: vi.fn((_table) => ({
      select: () => ({
        order: async () => ({ data: rows }),
        eq: (_c, id) => ({ maybeSingle: async () => ({ data: insertados.get(id) || null }) })
      })
    })),
    rpc: vi.fn(async (nombre, args) => {
      if (nombre === "kiara_limitar_solicitudes") return { data: true };
      const p = args.p_pedido;
      if (!insertados.has(p.id)) insertados.set(p.id, { ...p, numero_pedido: 101 });
      return { data: { numero: 101, total: insertados.get(p.id).total } };
    })
  };
}
async function llamar(handler, body, headers = {}) {
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    status(s) {
      this.statusCode = s;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    }
  };
  await handler({ method: "POST", body, headers: { host: "rafiki.test", ...headers } }, res);
  return res;
}
describe("catálogo y cobro Kiara", () => {
  it("excluye restaurante, agotados e inactivos; expande tamaños sin inventar sabores", () => {
    expect(catalogo.map((p) => p.id)).toEqual([
      "cafe",
      "parfait",
      "batido:12 oz",
      "batido:16 oz",
      "batido:22 oz",
      "huevo"
    ]);
    expect(() => crearCatalogo([])).toThrow();
  });
  it("usa precio del catálogo aunque el cliente mande otro; sólo imprime cafetería", () => {
    const cart = validarCarrito([linea], catalogo);
    expect(totalCarrito(cart)).toBe(7000);
    expect(crearItems(cart)[0]).toMatchObject({
      categoria: "cafeteria",
      area: "cafeteria",
      precio: 3500,
      cantidad: 2,
      paraLlevar: true
    });
  });
  it("exige opciones válidas y cobra la tercera fruta", () => {
    expect(() => validarCarrito([{ productoId: "batido:12 oz", cantidad: 1 }], catalogo)).toThrow(/base/);
    expect(() => validarCarrito([{ productoId: "huevo", cantidad: 1 }], catalogo)).toThrow(/acompanante/);
    const cart = validarCarrito(
      [{ productoId: "parfait", cantidad: 1, opciones: { frutas: ["Fresa", "Banano", "Uva"] } }],
      catalogo
    );
    expect(cart[0].precio).toBe(13500);
    expect(() =>
      validarCarrito(
        [{ productoId: "parfait", cantidad: 1, opciones: { frutas: ["Fresa", "Fresa"] } }],
        catalogo
      )
    ).toThrow();
  });
  it("coincide con el total operativo incluido empaque de desayuno", () => {
    const cart = validarCarrito(
      [
        { productoId: "huevo", cantidad: 2, opciones: { acompanante: "Arepa", bebida: "Tinto" } },
        { productoId: "batido:12 oz", cantidad: 1, opciones: { base: "Helado" } }
      ],
      catalogo
    );
    expect(cart[0].precio).toBe(12000);
    expect(totalCarrito(cart)).toBe(calcularTotalItems(crearItems(cart)));
  });
  it("rechaza productos ajenos, cantidades fraccionadas, opciones inventadas y crédito público", () => {
    for (const x of [
      { ...linea, productoId: "pollo" },
      { ...linea, cantidad: -1 },
      { ...linea, cantidad: 1.5 },
      { ...linea, cantidad: 21 }
    ])
      expect(() => validarCarrito([x], catalogo)).toThrow();
    expect(() => validarCliente({ nombre: "Rafa", telefono: "3001234567", pago: "Crédito" })).toThrow();
  });
  it("rechaza alteraciones y conversaciones vencidas", () => {
    const token = firmarEstado([], secret);
    expect(leerEstado(token, secret).carrito).toEqual([]);
    expect(() => leerEstado(token.replace(token[0], token[0] === "e" ? "x" : "e"), secret)).toThrow();
    vi.useFakeTimers();
    vi.setSystemTime(new Date());
    const t = firmarEstado([], secret);
    vi.advanceTimersByTime(7200001);
    expect(() => leerEstado(t, secret)).toThrow(/venció/);
    vi.useRealTimers();
  });
});
describe("precio del catálogo en vistas operativas", () => {
  it("conserva el precio confirmado aunque difiera de las tarifas locales antiguas", () => {
    const actual = crearCatalogo(rows.map((r) => (r.id === "cafe" ? { ...r, precio: 4200 } : r)));
    const cart = validarCarrito([linea], actual);
    expect(totalCarrito(cart)).toBe(8400);
    expect(calcularTotalItems(crearItems(cart))).toBe(8400);
  });
});
describe("Gemini y confirmación", () => {
  it("envía la clave sólo por cabecera y recibe JSON estructurado", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify({ respuesta: "¿Qué deseas?", carrito: [] }) }] } }
        ]
      })
    }));
    const r = await conversarGemini({
      mensaje: "Hola",
      historial: [],
      catalogo,
      carrito: [],
      env,
      fetchImpl
    });
    expect(r.carrito).toEqual([]);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).not.toContain(env.GEMINI_API_KEY);
    expect(options.headers["x-goog-api-key"]).toBe(env.GEMINI_API_KEY);
    expect(JSON.parse(options.body).generationConfig.responseMimeType).toBe("application/json");
  });
  it("no reintenta consumos cuando Gemini devuelve cuota; conserva errores claros", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 429 }));
    await expect(
      conversarGemini({ mensaje: "Hola", catalogo, carrito: [], env, fetchImpl })
    ).rejects.toMatchObject({ status: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("un chat nunca crea un pedido y una salida inválida conserva el carrito", async () => {
    const db = dbMock();
    const handler = crearHandler({
      env,
      cliente: db,
      conversar: async () => ({ respuesta: "Listo", carrito: [{ productoId: "pollo", cantidad: 1 }] })
    });
    const t = firmarEstado(validarCarrito([linea], catalogo), secret);
    const r = await llamar(handler, { accion: "chat", mensaje: "Pollo", token: t });
    expect(r.statusCode).toBe(200);
    expect(r.body.total).toBe(7000);
    expect(r.body.carrito[0].productoId).toBe("cafe");
    expect(db.insertados.size).toBe(0);
  });
  it("confirma con precios reales y un reintento devuelve el mismo pedido", async () => {
    const db = dbMock();
    const handler = crearHandler({ env, cliente: db });
    const { body } = await llamar(handler, { accion: "carrito", carrito: [linea] });
    const payload = {
      accion: "confirmar",
      token: body.token,
      confirmado: true,
      cliente: { nombre: "Rafa", telefono: "3001234567", pago: "Efectivo" }
    };
    expect((await llamar(handler, { ...payload, confirmado: false })).statusCode).toBe(400);
    const a = await llamar(handler, payload),
      b = await llamar(handler, payload);
    expect(a.body.pedido).toEqual({ numero: 101, total: 7000 });
    expect(b.body.pedido).toEqual(a.body.pedido);
    expect(db.insertados.size).toBe(1);
    expect([...db.insertados.values()][0].items[0].area).toBe("cafeteria");
  });
  it("detecta cambio de precios antes del envío y rechaza orígenes ajenos", async () => {
    const db = dbMock();
    const handler = crearHandler({ env, cliente: db });
    const cart = validarCarrito([linea], catalogo);
    cart[0].precio = 100;
    const r = await llamar(handler, {
      accion: "confirmar",
      token: firmarEstado(cart, secret),
      confirmado: true,
      cliente: { nombre: "Rafa", telefono: "3001234567", pago: "Efectivo" }
    });
    expect(r.statusCode).toBe(409);
    expect(db.insertados.size).toBe(0);
    expect((await llamar(handler, { accion: "iniciar" }, { origin: "https://otro.test" })).statusCode).toBe(
      403
    );
  });
  it("falla cerrado sin configuración, sin menú o al alcanzar límites", async () => {
    expect((await llamar(crearHandler({ env: {} }), { accion: "iniciar" })).statusCode).toBe(503);
    const db = dbMock();
    db.rpc = vi.fn(async () => ({ data: false }));
    expect((await llamar(crearHandler({ env, cliente: db }), { accion: "iniciar" })).statusCode).toBe(429);
  });
});
