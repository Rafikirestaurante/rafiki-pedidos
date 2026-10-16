# Fase 45B — Cambio de mesas y controles compactos

Base: 136.0, conserva el parche de insumos seleccionados y las adiciones.

1. Ejecutar supabase/2026-10-16-fase45b-cambiar-mesa.sql después del SQL de Fase 45.
2. Publicar el contenido de rafiki41_1300 incluyendo package.json y package-lock.json.
3. No reemplazar el servidor de impresión: esta actualización no incluye cambios de ese servidor.

Pedidos: Marcar como entregado pasa a Opciones y aparece Cambiar mesa como acción directa. Se conserva Agregar. El cambio de mesa usa las mismas clases, dos columnas y orden 1A/1B, 2A/2B, 3A/3B, 4A/4B y 5B que el panel Mesas. Muestra la mesa actual, permite elegir y requiere Confirmar cambio.

Mesas: Ver más y ⋯ pequeños en una fila. ⋯ contiene Agregar productos y Cambiar mesa. Una única ventana alterna entre menú y plano; no se superponen ventanas. Agregar cierra el menú y navega al panel completo de Mesas. La tarjeta sigue mostrando solo el último pedido de su mesa. El menú opera sobre ese último pedido.

Permisos: cualquier cuenta activa con acceso puede cambiar mesa, sin exigir rol administrador. Validación en Supabase. Se bloquean pedidos borrados/anulados/cancelados y pedidos para llevar. Conflictos entre dispositivos solicitan actualizar antes de reintentar.

El cambio conserva productos, adiciones, total, fecha, pago y meseros. Cambia mesa y ubicación; si el nombre del cliente era la mesa por defecto, actualiza ese texto. No altera cartera. Las comandas pendientes toman la nueva mesa; no reimprime comandas ya impresas. Queda auditoría con usuario, fecha y mesas anterior/nueva.

Verificación: compilación y pruebas en PostgreSQL embebido de migración repetible, conservación de datos, actualización de comandas pendientes, reintento idempotente, conflictos, mesa inválida y rechazo sin sesión. No se ejecutó la migración en el Supabase del usuario ni se probó físicamente la impresora.
