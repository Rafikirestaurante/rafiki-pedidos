# Fase 14 — División segura de App.jsx

## Objetivo
Reducir el tamaño de `src/App.jsx` sin cambiar el comportamiento visible de la aplicación.

## Cambios realizados

### 1. Componentes extraídos
Se crearon componentes nuevos para separar partes administrativas que estaban dentro de `App.jsx`:

- `src/components/CargandoModulo.jsx`
- `src/components/admin/AdminHeaderTabs.jsx`
- `src/components/admin/AdminPedidosSection.jsx`

### 2. Utilidades extraídas
Se movieron funciones auxiliares fuera de `App.jsx`:

- `src/utils/async.js`
  - `conTiempoMaximo`

- `src/utils/menuCache.js`
  - `leerMenuCache`
  - `guardarMenuCache`
  - `hayMenuCacheValido`

### 3. Limpieza preventiva
Se eliminó `src/App_dividido.jsx` porque estaba vacío y podía generar confusión.

## Validación
Se ejecutó correctamente:

```bash
npm run build
```

Resultado: build exitoso.

## Alcance de seguridad
Esta fase no cambia:

- flujo de pedidos cliente
- panel mesas
- guardado en Supabase
- pedidos administrativos
- menú diario
- solicitud de insumos
- sección Rafa
- Service Worker
- manifest

## Siguiente paso sugerido
Probar en local y Vercel:

1. `/cliente`
2. `/mesas`
3. `/admin`
4. editar menú diario
5. pedidos pendientes/finalizados/borrados
6. solicitud de insumos
7. generador de menú
8. sección Rafa

Si todo funciona, la siguiente división segura debería ser separar el flujo de pedido cliente en componentes pequeños.
