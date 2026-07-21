# Fase 36B.1B — Gráfico de barras con filtros

Versión: `127.1-FASE36B1B-GRAFICO-BARRAS-FILTROS-2026-07-21`

## Objetivo

Completar el comparativo mensual del Dashboard permitiendo analizar los días del mes desde tres indicadores distintos sin abandonar la misma gráfica.

## Cambios principales

- Filtro **Ventas** para comparar el total vendido por día.
- Filtro **Pedidos** para comparar la cantidad diaria de pedidos.
- Filtro **Ticket promedio** para comparar el valor promedio de cada pedido por día.
- Escala de barras recalculada automáticamente al cambiar el indicador.
- Resumen contextual para cada filtro con:
  - Acumulado o indicador mensual.
  - Promedio diario o por día activo.
  - Mayor valor diario y fecha correspondiente.
- Valores compactos sobre las barras para mejorar la lectura.
- Mejor día resaltado de acuerdo con el indicador seleccionado.
- Detalle completo al tocar una barra:
  - Total vendido.
  - Total de gastos.
  - Resultado ventas menos gastos.
  - Pedidos.
  - Ticket promedio.
- Controles accesibles mediante `aria-pressed` y etiquetas descriptivas.
- Ajustes responsivos para celular y tableta.

## Alcance técnico

No se agregaron dependencias, migraciones SQL ni consultas adicionales. Los tres indicadores se calculan con la información mensual que ya carga el Dashboard. No se modificaron Caja, Cartera, pedidos, impresión térmica ni PWA.
