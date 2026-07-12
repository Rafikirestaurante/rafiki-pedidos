# 124.42-HOTFIX34E2-CLIENTE-RESTAURANTE-CAFETERIA-TABS-2026-06-26

## Objetivo

Ajustar la experiencia visual de clientes especiales en `/cliente` antes de continuar con nuevas reglas de Fase 34E.

## Cambios realizados

- El aviso de regla activa ahora muestra únicamente: `⭐ Cliente especial activo`.
- Se eliminó el texto adicional: `Puedes continuar el pedido sin seleccionar acompañantes manualmente.`
- Se agregó una fila discreta de selección para clientes especiales con Cafetería habilitada:
  - `Restaurante`
  - `Cafetería`
- `Restaurante` queda seleccionado por defecto.
- La sección de Cafetería solo se muestra cuando el usuario toca `Cafetería`.
- Los productos agregados desde Cafetería se muestran dentro de esa sección para revisar cantidad o eliminar antes de finalizar.

## Alcance

Este hotfix solo modifica `/cliente` y estilos asociados.

No se modificó:

- `/mesas`
- Caja
- Cartera
- Pedidos Hoy
- Servicios de pedidos
- SQL

## Archivos principales

- `src/modules/cliente/components/PedidoCliente.jsx`
- `src/styles/appStyles.js`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
