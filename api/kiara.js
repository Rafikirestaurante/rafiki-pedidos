import { createClient } from "@supabase/supabase-js";
import {
  crearCatalogo,
  validarCarrito,
  validarCliente,
  crearItems,
  totalCarrito,
  ErrorKiara
} from "../server/kiara/catalogo.js";
import { firmarEstado, leerEstado, hashIp } from "../server/kiara/seguridad.js";
import { conversarGemini } from "../server/kiara/gemini.js";

export function crearHandler({ env = process.env, cliente, conversar = conversarGemini } = {}) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Método no permitido." });
    }
    try {
      const origen = req.headers.origin;
      const host = req.headers.host;
      if (origen && ![`https://${host}`, `http://${host}`, env.KIARA_ALLOWED_ORIGIN].includes(origen))
        throw new ErrorKiara("Origen no autorizado.", 403);
      const secret = env.KIARA_SESSION_SECRET;
      const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
      if (!secret || secret.length < 32 || !url || !env.SUPABASE_SERVICE_ROLE_KEY)
        throw new ErrorKiara("Kiara aún no está configurada. Contacta a Rafiki.", 503);
      const db =
        cliente ||
        createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (
        !body ||
        JSON.stringify(body).length > 32000 ||
        !["iniciar", "chat", "carrito", "confirmar"].includes(body.accion)
      )
        throw new ErrorKiara("Solicitud no válida.");
      const estado = leerEstado(body.token, secret);
      if (body.accion === "confirmar" && (!body.token || body.confirmado !== true))
        throw new ErrorKiara("Revisa y confirma el pedido antes de enviarlo.");
      const ip = String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "local")
        .split(",")[0]
        .trim();
      const limite = await db.rpc("kiara_limitar_solicitudes", {
        p_clave: hashIp(ip, secret),
        p_chat: body.accion === "chat"
      });
      if (limite.error)
        throw new ErrorKiara("Kiara no está lista. Revisa la instalación de la actualización.", 503);
      if (limite.data !== true)
        throw new ErrorKiara("Has realizado muchas consultas. Intenta más tarde.", 429);
      if (body.accion === "confirmar") {
        const previo = await db
          .from("pedidos")
          .select("id,numero_pedido,total,origen")
          .eq("id", estado.pedidoId)
          .maybeSingle();
        if (previo.error)
          throw new ErrorKiara("No pude verificar el pedido. Intenta de nuevo sin iniciar otro.", 503);
        if (previo.data?.origen === "Kiara")
          return res
            .status(200)
            .json({
              pedido: { numero: previo.data.numero_pedido, total: previo.data.total },
              respuesta: "Tu pedido ya está registrado."
            });
      }
      const { data, error } = await db
        .from("catalogo_productos")
        .select("id,linea,categoria,nombre,precio,activo,agotado,orden")
        .order("orden");
      if (error) throw new ErrorKiara("No pude consultar el menú. Intenta en un momento.", 503);
      const catalogo = crearCatalogo(data || []);
      let carrito = validarCarrito(body.accion === "carrito" ? body.carrito : estado.carrito, catalogo);
      let respuesta = "¡Hola! Soy Kiara 👋 ¿Qué te gustaría pedir hoy? Puedes escribirme o abrir el menú.";
      if (body.accion === "chat") {
        if (typeof body.mensaje !== "string" || !body.mensaje.trim() || body.mensaje.length > 1500)
          throw new ErrorKiara("Escribe un mensaje de hasta 1500 caracteres.");
        const salida = await conversar({
          mensaje: body.mensaje.trim(),
          historial: body.historial,
          catalogo,
          carrito,
          env
        });
        try {
          carrito = validarCarrito(salida.carrito, catalogo);
          respuesta = salida.respuesta;
        } catch (e) {
          if (!(e instanceof ErrorKiara)) throw e;
          respuesta = e.message + " El resto de tu pedido sigue igual.";
        }
      }
      if (body.accion === "carrito") {
        carrito = validarCarrito(body.carrito, catalogo);
        respuesta = "Actualicé tu pedido. Puedes seguir eligiendo o revisarlo antes de confirmar.";
      }
      const total = totalCarrito(carrito);
      if (body.accion === "confirmar") {
        if (!carrito.length) throw new ErrorKiara("Agrega productos antes de confirmar.");
        const totalAnterior = totalCarrito(estado.carrito);
        if (total !== totalAnterior)
          throw new ErrorKiara(
            "Cambió el precio de un producto. Abre Ver mi pedido para actualizar el total antes de confirmar.",
            409
          );
        const c = validarCliente(body.cliente);
        const texto = carrito
          .map((l) => `${l.cantidad} x ${l.nombre}${l.detalle ? " - " + l.detalle : ""}`)
          .join("\n");
        const payload = {
          id: estado.pedidoId,
          cliente: c.nombre,
          cliente_nombre: c.nombre,
          telefono: c.telefono,
          ubicacion: "Recoger en el local",
          tipo_pago: c.pago,
          tipo_pedido: "llevar",
          mesa: "Llevar",
          mesero: "Kiara",
          observaciones: `KIARA · Recoger en el local${c.notas ? " · " + c.notas : ""}`,
          items: crearItems(carrito),
          pedido_texto: texto,
          total,
          estado: "Pendiente",
          enviado_whatsapp: false,
          origen: "Kiara"
        };
        const resultado = await db.rpc("kiara_crear_pedido", { p_pedido: payload });
        if (resultado.error || !resultado.data)
          throw new ErrorKiara(
            "No pude confirmar el registro. Pulsa Confirmar de nuevo: no se duplicará.",
            503
          );
        return res
          .status(200)
          .json({
            pedido: resultado.data,
            respuesta:
              "¡Listo! Tu pedido quedó registrado para recoger en Rafiki. El pago se realiza con el local."
          });
      }
      // El mismo ID acompaña las revisiones; una confirmación reintentada es idempotente.
      return res
        .status(200)
        .json({ respuesta, catalogo, carrito, total, token: firmarEstado(carrito, secret, estado) });
    } catch (error) {
      const conocido = error instanceof ErrorKiara;
      return res
        .status(conocido ? error.status : 500)
        .json({
          error: conocido
            ? error.message
            : "No pude procesar la solicitud. Tu pedido sigue igual; intenta de nuevo."
        });
    }
  };
}
export default crearHandler();
