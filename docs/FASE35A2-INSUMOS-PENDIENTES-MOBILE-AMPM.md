# Fase 35A.2 — Insumos pendientes móvil y señal AM/PM

Versión: `126.2-FASE35A2-INSUMOS-PENDIENTES-MOBILE-AMPM-2026-07-06`

## Objetivo

Aplicar ajustes pequeños y seguros en `Admin > Solicitud de insumos > Insumos pendientes`, tomando como base la Fase 35A.1.

## Cambios realizados

### 1. Corrección visual móvil de Insumos pendientes

Se reemplazó la fila rígida de insumos pendientes, que usaba columnas fijas con estilos inline, por una estructura con clases CSS reutilizables:

- `insumos-pendientes-card`
- `insumos-pendientes-card-header`
- `insumos-pendientes-lista`
- `insumo-pendiente-row`
- `insumo-pendiente-nombre`
- `insumo-pendiente-cantidad`
- `insumo-pendiente-check`

En escritorio se conserva una lectura compacta tipo fila. En celular, la fila se reorganiza para evitar cortes laterales: selector de envío, nombre del insumo y etiqueta AM/PM arriba; cantidad y marca de comprado abajo.

### 2. Señal discreta AM/PM por insumo

Al guardar una nueva solicitud, cada insumo dentro del JSON `insumos` recibe metadatos internos:

- `jornadaSolicitud`: `AM` o `PM`
- `horaSolicitud`: hora local de Colombia en formato HH:mm

Esto no requiere nuevas columnas SQL y no cambia el mensaje de WhatsApp, porque el mensaje sigue usando solo nombre, cantidad, unidad y nota.

En `Insumos pendientes`, cada producto muestra una etiqueta discreta `AM` o `PM` para indicar si la solicitud fue realizada en la mañana o en la tarde.

### 3. Compatibilidad

Las solicitudes antiguas que no tienen jornada guardada muestran `—` en la etiqueta, evitando errores o datos inventados. Las nuevas solicitudes sí quedarán marcadas automáticamente.

## Archivos modificados

```text
src/modules/catalogo/components/SolicitudProductos.jsx
src/shared/utils/solicitudProductos.js
src/styles/appStyles.js
src/config/rafikiBuild.js
public/rafiki-version.json
README.md
```

## No se modificó

- `/cliente`
- `/mesas`
- Guardado de pedidos
- Caja
- Cartera
- Pedidos Hoy
- SQL / Supabase
- Impresión térmica
- Cálculos financieros

## Validación sugerida

1. Abrir `Admin > Solicitud de insumos > Insumos pendientes` desde celular.
2. Confirmar que las filas ya no se cortan lateralmente.
3. Crear una solicitud nueva en la mañana y verificar etiqueta `AM`.
4. Crear una solicitud nueva en la tarde y verificar etiqueta `PM`.
5. Confirmar que WhatsApp sigue enviando solo el listado de insumos seleccionado.
