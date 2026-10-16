# Fase 41 — Control diario de disponibilidad y ventas

Se agrega control compartido por fecha y plato. La cantidad estimada vacía no crea restricción. Las ventas se calculan desde pedidos activos del día, excluyendo estados borrados, anulados y cancelados. La actualización usa Realtime de Supabase y una recarga periódica de respaldo.

Ejecutar `supabase/2026-09-24-fase41-disponibilidad-menu.sql` una sola vez.


## Fase 41B
Se agrega total de almuerzos vendidos y control equivalente para acompañantes, incluyendo cantidades estimadas, ventas, indicadores y alertas.
