# Kiara — versión 137.0 / Fase 46

Módulo público en `https://TU-DOMINIO/kiara`, con el encabezado **Kiara · Asistente Virtual Rafiki** y apariencia de chat familiar. Usa Gemini por el servidor de Vercel. `/cliente` sigue siendo el enlace de Restaurante.

## Activación

1. En Supabase → SQL Editor, ejecutar `supabase/2026-10-19-fase46-kiara.sql`. Requiere la tabla de pedidos y el catálogo de productos de la aplicación actual. Se puede ejecutar nuevamente sin borrar datos.
2. En Vercel → proyecto → Settings → Environment Variables, agregar las variables privadas indicadas abajo para Production (y Preview si se va a probar allí).
3. Subir el contenido completo del ZIP a la raíz del repositorio, incluyendo `api/`, `server/`, `src/`, `supabase/`, `vercel.json`, `package.json` y **package-lock.json**. No subir el ZIP sin descomprimir ni borrar otras carpetas existentes.
4. Volver a desplegar. Abrir `/kiara` y probar: conversación, producto con opciones, revisión, confirmación y aparición en Pedidos hoy. Hacer una prueba pequeña de impresión con el servidor de impresión ya instalado.

## Variables de Vercel

| Variable | Valor |
| --- | --- |
| `GEMINI_API_KEY` | Clave de Google AI Studio con Gemini API habilitada. Se puede usar la misma del chatbot 0.6.0 si su proyecto permite ese uso; comparte su cuota. |
| `KIARA_SESSION_SECRET` | Cadena aleatoria privada de al menos 32 caracteres. Generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada `service_role` del mismo Supabase de Rafiki. **Nunca** ponerle prefijo `VITE_`, subirla al repositorio ni compartirla en el chat. |
| `SUPABASE_URL` | URL del mismo proyecto Supabase. También acepta la variable existente `VITE_SUPABASE_URL`. |
| `GEMINI_MODEL` | Opcional. Por defecto `gemini-3.5-flash-lite`, como en la referencia 0.6.0. Debe estar disponible para tu clave. |
| `GEMINI_FALLBACK_MODEL` | Opcional. Por defecto `gemini-2.5-flash`. Sólo se intenta si el primer modelo devuelve 404; no al agotar cuota. |
| `KIARA_ALLOWED_ORIGIN` | Opcional. Origen adicional exacto para un dominio distinto, incluyendo `https://`. El propio dominio ya está permitido. |

Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de la aplicación siguen siendo necesarias para los demás módulos. **No poner la clave de Gemini ni service_role en ninguna variable VITE_.** La clave no se introduce en la interfaz; se configura directamente en Vercel. La conexión real requiere cuota disponible.

## Funcionamiento

- Sólo se ofrecen filas activas y no agotadas de la línea Cafetería. Si el catálogo falla no se sustituye por un menú ficticio. Los sabores de bebidas se combinan con los tamaños y tarifas que ya usa `/mesas`.
- Parfait: 1–3 frutas; tercera fruta +$1.000. Desayunos principales: acompañante y bebida. Los desayunos incluyen en el precio mostrado $1.000 de empaque para llevar, igual que la operación actual. Batidos cremosos y jugos: base obligatoria.
- Se puede escribir a Gemini o agregar desde Ver menú. Ver mi pedido permite aumentar, reducir o quitar productos.
- Gemini propone un carrito; el servidor valida IDs, cantidades, opciones, disponibilidad y precios. No recibe facultad para crear pedidos. Una respuesta con productos u opciones inválidos conserva el carrito anterior.
- El cliente revisa el resumen, completa nombre, teléfono y pago, y pulsa **Confirmar pedido**. En esta primera entrega los pedidos son **para recoger en el local**; no se ofrecen domicilios, tarifas de envío, pedidos a crédito ni pagos en línea. Efectivo y Transferencia son formas de pago declaradas, sin afirmar pago verificado.
- El pedido se guarda en `pedidos`, estado Pendiente, origen Kiara, mesero Kiara, tipo llevar, ítems de cafetería. Usa el flujo existente de Pedidos hoy y la cola normal de impresión; no cambia el servidor de impresión. La confirmación del chat acredita registro, no impresión ni pago.
- El ID acompaña las revisiones y la confirmación es atómica e idempotente: reintentar el mismo pedido devuelve su número sin insertar otro. Tras confirmarlo, el chat ofrece Hacer otro pedido.
- El carrito firmado vence en dos horas. El historial y el carrito se conservan sólo en la sesión de la pestaña; el formulario de nombre/teléfono no se guarda en ese historial. Los mensajes se envían a Gemini para responder; no enviar datos de tarjetas o contraseñas.
- Límites persistentes: 120 solicitudes/hora por IP, 40 mensajes a Gemini/hora por IP, 1.000 mensajes globales/día. Se pueden ajustar en el SQL. Son un control de consumo, no una garantía de coste; configurar también la cuota del proyecto de Google. Las redes compartidas comparten límite por IP.

## Diagnóstico

- «Kiara aún no está configurada»: comprobar variables privadas y redesplegar.
- «Revisa la instalación»: ejecutar SQL Fase 46 en el Supabase correcto.
- Error de menú: comprobar `catalogo_productos` y la columna `agotado`; mantener productos y disponibilidad actualizados.
- Modelo no disponible: configurar `GEMINI_MODEL` con uno habilitado para la clave.
- Cambio de precio: abrir de nuevo Ver mi pedido, revisar el total actualizado y confirmar.
- Conversación vencida o producto retirado del catálogo: usar Iniciar de nuevo.
- `npm run dev` sólo ejecuta Vite, no funciones de Vercel. Para probar la conversación local completa usar el runtime de Vercel y variables de desarrollo, o un despliegue Preview. Nunca probar contra la operación real sin identificar y controlar el pedido de prueba.

## Validación de esta entrega

Compilación de producción, pruebas automatizadas del catálogo, opciones, precios, firma, errores de Gemini, confirmación explícita y reintentos; migración SQL ejecutada dos veces en PostgreSQL embebido, permisos públicos bloqueados, límite persistente e idempotencia.
No se pudo ejecutar una prueba visual en navegador en este entorno.
El chequeo histórico `metadata:check` detecta ocho documentos de fases anteriores que no están en la base recibida; no afecta `npm run build`.
La conversación real con Gemini, el proyecto Supabase del negocio y la impresión física necesitan las credenciales/configuración del despliegue y deben verificarse después de activar. No se incluyen claves privadas en el ZIP.
