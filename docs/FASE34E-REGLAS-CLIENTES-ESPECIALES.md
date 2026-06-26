# Fase 34E — Reglas especiales en /cliente

Fecha: 2026-06-26  
Versión: 124.40-FASE34E-REGLAS-CLIENTES-ESPECIALES-2026-06-26

## Objetivo

Activar de forma controlada las reglas operativas de clientes especiales en el link público `/cliente`, partiendo de la base validada en 34D.9.

## Cambios aplicados

- El código especial válido mantiene la precarga de nombre, teléfono y ubicación.
- Para clientes especiales con `sin_restriccion_acompanantes = true`, `/cliente` ya no exige mínimo 2 acompañantes.
- Se agrega una nota visual indicando que el cliente especial puede continuar sin seleccionar acompañantes manualmente.
- Para clientes especiales con `habilita_cafeteria = true`, aparece una sección de Cafetería dentro de `/cliente`.
- Los productos de cafetería agregados desde `/cliente` se guardan como items `categoria: "cafeteria"`, sin acompañantes manuales y sin afectar el selector de almuerzos.
- Se agrega referencia segura del cliente especial dentro de cada item del pedido, en el campo JSON `cliente_especial`, para sentar bases de promociones, descuentos o regalos futuros sin requerir todavía columnas nuevas en `pedidos`.

## Alcance seguro

No se modificó `/mesas`.  
No se modificó Caja.  
No se modificó Cartera.  
No se modificó Pedidos Hoy.  
No se agregaron columnas obligatorias nuevas en Supabase.

## Archivos principales

- `src/App.jsx`
- `src/shared/hooks/usePedidos.js`
- `src/modules/cliente/components/PedidoCliente.jsx`
- `src/modules/cliente/components/CafeteriaClienteEspecial.jsx`
- `src/styles/appStyles.js`

## Pruebas recomendadas

1. Entrar a `/cliente` sin código y confirmar que el flujo normal sigue pidiendo mínimo 2 acompañantes.
2. Ingresar un código especial activo con `sin_restriccion_acompanantes = true`.
3. Seleccionar un almuerzo sin acompañantes y confirmar que permite continuar.
4. Ingresar un código especial activo con `habilita_cafeteria = true`.
5. Agregar un producto de cafetería y confirmar que aparece en el resumen.
6. Cambiar la cantidad del producto de cafetería y revisar el total.
7. Registrar pedido con cliente especial y confirmar que llega a Pedidos Hoy.
8. Crear pedido desde `/mesas` y confirmar que no cambió su comportamiento.
