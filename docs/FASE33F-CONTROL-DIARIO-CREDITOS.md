# Fase 33F — Control diario de créditos

Fecha: 2026-06-20  
Versión: `123.1-FASE33F-CONTROL-DIARIO-CREDITOS-2026-06-20`  
Base estable: `123.0-FASE33-BLINDAJE-CARTERA-2026-06-20`

## Objetivo

Fortalecer el módulo de Cartera para que no solo permita gestionar deudas acumuladas, sino también controlar la operación diaria de créditos durante el cierre de caja.

## Cambios aplicados

### 1. Métricas diarias en el resumen

En `CarteraClientesCredito.jsx` se agregaron dos indicadores nuevos:

- **Créditos otorgados hoy:** suma el valor original de los movimientos de cartera generados hoy, excluyendo movimientos anulados.
- **Abonos recibidos hoy:** suma los pagos registrados hoy en cartera.

Esto permite comparar rápidamente la salida a crédito del día contra el dinero recuperado en la misma fecha.

### 2. Fechas con horario Colombia

Se creó el archivo:

`src/shared/utils/fechasColombia.js`

Incluye utilidades para:

- obtener la fecha actual en formato `YYYY-MM-DD` usando `America/Bogota`,
- comparar fechas dentro de un rango sin depender de `new Date()` local del navegador,
- formatear fechas y horas en `es-CO`,
- calcular hoy, ayer y últimos días en zona Colombia.

Esto reduce el riesgo de que pedidos de la noche se muestren en un día incorrecto por diferencias entre UTC y la hora local del dispositivo.

### 3. Filtros rápidos en Movimientos

En la pestaña **Movimientos** se agregaron botones rápidos:

- **Créditos de hoy**
- **Ayer**
- **Últimos 7 días**
- **Pendientes**

El botón **Créditos de hoy** aplica automáticamente el rango del día actual en Colombia y muestra todos los movimientos del día, incluso si ya fueron pagados.

### 4. Auditoría visual de créditos pagados

Antes, los movimientos pagados se atenuaban con la clase `subtle-row`. Ahora, cuando hay filtro de fecha activo, los movimientos pagados se mantienen visualmente normales para que no desaparezcan durante la auditoría del día.

### 5. Resumen de movimientos filtrados

En la cabecera de **Movimientos** ahora se muestra:

- cantidad de movimientos filtrados,
- valor original filtrado,
- saldo filtrado.

Esto facilita revisar cuánto se fio en el rango seleccionado, no solo cuánto sigue pendiente.

## Archivos modificados o agregados

- `src/modules/cartera/components/CarteraClientesCredito.jsx`
- `src/shared/utils/fechasColombia.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `docs/FASE33F-CONTROL-DIARIO-CREDITOS.md`

## SQL

Esta subfase no requiere SQL nuevo. Mantiene el SQL de la Fase 33 base:

`supabase/2026-06-20-fase33-blindaje-cartera.sql`
