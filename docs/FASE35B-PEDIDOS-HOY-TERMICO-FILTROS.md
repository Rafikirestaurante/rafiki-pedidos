# Fase 35B — Pedidos Hoy térmico con filtros activos

Versión: `125.1-FASE35B-PEDIDOS-HOY-TERMICO-FILTROS-2026-06-30`

## Objetivo

Profundizar la impresión térmica de **Pedidos Hoy** para que los informes filtrados puedan salir en impresoras de **58 mm** y **80 mm** con la **misma información**. La diferencia entre formatos se mantiene únicamente en ancho, tamaño, saltos de línea y compactación visual.

## Regla validada

- 58 mm no elimina campos.
- 80 mm no agrega información exclusiva.
- Ambos formatos usan la misma data filtrada en pantalla.
- La diferencia es solo visual.

## Cambios realizados

### 1. Clasificación robusta de pedidos

Se restauraron y reforzaron funciones internas para identificar correctamente:

- Restaurante para llevar.
- Cafetería para llevar.
- Restaurante en mesa.
- Cafetería en mesa.
- Pedidos mixtos Restaurante + Cafetería.
- Pedidos sin `items` estructurados usando texto operativo como respaldo.

Esto protege que la impresión use la misma clasificación de los filtros rápidos.

### 2. Impresión ampliada de Pedidos Hoy

El informe térmico ahora incluye:

- Fecha de impresión.
- Rango o búsqueda aplicada.
- Filtros rápidos activos.
- Orden de visualización: últimos o primeros.
- Cantidad impresa frente a pedidos cargados.
- Total de ventas.
- Cantidad para llevar.
- Cantidad en mesa.
- Cantidad Restaurante.
- Cantidad Cafetería.
- Pendientes y finalizados.
- Totales por método de pago.
- Detalle por pedido.

### 3. Detalle por pedido

Cada pedido impreso incluye:

- Número de pedido y hora.
- Cliente.
- Destino y ubicación.
- Línea: Restaurante, Cafetería o mixto.
- Pago y estado.
- Detalle compacto del pedido.
- Total.

### 4. Impresión desde filtros rápidos

Además de los botones visibles `58 mm` y `80 mm`, el modal de filtros rápidos ahora también permite imprimir directamente el resultado actual en ambos formatos.

### 5. Motor térmico mejorado

El servicio central `thermalReportService.js` ahora soporta líneas largas o multilínea en campos de detalle, útil para pedidos con varios productos o especificaciones.

## Archivos modificados

- `src/modules/admin/components/pedidos/AdminPedidosSection.jsx`
- `src/modules/impresion/thermalReportService.js`
- `src/styles/appStyles.js`
- `scripts/validate-thermal-pedidos-hoy.mjs`
- `package.json`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`

## Archivos no modificados

No se tocó:

- `/cliente`
- `/mesas`
- Caja
- Cartera
- Dashboard
- SQL
- Guardado de pedidos
- Impresión actual de comandas/tickets

## Pruebas recomendadas

1. Entrar a `/admin`.
2. Abrir Pedidos Hoy.
3. Aplicar filtro Restaurante para llevar.
4. Imprimir 58 mm y 80 mm.
5. Confirmar que la información sea la misma.
6. Repetir con Cafetería para llevar.
7. Repetir con Restaurante en mesa.
8. Repetir con tipo de pago.
9. Revisar que aparezcan totales por método de pago.
10. Revisar que cada pedido muestre detalle, destino, pago, estado y total.

## Validación técnica

Comandos recomendados:

```bash
npm run thermal-pedidos-hoy:check
npm run thermal-reports:check
npm run pwa:check
npm run build
npm run lint
```
