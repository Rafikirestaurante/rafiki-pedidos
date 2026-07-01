# Fase 35A — Informes térmicos 58 mm y 80 mm

Versión: `125.0-FASE35A-INFORMES-TERMICOS-58-80-2026-06-30`

## Objetivo

Agregar una base central para imprimir informes administrativos en impresoras térmicas de 58 mm y 80 mm.

Regla principal aprobada:

> La información impresa debe ser la misma en 58 mm y 80 mm. La diferencia está únicamente en la optimización visual: ancho, tamaño de letra, espaciado y saltos de línea.

## Qué se agregó

### Servicio central

Se creó:

```txt
src/modules/impresion/thermalReportService.js
```

Este servicio genera una ventana imprimible con:

- Encabezado.
- Meta información.
- Secciones de filas etiqueta/valor.
- Listados tipo ticket.
- Configuración para 58 mm.
- Configuración para 80 mm.

El mismo objeto de datos se envía a ambos formatos.

## Integración en /admin

En Pedidos Hoy se reemplazó el botón único de impresión 80 mm por dos acciones:

```txt
🧾 58 mm
🧾 80 mm
```

Ambas imprimen exactamente los pedidos visibles en pantalla según los filtros rápidos activos.

Información incluida:

- Fecha.
- Filtros activos.
- Cantidad de pedidos.
- Total ventas.
- Pedido.
- Cliente.
- Ubicación.
- Total.

## Integración en /gerencia

En Gerencia > Caja > Informe Caja se agregaron:

```txt
Imprimir 58 mm
Imprimir 80 mm
```

Ambas impresiones incluyen la misma información:

- Fecha.
- Estado del informe.
- Inicio del día.
- Ventas del día.
- Gastos operativos.
- Ingresos días anteriores.
- Gastos Rafa.
- Cuentas por cobrar.
- Caja esperada.
- Fin / arqueo contado.
- Diferencia.
- Saldos del último arqueo.
- Detalle de gastos.
- Arqueos realizados.
- Fórmula de caja validada.

## Qué no se tocó

No se modificó:

- `/cliente`.
- `/mesas`.
- Guardado de pedidos.
- Caja en cálculos internos.
- Cartera.
- Dashboard.
- SQL.
- Impresión de comandas/tickets existentes.

## Validación

Se agregó:

```bash
npm run thermal-reports:check
```

También se recomienda validar:

```bash
npm run pwa:check
npm run clientes-especiales:check
npm run cliente-para-llevar:check
npm run build
npm run lint
```

## Pruebas manuales recomendadas

1. Entrar a `/admin` > Pedidos Hoy.
2. Aplicar filtro rápido, por ejemplo Restaurante para llevar.
3. Imprimir 58 mm.
4. Imprimir 80 mm.
5. Confirmar que ambos tienen los mismos pedidos y totales.
6. Entrar a `/gerencia` > Caja > Informe.
7. Imprimir 58 mm.
8. Imprimir 80 mm.
9. Confirmar que ambos tienen las mismas secciones y valores.
10. Confirmar que la diferencia de Caja conserva la fórmula validada.
