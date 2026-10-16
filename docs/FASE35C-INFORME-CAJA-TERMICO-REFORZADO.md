# Fase 35C — Informe Caja térmico reforzado

Versión: `125.2-FASE35C-INFORME-CAJA-TERMICO-REFORZADO-2026-07-01`

## Objetivo

Reforzar la impresión térmica de **Gerencia > Caja > Informe Caja** para impresoras de **58 mm** y **80 mm**, manteniendo la regla operativa aprobada:

- Ambos formatos imprimen la **misma información**.
- La diferencia entre 58 mm y 80 mm es solo visual: ancho, compactación y saltos de línea.
- No se recortan campos en 58 mm.
- No se agregan campos exclusivos en 80 mm.

## Cambios realizados

### 1. Informe Caja térmico más completo

El reporte impreso desde Caja ahora incluye:

- Fecha del informe.
- Fecha y hora de generación.
- Cantidad de pedidos del día.
- Estado del cuadre: cuadrado, sobra dinero o falta dinero.
- Inicio del día.
- Ventas del día.
- Gastos operativos.
- Gastos Rafa.
- Cuentas por cobrar.
- Caja esperada.
- Fin / arqueo contado.
- Ingresos días anteriores.
- Diferencia final.

### 2. Ajustes de Caja impresos como bloque separado

Se agregó un bloque específico para:

- Ingresos días anteriores.
- Gastos Rafa.
- Cuentas por cobrar.
- Total de ajustes egresos.

Esto evita confundir ajustes con ventas reales del día.

### 3. Métodos de pago

El informe ahora imprime:

- Ventas por método de pago.
- Gastos por método de pago.

Si no hay movimientos, imprime una línea controlada con valor cero.

### 4. Saldos impresos

Se agregó impresión detallada de:

- Saldos de inicio del día.
- Saldos del último arqueo.
- Caja Registradora.
- Caja Azul.
- Bancolombia.
- Nequi.
- Rafa.
- Datafono.

### 5. Detalle de gastos enriquecido

Cada gasto impreso puede incluir:

- Proveedor.
- Categoría.
- Artículos.
- Método de pago.
- Valor.

### 6. Arqueos realizados con saldos

El bloque de arqueos realizados ahora imprime:

- Etiqueta del arqueo.
- Fecha y hora.
- Total.
- Caja Registradora / Caja Azul.
- Bancolombia / Nequi.
- Rafa / Datafono.

### 7. Fórmula validada opción 2

Se conserva la fórmula validada en Fase 33:

```text
Caja esperada = Inicio + ventas - gastos - Rafa - CxC
Diferencia = Arqueo + ingresos días anteriores - caja esperada
```

Nota impresa:

```text
Ingresos días anteriores no suben ventas ni caja esperada
```

## Archivos modificados

- `src/modules/caja/components/CajaAdmin.jsx`
- `scripts/validate-thermal-caja.mjs`
- `package.json`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `README.md`

## Archivos no modificados

No se tocó:

- `/cliente`
- `/mesas`
- Pedidos Hoy
- Cartera
- Dashboard
- SQL
- Guardado de pedidos
- Impresión de comandas o tickets

## Pruebas recomendadas

1. Entrar a `/gerencia`.
2. Abrir Caja.
3. Entrar a Informe.
4. Imprimir 58 mm.
5. Imprimir 80 mm.
6. Confirmar que ambos tienen la misma información.
7. Revisar que 58 mm salga más compacto.
8. Revisar que 80 mm salga más ancho y legible.
9. Confirmar que ingresos días anteriores no aparecen como venta.
10. Confirmar que la diferencia usa la fórmula validada.

## Validación técnica

Comandos recomendados:

```bash
npm run thermal-caja:check
npm run thermal-reports:check
npm run thermal-pedidos-hoy:check
npm run pwa:check
npm run build
npm run lint
```
