# Fase 36B.3 — Pruebas de flujos financieros críticos

Versión: `127.3-FASE36B3-PRUEBAS-FLUJOS-FINANCIEROS-2026-07-21`

## Objetivo

Proteger automáticamente las operaciones financieras más delicadas de Rafiki Pedidos antes de continuar agregando funciones. Esta fase no crea tablas, no modifica el RPC de Supabase y no cambia las reglas del restaurante.

## Cobertura incorporada

La nueva suite `financialFlows.test.js` contiene 25 escenarios financieros específicos:

- creación de deuda para pedidos a crédito;
- actualización de saldos pendiente, parcial y pagado;
- cambio de crédito a otro método de pago;
- borrado, anulación o cancelación de pedidos;
- bloqueo de retiro de crédito cuando ya existen abonos;
- recálculo del saldo general del cliente;
- normalización y validación de abonos;
- distribución FIFO del abono sobre los pedidos más antiguos;
- rechazo de abonos en cero, negativos o superiores a la deuda;
- inclusión de ventas a crédito dentro de ventas reales;
- exclusión de pedidos borrados, anulados y cancelados;
- suma de gastos operativos;
- caja esperada;
- ingresos de días anteriores;
- diferencia final de arqueo y estados cuadrado, sobra o falta.

## Integración con producción

Las funciones probadas son reutilizadas directamente por `carteraService.js`, `cajaService.js` y `CajaAdmin.jsx`. Así, las pruebas no verifican una copia aislada de las fórmulas, sino las mismas reglas consumidas por la aplicación.

También se incorpora `validate-financial-flows.mjs`, que revisa:

- uso real de las reglas financieras;
- conexión de crear, editar y borrar pedidos con Cartera;
- presencia del RPC `registrar_abono_cliente_credito`;
- bloqueo de filas mediante `FOR UPDATE`;
- distribución FIFO por fecha;
- rechazo de sobreabonos;
- actualización transaccional de movimientos y resumen del cliente;
- permisos controlados de la función SQL.

## Comandos

```bash
npm test
npm run financial-flows:check
npm run check
```

La verificación es local y contractual. No escribe ni modifica información en Supabase durante las pruebas.
