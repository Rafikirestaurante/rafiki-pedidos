# Fase 12B - Navegación y experiencia móvil

Cambios realizados con enfoque de bajo riesgo:

- Se agregó acceso al panel administrativo desde la pantalla inicial.
- Se agregaron accesos rápidos en el panel administrativo hacia Panel Mesas, Vista Cliente e Inicio.
- Se agregó botón Inicio en el Panel Mesas para volver rápidamente a la pantalla principal.
- Se mejoró la navegación en celular para que los botones no descuadren la pantalla; ahora pueden desplazarse horizontalmente si no caben.
- Se ajustaron espaciados/tamaños en móviles para tarjetas, secciones y pantalla de bienvenida.
- No se modificó la lógica de pedidos, Supabase, cálculos, menús, ni envío de WhatsApp.

Verificación:

- `npm run build` ejecutado correctamente.
- No se incluye `package-lock.json` en el ZIP final.
