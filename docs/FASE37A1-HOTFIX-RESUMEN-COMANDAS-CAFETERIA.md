# Fase 37A.1 — Hotfix resumen y comandas de Cafetería

Versión: `127.9-FASE37A1-HOTFIX-RESUMEN-COMANDAS-CAFETERIA-2026-07-22`

## Problema detectado

La corrección de Fase 36B.7 se había limitado a Parfait y Batidos dentro del componente de Resumen del pedido. El formato no estaba centralizado y otras superficies continuaban armando sus propios textos. Esto podía producir nombres confusos o repetidos como `Parfait Parfait 12 oz...`, mantener `Jugo tradicional` separado de `Fresa 12 oz / Agua` y generar comandas térmicas distintas al resumen visual.

## Corrección

Se consolidó una regla canónica en `src/shared/utils/resumenPedidoDisplay.js` para limpiar y presentar productos de Cafetería.

- Parfait: `Parfait 12 oz · Banano, Arándanos, Uva`.
- Batido cremoso: `Milo 12 oz`; la base, por ejemplo `Helado`, permanece como detalle adicional.
- Batido refrescante: `Maracuyá 16 oz`.
- Jugo tradicional: `Fresa 12 oz · Agua`.

La función también tolera textos heredados que ya contengan prefijos repetidos, por ejemplo `Parfait Parfait...` o `Jugo tradicional Fresa...`.

## Superficies cubiertas

La misma regla se utiliza ahora en:

- Resumen del pedido (`/cliente`, `/mesas`, `/cliente-beta` y `/mesas-beta`).
- Texto persistido del pedido para nuevos pedidos.
- Pedidos Hoy y detalle administrativo.
- Resumen compacto de Pedidos Hoy.
- Resumen de pedido dentro de Cartera.
- Generación de comandas de Cafetería usadas por la impresión del navegador/Rafiki Print Server.

No se cambian precios, cantidades, reglas de acompañantes, cálculo de totales, Supabase ni la migración de registro de clientes de Fase 37A.

## Blindaje

Se agrega `npm run cafeteria-summary:check` con casos específicos para Parfait duplicado, Jugo tradicional con base, Batido cremoso, resumen visual, texto persistido, Pedidos Hoy, Cartera y comanda térmica. El control queda integrado en `npm run check`.
