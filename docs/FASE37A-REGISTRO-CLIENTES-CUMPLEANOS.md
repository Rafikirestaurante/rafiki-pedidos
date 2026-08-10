# Fase 37A — Registro de clientes y cumpleaños

Versión: `127.8-FASE37A-REGISTRO-CLIENTES-CUMPLEANOS-2026-07-21`

## Objetivo

Hacer mucho más discreto el acceso por código en `/cliente` y permitir que una persona se registre para reutilizar sus datos en pedidos futuros. El número de celular queda como código predeterminado.

## Cambios en `/cliente`

- El recuadro grande se reemplaza por una franja compacta y neutral.
- El campo acepta celular o código existente.
- Se agrega la acción discreta **Registrarme**.
- El registro solicita nombre, celular, ubicación habitual, mes y día de cumpleaños.
- No se solicita ni almacena el año de nacimiento.
- Se solicita autorización para guardar los datos.
- Si el celular ya existe, se reutiliza el registro en lugar de crear un duplicado.
- Al registrarse o aplicar el código, se precargan nombre, celular y ubicación.

## Seguridad funcional

Los registros públicos se guardan en la tabla existente `clientes_especiales`, pero con las reglas VIP desactivadas:

- `sin_restriccion_acompanantes = false`
- `habilita_cafeteria = false`
- `permite_modificar_datos = true`

De esta manera, registrarse agiliza los pedidos, pero no elimina el mínimo de acompañantes ni habilita Cafetería. Los privilegios especiales continúan bajo control administrativo.

## Supabase

Ejecutar antes de publicar:

```text
supabase/2026-07-21-fase37a-registro-clientes-cumpleanos.sql
```

La migración agrega `cumple_mes`, `cumple_dia` y `origen_registro`, crea validaciones de fechas, un índice de cumpleaños y la RPC pública controlada `registrar_cliente_publico`.

## Administración

El catálogo de clientes ahora muestra cumpleaños y origen del registro. También permite editar día y mes desde Gerencia.

## Validación

Se agrega `npm run registro-clientes:check` y se integra en `npm run check`. La verificación integral pasa de 23 a 24 controles.
