# Fase 34D — Recuadro de código especial en /cliente

## Objetivo

Agregar en `/cliente` un recuadro inicial para que el cliente pueda ingresar un código especial, validar ese código contra la RPC `validar_cliente_especial_codigo` y cargar los datos predeterminados del cliente sin afectar `/mesas`.

Esta subfase activa solamente la identificación del cliente especial y la precarga de datos. Las reglas profundas de negocio, como eliminar el mínimo de acompañantes o habilitar Cafetería dentro de `/cliente`, quedan reservadas para Fase 34E.

## Alcance aplicado

- Se agregó un componente aislado `CodigoClienteEspecial` dentro del módulo de cliente.
- El recuadro aparece al inicio de `/cliente`, justo debajo del encabezado del menú.
- El cliente puede ingresar un código y presionar **Aplicar**.
- Si el código está activo:
  - se muestra el mensaje de bienvenida configurado;
  - se marca el código como activo en la interfaz;
  - se precarga el nombre del cliente;
  - se precarga el teléfono si está guardado;
  - se precarga la ubicación si está guardada;
  - el cliente puede modificar teléfono o ubicación antes de finalizar el pedido.
- Si el código no existe, está inactivo o no cumple longitud mínima, se muestra un mensaje controlado.
- El botón **Quitar código** retira el estado especial sin borrar automáticamente los datos que el cliente ya tenga escritos.

## Archivos modificados

- `src/App.jsx`
- `src/modules/cliente/components/PedidoCliente.jsx`
- `src/modules/cliente/components/CodigoClienteEspecial.jsx`
- `src/styles/appStyles.js`
- `docs/FASE34D-RECUADRO-CODIGO-CLIENTE.md`
- `public/rafiki-version.json`
- `src/config/rafikiBuild.js`
- `README.md`

## Archivos no modificados

Por seguridad, esta subfase no modifica:

- `src/modules/mesas`
- `src/shared/hooks/usePedidos.js`
- `src/services/pedidosService.js`
- `src/modules/caja`
- `src/modules/cartera`

## Decisiones de seguridad

- `/mesas` no recibe nuevas props ni cambios de lógica.
- La validación de mínimo 2 acompañantes en `/cliente` sigue activa.
- Cafetería todavía no se muestra en `/cliente`.
- El pedido se sigue registrando con el mismo flujo existente.
- La RPC pública sigue siendo el único mecanismo para validar códigos desde `/cliente`; no se expone el listado completo de clientes especiales.

## Requisito previo

Debe estar ejecutado el SQL de Fase 34A:

```sql
supabase/2026-06-25-fase34a-clientes-especiales.sql
```

## Cómo probar

1. Entrar a `/cliente`.
2. Confirmar que aparece el recuadro **¿Tienes código de cliente?**.
3. Probar un código inexistente y confirmar que muestra error controlado.
4. Probar un código inactivo y confirmar que no carga datos.
5. Probar un código activo, por ejemplo `RAFIKI-VIP` si está disponible.
6. Confirmar que aparece el mensaje de bienvenida.
7. Confirmar que se precargan nombre, teléfono y ubicación cuando existan.
8. Modificar teléfono o ubicación manualmente y confirmar que el campo permite cambios.
9. Enviar un pedido normal desde `/cliente`.
10. Entrar a `/mesas` y confirmar que no cambió su funcionamiento.
11. Revisar Pedidos Hoy, Caja y Cartera para confirmar que el pedido conserva el flujo normal.

## Pendiente para Fase 34E

- Permitir que el cliente especial avance sin mínimo de acompañantes.
- Habilitar Cafetería dentro de `/cliente` solo cuando el código activo lo permita.
- Guardar referencia del cliente especial en el pedido, si se decide agregar campo SQL o metadata.
- Preparar reglas futuras para promociones, regalos o descuentos.
