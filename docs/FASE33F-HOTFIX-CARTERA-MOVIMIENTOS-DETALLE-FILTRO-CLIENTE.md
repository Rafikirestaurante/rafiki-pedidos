# Fase 33F - Hotfix Cartera movimientos detalle y filtro cliente

## Objetivo

Mejorar la subsección **Movimientos** del módulo de Cartera para que sea más útil en la operación diaria y auditoría de créditos.

## Cambios aplicados

### 1. Tabla de movimientos más clara

Se ajustó la tabla principal de movimientos para conservar:

- Fecha.
- Pedido.
- Cliente.
- Valor.
- Estado.
- Saldo.

Y se retiraron de esta vista:

- Concepto.
- Observación.

También se agregó la columna **Pedido realizado**, donde se muestra de manera compacta el contenido del pedido asociado al movimiento de cartera.

### 2. Detalle compacto del pedido

La carga de movimientos ahora intenta enriquecer cada movimiento consultando el pedido asociado por `pedido_id` en la tabla `pedidos`.

Prioridad del detalle mostrado:

1. `items` estructurados del pedido.
2. `pedido_texto` del pedido.
3. `concepto` del movimiento como respaldo.

No se agregaron columnas nuevas en Supabase.

### 3. Filtro por cliente

Se agregó un selector de cliente en la subsección Movimientos.

Este filtro puede combinarse con:

- Búsqueda por texto.
- Estado.
- Fecha inicio.
- Fecha fin.
- Filtros rápidos como Créditos de hoy, Ayer, Últimos 7 días y Pendientes.

Los filtros rápidos conservan el cliente seleccionado.

### 4. Resumen visual ajustado

Los cuadros de resumen de movimientos fueron convertidos en tarjetas compactas para evitar que los textos **Valor filtrado** y **Saldo filtrado** se salgan del contenedor.

## Archivos modificados

- `src/modules/cartera/components/CarteraClientesCredito.jsx`
- `src/services/carteraService.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`

## SQL

No requiere SQL nuevo.
