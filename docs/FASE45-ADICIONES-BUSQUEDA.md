# Fase 45 — Adiciones a pedidos existentes

Base: 135.3 más parche 135.3.1 de insumos visibles.

## Instalación (en este orden)
1. La Fase 44 de Cartera y la Fase 42 de usuarios deben estar instaladas. Ejecutar en Supabase SQL Editor: supabase/2026-10-14-fase45-adiciones-pedidos.sql.
2. Detener el servidor de impresión anterior e instalar el .py incluido en servidor_impresion. Conservar rafiki_config.json, preferencias y archivos de historial en su carpeta habitual. Solo un servidor debe estar activo por impresora. Si usas un .exe, recompilar con PyInstaller según el procedimiento habitual.
3. Publicar el contenido de rafiki41_1300 en la raíz del proyecto, incluyendo package.json y package-lock.json. La carpeta servidor_impresion se usa en el PC de la impresora, no forma parte de la app web.
4. Probar primero un pedido pequeño: ordenar, agregar desde otro usuario/mesero y comprobar que cocina recibe únicamente los nuevos productos. Si el original aún no estaba impreso, debe salir una comanda inicial y otra de adición con contenido separado.

## Operación
Agregar aparece en Pedidos, en cada mesa con pedido y en su detalle. Está disponible para cuentas activas con acceso a Pedidos hoy, sin exigir el permiso administrativo de editar. Abre el mismo panel de /mesas, normal o compacto, con los productos nuevos vacíos y los datos originales precargados. Cliente y pago se conservan; mesero puede cambiar. Cambiar de mesa pide confirmación y se aplica al pedido original al enviar, no antes. Cancelar no modifica el original.

Enviar a cocina acumula productos y total en el pedido original, lo devuelve a Pendiente y registra fecha, usuario, mesero y mesa de la adición. No crea una segunda venta ni un segundo número de pedido. Mantiene la fecha original de la venta, incluso si se agrega otro día. La actualización del movimiento a crédito es transaccional; si falta su movimiento vigente, se rechaza la operación para no perder cartera. Un cambio de mesa/pago desde otro dispositivo exige volver a abrir Agregar.

Las adiciones requieren conexión; un reintento del mismo envío usa una clave idempotente. Si se pierde la respuesta, reintentar sin salir del panel. El servidor imprime pedido_adiciones, conserva el número original y marca únicamente esa adición. Una fotografía del pedido inicial evita incluir adiciones en su primera comanda. Un registro local permite recuperar la confirmación después de imprimir una adición sin repetirla si falla la confirmación en Supabase. Conservar rafiki_adiciones_impresas.json junto a la configuración.

Inventario: al entregar, cada adición se procesa por un lote independiente sin descontar otra vez los productos iniciales. Se conservan las reglas y recetas existentes.

Buscar contiene Desde/Hasta para la búsqueda general. Buscar número sin fecha sigue siendo independiente.

## Validación y límites
Compilación de producción; 27 pruebas existentes; prueba de migración en PostgreSQL embebido: instalación repetible, dos adiciones, reintento sin duplicar, cambio de mesa, meseros, saldo de cartera y rechazo sin cuenta activa. Servidor: compilación Python y pruebas aisladas de separación/confirmación de comandas. No se ejecutó el SQL en el Supabase del usuario ni se probó una impresora física o un ejecutable Windows. Un corte eléctrico durante el envío físico puede dejar la impresión incierta, como en cualquier impresora sin confirmación de recibo.
