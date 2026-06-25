# Fase 34B — Panel de Clientes Especiales en Catálogo

## Objetivo

Agregar una pantalla administrativa dentro de **Gerencia > Catálogo** para crear, editar, activar y desactivar clientes especiales/VIP, sin modificar todavía el comportamiento público de `/cliente` ni el flujo operativo de `/mesas`.

## Alcance implementado

- Nueva subpestaña visual en `Catálogo Rafa`: **Clientes especiales**.
- Nuevo componente `src/modules/catalogo/components/ClientesEspecialesCatalogo.jsx`.
- Integración conservadora en `src/modules/catalogo/components/CatalogoRafa.jsx`.
- Uso del servicio creado en Fase 34A: `src/services/clientesEspecialesService.js`.
- Formulario para registrar:
  - código,
  - nombre,
  - teléfono predeterminado,
  - ubicación predeterminada,
  - mensaje de bienvenida,
  - observaciones internas,
  - cliente activo/inactivo,
  - sin restricción de acompañantes,
  - habilitación futura de cafetería,
  - permiso futuro para modificar teléfono y ubicación.
- Listado responsive en tabla de escritorio y tarjetas móviles.
- Filtros por texto y estado.
- Botón para actualizar listado desde Supabase.

## Seguridad de la subfase

Esta subfase **no modifica**:

- `src/modules/cliente`
- `src/modules/mesas`
- `src/App.jsx`
- lógica de creación de pedidos
- lógica de Caja
- lógica de Cartera

Por lo tanto, los clientes especiales ya se pueden administrar, pero todavía **no afectan pedidos reales** hasta una fase posterior.

## SQL requerido

No se agrega SQL nuevo en esta subfase. Antes de usar la pantalla debe estar ejecutado el SQL de Fase 34A:

```text
supabase/2026-06-25-fase34a-clientes-especiales.sql
```

## Pruebas realizadas

- `npm run build`: correcto.
- `npm run lint`: sin errores, solo advertencias existentes de código no usado en módulos previos.

## Pruebas recomendadas en la app

1. Entrar a `/admin` o `/gerencia` con usuario administrador.
2. Abrir **Gerencia > Catálogo**.
3. Entrar a **Clientes especiales**.
4. Crear un cliente con código `RAFIKI-VIP` o uno nuevo.
5. Editar teléfono, ubicación y mensaje de bienvenida.
6. Activar/desactivar el cliente.
7. Confirmar que `/cliente` sigue funcionando igual que antes.
8. Confirmar que `/mesas` sigue funcionando igual que antes.
9. Confirmar que Pedidos Hoy, Caja y Cartera no cambian.

## Próxima subfase sugerida

**Fase 34C — Validación interna del código especial**.

En esa fase se puede agregar una prueba controlada del servicio/RPC antes de mostrar el recuadro de código al cliente final. La integración directa en `/cliente` debería dejarse para 34D/34E.
