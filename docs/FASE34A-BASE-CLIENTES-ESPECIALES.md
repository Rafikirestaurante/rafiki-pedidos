# Fase 34A — Base SQL y arquitectura de Clientes Especiales

## Objetivo

Crear la base segura para manejar **Clientes Especiales** mediante códigos en Rafiki Pedidos, sin modificar todavía el flujo de `/cliente` ni `/mesas`.

Esta subfase deja preparada la estructura para que, en próximas fases, un cliente pueda ingresar un código y obtener reglas especiales como:

- sin restricción de acompañantes,
- mensaje de bienvenida,
- cafetería habilitada en `/cliente`,
- nombre, teléfono y ubicación precargados,
- opción de modificar teléfono o ubicación,
- base futura para promociones, regalos o descuentos.

## Archivos agregados

- `supabase/2026-06-25-fase34a-clientes-especiales.sql`
- `src/services/clientesEspecialesService.js`
- `docs/FASE34A-BASE-CLIENTES-ESPECIALES.md`

## Seguridad aplicada

La tabla nueva es:

```sql
public.clientes_especiales
```

No se mezcló con `clientes_credito` ni con `catalogo_productos`, porque son conceptos diferentes. Visualmente podrá mostrarse en el futuro dentro de **Catálogo**, pero la información queda en una tabla independiente.

La tabla tiene RLS activo. El rol `anon` **no tiene permiso de SELECT directo** sobre la tabla. Para validar códigos desde `/cliente`, se creó una RPC controlada:

```sql
public.validar_cliente_especial_codigo(p_codigo text)
```

Esta función solo devuelve información limitada del cliente cuando el código existe y está activo. Así evitamos exponer todo el listado de clientes especiales desde la zona pública.

## Campos principales

```text
id
codigo
codigo_normalizado
nombre
telefono
ubicacion
activo
mensaje_bienvenida
sin_restriccion_acompanantes
habilita_cafeteria
permite_modificar_datos
reglas_json
observaciones
creado_en
actualizado_en
```

## Base para promociones futuras

El campo `reglas_json` queda preparado para reglas futuras, por ejemplo:

```json
{
  "promociones": false,
  "regalo": null,
  "descuento": null,
  "prioridad": "normal"
}
```

Esto permitirá más adelante implementar beneficios como bebida gratis, descuento porcentual, regalos, prioridad o reglas especiales por cliente.

## Servicio agregado

Se agregó `clientesEspecialesService.js` con funciones no integradas todavía al flujo visual:

```text
validarCodigoClienteEspecial
listarClientesEspeciales
crearClienteEspecial
actualizarClienteEspecial
normalizarCodigoClienteEspecial
crearReglasClienteEspecialBase
```

Estas funciones quedan listas para usarse en 34B/34C, pero en 34A no cambian ninguna pantalla.

## Importante

En esta fase **no se modificó**:

```text
src/modules/cliente
src/modules/mesas
src/App.jsx
```

Por lo tanto, `/cliente` y `/mesas` deben seguir funcionando exactamente como antes.

## Pruebas recomendadas después de ejecutar el SQL

1. Ejecutar `supabase/2026-06-25-fase34a-clientes-especiales.sql` en Supabase SQL Editor.
2. Confirmar que se crea la tabla `clientes_especiales`.
3. Confirmar que existe la función `validar_cliente_especial_codigo`.
4. Probar la RPC con el código de prueba `RAFIKI-VIP`.
5. Entrar a `/cliente` y verificar que no cambió nada.
6. Entrar a `/mesas` y verificar que no cambió nada.
7. Crear un pedido normal desde `/cliente`.
8. Crear un pedido normal desde `/mesas`.

## Código de prueba incluido

El SQL incluye un registro de prueba:

```text
Código: RAFIKI-VIP
Nombre: Cliente Especial Rafiki
```

Este registro se puede editar, desactivar o eliminar más adelante desde el panel que se agregará en una subfase posterior.
