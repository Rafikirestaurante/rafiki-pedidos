# Fase 34C — Validación controlada de código especial

## Objetivo

Agregar una prueba interna y controlada para validar códigos de clientes especiales desde **Gerencia > Catálogo > Clientes especiales**, sin activar todavía el campo público en `/cliente` y sin modificar `/mesas`.

Esta subfase sirve para confirmar que la RPC creada en Fase 34A funciona correctamente antes de conectar la experiencia final del cliente.

## Alcance aplicado

- Se agregó un bloque **Validación controlada de código** dentro del panel de Clientes especiales.
- El bloque permite ingresar un código y ejecutar la RPC `validar_cliente_especial_codigo`.
- Si el código está activo, se muestran los datos que en futuras fases podrá usar `/cliente`:
  - nombre
  - código
  - teléfono predeterminado
  - ubicación predeterminada
  - regla de acompañantes
  - regla de cafetería
  - regla de modificación de datos
- Si el código no existe o está inactivo, se muestra un mensaje controlado.
- La validación no crea pedidos, no altera pedidos existentes y no cambia reglas operativas.

## Archivos modificados

- `src/modules/catalogo/components/ClientesEspecialesCatalogo.jsx`
- `docs/FASE34C-VALIDACION-CONTROLADA-CODIGO.md`
- `public/rafiki-version.json`
- `src/config/rafikiBuild.js`
- `README.md`

## Archivos no modificados

Por seguridad, esta subfase no modifica:

- `src/modules/cliente`
- `src/modules/mesas`
- `src/App.jsx`

## Requisito previo

Debe estar ejecutado el SQL de Fase 34A:

```sql
supabase/2026-06-25-fase34a-clientes-especiales.sql
```

## Cómo probar

1. Entrar a **Gerencia > Catálogo > Clientes especiales**.
2. Crear o verificar un cliente especial activo.
3. En el bloque **Validación controlada de código**, ingresar el código.
4. Presionar **Probar código**.
5. Confirmar que se muestra el mensaje de bienvenida y las reglas del cliente.
6. Desactivar el cliente especial.
7. Probar el mismo código nuevamente y confirmar que aparece como no habilitado.

## Comportamiento esperado

- Código activo: muestra datos y reglas del cliente especial.
- Código inactivo: no devuelve datos públicos.
- Código inexistente: muestra mensaje de código no encontrado o inactivo.
- Código corto: muestra advertencia de mínimo 3 caracteres.

## Pendiente para próximas subfases

- Fase 34D: agregar el recuadro de código en `/cliente`, todavía sin aplicar reglas profundas.
- Fase 34E: aplicar precarga de datos, bienvenida, sin restricción de acompañantes y habilitación de Cafetería para cliente especial.
