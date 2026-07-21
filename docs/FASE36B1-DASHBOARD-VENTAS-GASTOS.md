# Fase 36B.1 — Dashboard mensual de ventas y gastos

Versión: `127.0-FASE36B1-DASHBOARD-VENTAS-GASTOS-2026-07-21`

## Objetivo

Incorporar al Dashboard de Rafiki Pedidos una visualización mensual que permita revisar rápidamente el comportamiento diario de las ventas y los gastos.

## Cambios principales

- Calendario mensual con total vendido y cantidad de pedidos por día.
- Gráfica de barras con comparación de ventas diarias.
- Navegación entre meses y acceso rápido al mes actual.
- Indicadores de ventas del mes, gastos del mes, promedio diario, mejor día, pedidos y ticket promedio.
- Detalle al seleccionar un día con:
  - Total vendido.
  - Total de gastos.
  - Resultado ventas menos gastos.
  - Pedidos.
  - Ticket promedio.
- Botón para abrir el informe completo del día seleccionado.
- Exclusión de pedidos borrados del cálculo de ventas.
- Carga de gastos directamente desde `gastos_diarios` según la fecha registrada.

## Decisión funcional

No se muestra ningún desglose por forma de pago dentro del nuevo calendario mensual. El objetivo del detalle diario es comparar ventas y gastos, no presentar el arqueo de Caja.

## Alcance técnico

No se modificaron tablas SQL, Caja, Cartera, creación de pedidos, impresión térmica, rutas públicas ni reglas PWA.
