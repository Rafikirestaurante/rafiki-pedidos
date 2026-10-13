# Fase 44 — Cartera como libro diario

Base: 134.2 Fase 43. Cada compra vigente aumenta el saldo; cada pago activo lo reduce. Los pagos no se asignan a pedidos. Los repartos FIFO antiguos permanecen archivados para consulta técnica; los pagos completos se conservan en cartera_pagos. Editar o anular un pago recalcula la cuenta del cliente. Un saldo negativo, por ejemplo después de anular una compra, significa saldo a favor. Se conserva la validación de que un nuevo abono no exceda la deuda actual.

## Instalación
1. Ejecutar en el SQL Editor de Supabase el archivo supabase/2026-10-12-fase44-cartera-libro-diario.sql. Requiere el SQL de Fase 39 ya instalado. La migración es transaccional y puede ejecutarse de nuevo.
2. Publicar esta versión de la aplicación. No volver a ejecutar SQL anteriores de cartera después del de Fase 44 porque reemplazarían las funciones nuevas.
3. Revisar un cliente con compras y abonos anteriores: saldo actual = compras vigentes menos abonos activos. Registrar un abono y comprobar que aparece una sola línea. Probar edición y anulación.

## Uso
Gerencia → Cartera → Libro diario: todos los clientes, filtros por cliente y fechas, exportación Excel. Cada saldo corresponde al cliente de esa fila. El filtro de fechas conserva los movimientos anteriores en el cálculo del saldo. Ver libro diario desde un cliente permite editar o anular sus abonos. La lectura paginada incluye compras y pagos históricos sin limitar el cálculo a los registros recientes.

## Validación
Compilación y pruebas de cálculo del libro diario; migración ejecutada en PostgreSQL embebido de pruebas con casos de conservación histórica, repetición, compras, correcciones, registro, edición y anulación de abonos, saldo a favor y rechazo de abono superior a deuda. No se ejecutó en el Supabase del usuario.
