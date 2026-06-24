# Fase 33F — Hotfix Cartera exportar movimientos

Versión: 123.12-HOTFIX-CARTERA-EXPORTAR-MOVIMIENTOS-2026-06-24

## Objetivo

Mejorar la subsección **Cartera > Movimientos** para que sea más clara visualmente y permita compartir los movimientos filtrados con clientes o para auditoría interna.

## Cambios realizados

1. Se quitó el efecto visual naranja que afectaba los recuadros de resumen dentro de Movimientos.
2. Se conservan los cuadros de resumen como tarjetas limpias con fondo gris claro.
3. Se agregó botón **Exportar Excel**.
4. Se agregó botón **Compartir WhatsApp**.
5. La exportación respeta los filtros aplicados: cliente, fechas, estado y búsqueda.
6. El WhatsApp genera un resumen en texto con movimientos, valor filtrado, saldo filtrado y detalle compacto.
7. Si hay un cliente seleccionado y tiene teléfono registrado, WhatsApp abre directamente el chat de ese cliente.
8. Si no hay cliente o teléfono, se abre el selector general de WhatsApp.

## Nota operativa

WhatsApp no permite adjuntar automáticamente archivos generados desde la web por seguridad del navegador. Por eso el botón de WhatsApp comparte un resumen en texto. Para enviar el detalle completo, se debe usar **Exportar Excel** y adjuntar manualmente el archivo en WhatsApp.

## Archivos modificados

- `src/modules/cartera/components/CarteraClientesCredito.jsx`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
