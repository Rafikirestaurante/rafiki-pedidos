# Fase 12C - Componentes reutilizables y textos centralizados

Cambios realizados con enfoque conservador:

## Componentes reutilizables
- Se ampliÃ³ `src/components/common.jsx` con:
  - `Boton`: botÃ³n base reutilizable con variantes y opciÃ³n de ancho completo.
  - `Tarjeta`: contenedor base tipo card.
  - `Aviso`: alerta reutilizable para mensajes de estado.

## Textos centralizados
- Se creÃ³ `src/config/textos.js` para centralizar:
  - nombres de botones,
  - textos de bienvenida,
  - mensajes administrativos,
  - confirmaciones de pedidos,
  - mensajes y confirmaciones de insumos.

## AplicaciÃ³n de los cambios
- `InicioAdmin.jsx` ahora usa textos centralizados y componentes comunes en el login administrativo.
- `App.jsx` usa textos centralizados para mensajes de sonido, menÃº, confirmaciones y WhatsApp.
- `SolicitudProductos.jsx` usa textos centralizados para mensajes, confirmaciones y botones de WhatsApp.
- `appStyles.js` incluye `.button.full-width` para botones reutilizables de ancho completo.

## VerificaciÃ³n
- `npm run build` ejecutado correctamente.
- No se modificÃ³ la lÃ³gica de pedidos, Supabase, cÃ¡lculos, WhatsApp ni flujo operativo.
- No se incluye `package-lock.json`.
