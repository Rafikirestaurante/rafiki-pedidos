# Fase 34F.1 Hotfix — Blindaje `/cliente` para llevar

## Objetivo

Corregir de raíz el caso en el que pedidos creados desde el link público `/cliente` podían no quedar marcados como **para llevar**, afectando:

- el adicional de $1.500 en almuerzos/restaurante;
- el adicional de $1.000 en desayunos de cafetería;
- la clasificación operativa como pedido para llevar;
- filtros de Pedidos Hoy e informes;
- impresión y lectura de cocina.

## Regla definitiva

En `/cliente`:

- por defecto todo pedido es **para llevar**;
- el check “Para llevar” no se puede desmarcar manualmente;
- la única forma de quitar el adicional y no registrarlo como llevar es marcar **Registrar este pedido para comer en el restaurante**;
- si el cliente modifica la ubicación después de marcar “comer en restaurante”, el pedido vuelve automáticamente a **para llevar** y conserva la ubicación digitada.

## Cambios aplicados

### 1. Normalización centralizada

Se agregaron funciones en `src/shared/utils/pedidos.js`:

```js
pedidoClienteVaParaLlevar
normalizarItemParaDestinoCliente
normalizarItemsParaDestinoCliente
```

Estas funciones hacen que todos los items del flujo público tengan `paraLlevar: true` salvo cuando `comerRestauranteCliente === true`.

### 2. Pantalla y total usan items normalizados

En `src/App.jsx` se creó `itemsPedidoOperativos` para que `/cliente` calcule resumen, subtotal y total con el estado efectivo correcto.

Esto evita que el check visual diga “Para llevar”, pero el total no sume el adicional.

### 3. Guardado blindado

En `src/shared/hooks/usePedidos.js`, antes de insertar el pedido en Supabase, los items vuelven a normalizarse.

Además, el pedido público externo ahora se guarda como:

```js
tipo_pedido: "llevar"
```

Cuando el usuario marca comer en restaurante, se mantiene:

```js
tipo_pedido: "mesa"
mesa: "5A"
ubicacion: "Comer en restaurante"
```

### 4. Modificar ubicación revierte a llevar

Si el usuario marca “comer en restaurante” y luego cambia la ubicación, el sistema desactiva restaurante, vuelve a `paraLlevar: true` y conserva la ubicación escrita.

## Archivos modificados

```text
src/App.jsx
src/shared/hooks/usePedidos.js
src/shared/utils/pedidos.js
src/modules/cliente/components/PedidoCliente.jsx
scripts/validate-cliente-para-llevar.mjs
package.json
src/config/rafikiBuild.js
public/rafiki-version.json
README.md
docs/FASE34F1-HOTFIX-CLIENTE-PARA-LLEVAR-BLINDAJE.md
```

## Validación agregada

Nuevo comando:

```bash
npm run cliente-para-llevar:check
```

## Pruebas manuales recomendadas

1. Entrar a `/cliente` sin código especial.
2. Seleccionar un almuerzo normal.
3. Confirmar que el subtotal suma $1.500.
4. Enviar el pedido y revisar en Pedidos Hoy que aparece como para llevar.
5. Repetir con cliente especial.
6. Marcar “Registrar este pedido para comer en el restaurante”.
7. Confirmar que desaparece el adicional y se guarda como mesa 5A.
8. Cambiar la ubicación manualmente.
9. Confirmar que vuelve a para llevar y suma nuevamente el adicional.
