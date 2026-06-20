# Fase 33 — Blindaje de Cartera

Esta fase fortalece el módulo de Cartera para manejar créditos reales con menor riesgo de descuadres.

## Cambios incluidos

1. **Abonos seguros con RPC**
   - `registrarAbonoClienteCredito` ahora llama la función SQL `registrar_abono_cliente_credito`.
   - El abono, la actualización de movimientos y el recálculo del cliente se ejecutan en una sola transacción.

2. **Clientes crédito únicos**
   - Se agrega `nombre_normalizado` en `clientes_credito`.
   - Se crea índice único para evitar duplicados por tildes, mayúsculas, puntos o espacios.
   - El servicio usa `upsert` por `nombre_normalizado`.

3. **Métodos de pago controlados**
   - Se centralizan métodos en `src/shared/constants/paymentMethods.js`.
   - Se reduce dependencia de textos libres como `credito`, `Crédito` o variantes.

4. **Valores monetarios enteros**
   - Se agrega `src/shared/utils/money.js`.
   - Cartera redondea valores a pesos enteros.
   - El SQL agrega restricciones `check` para nuevos registros.

5. **Confirmación visual de abonos**
   - Se elimina `window.confirm`.
   - El abono se confirma con `RafikiModal`, mostrando cliente, saldo actual, abono y saldo estimado.

## SQL requerido

Ejecutar en Supabase SQL Editor:

`supabase/2026-06-20-fase33-blindaje-cartera.sql`

Sin este SQL, la app mostrará un mensaje indicando que falta activar la RPC de Fase 33.

## Complemento 33F — Control diario de créditos

La versión `123.1` agrega control operativo para cierre de caja:

- indicador **Créditos otorgados hoy**,
- indicador **Abonos recibidos hoy**,
- filtros rápidos en Movimientos,
- fechas comparadas con horario `America/Bogota`,
- movimientos pagados visibles cuando existe filtro por fecha,
- resumen de valor original filtrado y saldo filtrado.

Documento detallado: `docs/FASE33F-CONTROL-DIARIO-CREDITOS.md`.
