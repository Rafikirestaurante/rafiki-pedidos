# Fase 34F — Pruebas finales controladas de Clientes Especiales

Versión: `124.44-FASE34F-PRUEBAS-FINALES-CLIENTES-ESPECIALES-2026-06-26`

## Objetivo

Cerrar la implementación de **Clientes Especiales** validando que el flujo nuevo funcione en `/cliente` sin afectar rutas operativas como `/mesas`, Caja, Cartera, Pedidos Hoy o Dashboard.

Esta subfase no agrega reglas nuevas. Se concentra en:

- Documentar matriz de pruebas.
- Agregar un script de validación estática.
- Confirmar puntos críticos de seguridad funcional.
- Dejar una versión estable antes de seguir con promociones, regalos o descuentos.

## Alcance funcional validado

Clientes especiales en `/cliente` deben permitir:

1. Ingresar código de cliente especial.
2. Mostrar bienvenida en modal.
3. Precargar nombre, teléfono y ubicación.
4. Permitir editar teléfono y ubicación.
5. Eliminar el mínimo obligatorio de acompañantes cuando la regla está activa.
6. Mostrar selector discreto `Restaurante / Cafetería` cuando la regla de Cafetería está activa.
7. Abrir `Restaurante` por defecto.
8. Permitir agregar productos de Cafetería desde catálogo dinámico o fallback.
9. Guardar referencia segura en `items[].cliente_especial`.
10. Mostrar `Cliente especial aplicado` en la confirmación.

## Script agregado

Se agregó:

```bash
npm run clientes-especiales:check
```

Internamente ejecuta:

```bash
node scripts/validate-clientes-especiales.mjs
```

Este script revisa de forma estática que:

- `/cliente` siga tratado como link público y no como PWA interna.
- El modal de bienvenida tenga el mensaje aprobado.
- El selector `Restaurante / Cafetería` exista.
- `Restaurante` sea la sección abierta por defecto.
- El aviso visual quede solo como `⭐ Cliente especial activo`.
- Cafetería cargue catálogo dinámico y fallback.
- El pedido guarde `cliente_especial` dentro de los items.
- `/mesas` no dependa de `clienteEspecialAplicado` ni del componente de código.
- La corrección de Pastas dentro de Platos siga vigente.

## Matriz de pruebas manuales recomendadas

### A. Cliente normal sin código

1. Abrir `/cliente`.
2. No ingresar código.
3. Seleccionar un plato normal.
4. Intentar continuar sin acompañantes.
5. Debe salir alerta de mínimo 2 acompañantes.
6. Completar datos y enviar pedido.
7. Confirmar que el pedido llega normal a Pedidos Hoy.

Resultado esperado: flujo normal intacto.

### B. Código especial válido

1. Abrir `/cliente`.
2. Ingresar un código activo.
3. Confirmar que aparece el modal de bienvenida.
4. Verificar que se precargan nombre, teléfono y ubicación.
5. Editar teléfono o ubicación.
6. Continuar con el pedido.

Resultado esperado: datos cargados y editables.

### C. Cliente especial sin acompañantes

1. Ingresar código especial activo.
2. Seleccionar un plato normal.
3. No seleccionar acompañantes.
4. Continuar al resumen.
5. Enviar pedido.

Resultado esperado: debe permitir enviar sin mínimo obligatorio.

### D. Productos con acompañantes del día

Probar desde `/cliente` y `/mesas`:

- Sopas.
- Arroces tipo `Arroz de ...`.
- Arroz trifásico.
- Platos cuyo nombre contenga `Pasta` o `Pastas` aunque estén en categoría `Platos`.

Resultado esperado: mostrar `Este Producto viene con acompañantes del día`.

### E. Cafetería para cliente especial

1. Ingresar código especial con `habilita_cafeteria = true`.
2. Confirmar que aparece selector `Restaurante / Cafetería`.
3. Confirmar que abre por defecto en `Restaurante`.
4. Tocar `Cafetería`.
5. Agregar un producto.
6. Confirmar que aparece en la sección y en el resumen.
7. Enviar pedido.

Resultado esperado: producto de Cafetería suma al total y se guarda dentro del pedido.

### F. Código inactivo o inválido

1. Abrir `/cliente`.
2. Ingresar un código inexistente o inactivo.
3. Confirmar mensaje controlado.
4. Continuar pedido normal.

Resultado esperado: no debe bloquear el pedido normal.

### G. `/mesas`

1. Abrir `/mesas`.
2. Crear pedido normal.
3. Crear pedido con producto de sopas/arroz/pastas.
4. Confirmar que no aparece recuadro de código especial.
5. Confirmar que el flujo operativo sigue igual.

Resultado esperado: `/mesas` no cambia por clientes especiales.

### H. Caja, Cartera y Pedidos Hoy

1. Crear pedido normal.
2. Crear pedido cliente especial restaurante.
3. Crear pedido cliente especial con Cafetería.
4. Revisar Pedidos Hoy.
5. Revisar Informe Caja.
6. Revisar Cartera si se usa forma de pago Crédito.

Resultado esperado: no se alteran cálculos de Caja ni Cartera.

## Riesgos controlados

- **PWA vs link público:** `/cliente` se mantiene como link público y no debe depender de PWA.
- **Duplicación de lógica:** Cafetería se habilita solo para cliente especial desde `/cliente`; `/mesas` conserva su flujo propio.
- **Promociones futuras:** se guarda `cliente_especial` en los items, pero todavía no se aplican descuentos ni regalos.
- **Datos sensibles:** el cliente público valida código por RPC, sin exponer listado completo.

## Comandos recomendados antes de desplegar

```bash
npm install
npm run clientes-especiales:check
npm run pwa:check
npm run build
npm run lint
```

## Archivos modificados en esta subfase

- `scripts/validate-clientes-especiales.mjs`
- `package.json`
- `docs/FASE34F-PRUEBAS-FINALES-CLIENTES-ESPECIALES.md`
- `public/rafiki-version.json`
- `src/config/rafikiBuild.js`
- `README.md`

No se modificó lógica de pedidos, componentes de `/cliente`, `/mesas`, Caja, Cartera ni Pedidos Hoy.
