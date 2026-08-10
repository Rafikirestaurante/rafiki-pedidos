# Fase 37C — Filtros de insumos y llave de transferencia

Versión: `127.13-FASE37C-FILTROS-INSUMOS-LLAVE-TRANSFERENCIA-2026-07-30`

Base: `127.12-FASE37B1-ZOOM-GESTOS-NAVEGACION-COMPACTA-2026-07-30.zip`.

## 1. Solicitud de insumos

En `Admin > Solicitud de insumos > Insumos pendientes` se incorporaron cuatro filtros compactos:

- **Todo el día:** solicitudes AM y PM de la fecha base.
- **AM:** únicamente solicitudes realizadas en la mañana de la fecha base.
- **PM:** únicamente solicitudes realizadas en la tarde de la fecha base.
- **PM anterior + AM actual:** combina la tarde del día anterior con la mañana de la fecha seleccionada.

La fecha del selector funciona como fecha base. El filtro combinado consulta dos fechas en Supabase, pero solo presenta los productos que corresponden a las jornadas requeridas. Los estados locales de comprado, cantidad y envío por WhatsApp siguen separados por fecha e insumo.

No se modifica la tabla `solicitudes_insumos` porque cada producto ya conserva `jornadaSolicitud` y `horaSolicitud` dentro del JSON `insumos`.

## 2. Llave para transferencias en `/cliente`

Cuando el cliente selecciona **Transferencia** como forma de pago, aparece una tarjeta con:

- Llave: `0090381033`.
- Botón **Copiar llave**.
- Confirmación visual después de copiar.

La función usa Clipboard API y conserva un mecanismo de respaldo para navegadores sin acceso directo al portapapeles. Se incorporó tanto al componente oficial como a la variante beta de `/cliente`.

## Alcance técnico

No requiere migración de Supabase. No cambia precios, totales, Caja, Cartera, comandas, permisos ni métodos de pago existentes.
