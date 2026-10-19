# Fase 45C — Acceso directo a consulta de mesas

Base 136.1. La navegación principal queda Mesas · 🍽️ · Pedidos hoy · Admin · Gerencia.
Mesas conserva /mesas para registrar pedidos. El icono 🍽️ abre /pedidos-hoy/mesas directamente en la subpestaña Mesas. Pedidos hoy conserva /pedidos y abre la tabla general. Los nombres existentes se conservan.

El icono tiene título y etiqueta accesible Consultar mesas. Se distingue cuál acceso está activo. La ruta nueva está contemplada al cargar, iniciar sesión y usar Atrás/Adelante. Pulsar de nuevo el acceso abre su vista inicial aunque el usuario hubiese cambiado de subpestaña. Se reutiliza el mismo módulo de Pedidos hoy y sus permisos; no se duplica la lógica de pedidos.

No requiere SQL nuevo ni actualización del servidor de impresión. Si no se instalaron los SQL de Fases 45 y 45B, siguen siendo necesarios para adiciones y cambio de mesa. Publicar el contenido de rafiki41_1300, incluyendo package.json y package-lock.json.

Verificación: compilación de producción y revisión de resolución de ruta, regreso después de iniciar sesión, historial del navegador y selección inicial de subpestaña.
