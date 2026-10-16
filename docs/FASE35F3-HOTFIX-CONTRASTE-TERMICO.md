# 125.10 — Hotfix 35F.3: Contraste térmico 1x1

## Objetivo

Mejorar la lectura de los informes térmicos administrativos cuando la impresión sale muy clara, sin volver a usar letra diminuta ni perder el formato compacto.

## Ajuste aplicado

Se ajustó `src/modules/impresion/thermalReportService.js` para mantener un comportamiento más cercano al modo térmico normal 1x1:

- Tamaño normal: `12px` para texto y tablas.
- Texto monoespaciado.
- Negro puro `#000`.
- Peso térmico firme mediante `fontWeight: "700"`.
- Refuerzo mínimo con `-webkit-text-stroke` para oscurecer la salida sin agrandar la letra.
- `print-color-adjust: exact`.
- Tablas compactas preformateadas conservadas.
- Sin volver a detalles largos en Pedidos Hoy.

## Pedidos Hoy

Se mantiene el formato compacto aprobado:

```text
Pedido | Cliente | Ubicación | Total
```

No se imprime detalle del pedido, método de pago, estado, línea de producto ni texto largo.

## Módulos afectados

Solo se ajusta el motor visual de impresión térmica administrativa. Aplica a:

- Pedidos Hoy
- Caja
- Gastos
- Cartera

## Módulos no modificados

- `/cliente`
- `/mesas`
- guardado de pedidos
- SQL
- cálculos de Caja
- cálculos de Cartera
- impresión de comandas o tickets normales

## Validaciones

Se agrega:

```bash
npm run thermal-contraste:check
```

También se actualiza `thermal-ahorro:check` para reconocer el nuevo criterio de contraste, porque en este caso sí se necesita peso térmico firme para evitar impresión clara.
