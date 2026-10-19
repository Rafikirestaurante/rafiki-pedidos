# Fase 46B — Kiara 137.1

## Cambios

1. Atención breve, amable y natural. Kiara hace una pregunta a la vez y puede ofrecer un complemento del catálogo cuando encaja, sin insistir ni inventar ingredientes. El tono se instruye a Gemini; revisar conversaciones reales después de desplegar.
2. Los parfaits guardan tamaño y frutas tanto en las opciones como en `producto`, `plato` y `proteina`, igual que `/mesas`. Así las frutas están en los campos de nombre que lee el servidor de impresión, aunque no utilice `detalle_impresion`. Tercera fruta y precios conservados. Se aplica a nuevos pedidos; los ya registrados no se modifican.
3. Se aclara expresamente a Gemini que para llevar SÍ está habilitado y se elimina el lenguaje de recogida exclusiva. El resumen dice Para llevar, permite ubicación/dirección opcional y guarda esa ubicación en el pedido. Si se deja vacía, se registra Recoger en el local. No se inventan ni se cobran tarifas de envío; tampoco se garantiza domicilio ni tiempo de entrega.
4. Campo Código de cliente en Ver mi pedido. Usa el mismo código activo de Clientes/Rafiki, normalizado como en `/cliente`; carga nombre, teléfono y ubicación sin crear otro registro. Los datos se pueden revisar y corregir. Buscar un código no registra pedidos ni habilita crédito. Si el código falla se pueden completar los datos manualmente. Sólo se consultan esos tres datos del registro. No se envían estos datos a Gemini.
5. Ver menú muestra primero las categorías. Al entrar en Batidos cremosos aparece cada sabor una sola vez; al escoger Frutos rojos se elige tamaño y después base. Igual para otros batidos y jugos. Búsqueda global por sabor/nombre/categoría. Gemini recibe el mismo orden conversacional.

## Instalación

Subir el contenido de este ZIP completo a GitHub y dejar que Vercel despliegue la actualización. Incluir `api`, `server`, `src`, `package.json` y `package-lock.json`. Conservar las variables ya configuradas. No hace falta ejecutar SQL nuevo si Fase 46 ya funciona. No sustituir el servidor de impresión.

Si aún no se instaló Fase 46, seguir `FASE46-KIARA-INSTALACION.md` para variables y SQL iniciales. El código de cliente requiere la tabla `clientes_especiales` ya utilizada por la aplicación actual; si faltase, el formulario manual sigue funcionando.

## Comprobación tras desplegar

- Abrir `/kiara` y empezar un pedido nuevo para probar sin contexto de respuestas antiguas.
- Ver menú → Batidos cremosos → Frutos rojos → tamaño → base.
- Escribir «quiero un batido cremoso» y comprobar que Kiara consulta sabor antes del tamaño.
- Pedir un parfait con frutas y confirmar una prueba controlada; comprobar en el ticket tamaño y frutas.
- En Ver mi pedido introducir un código de cliente activo, verificar datos cargados, corregir si hace falta y confirmar.
- Decir «lo quiero para llevar» y comprobar que no se rechace.

## Validación

Pruebas de agrupación de sabores/tamaños, frutas en los campos de comanda, precios y empaque, normalización y búsqueda de código activo, errores de código, ubicación opcional, firma, reintentos y confirmación explícita. Compilación de producción y lint del código de Kiara.

Sin acceso al Gemini del negocio ni a la impresora física en este entorno. La prueba final del tono, códigos reales y ticket se hace después de desplegar. El chequeo histórico de metadatos sigue señalando ocho documentos antiguos ausentes en la base recibida; no bloquea `npm run build`.
