# Fase 44D

Base 135.2. Solicitud de insumos: categorías cerradas, selección múltiple en modal y búsqueda global por nombre/categoría junto a la fecha. La selección usa el mismo estado y validaciones de jornadas AM/PM existentes; el borrador y envío se conservan.

Pedidos hoy / Mesas: solo el pedido más reciente por fecha en cada tarjeta, independientemente del orden elegido para la tabla. El detalle muestra todos los pedidos de la mesa.

Generador: Sopas se selecciona mediante modal y solo las sopas elegidas se ven fuera de él. La búsqueda general junto a la fecha busca en platos y sopas y permite agregarlos o quitarlos directamente, actualizando el resumen existente.

No requiere SQL nuevo. Reemplazar también package.json y package-lock.json con los incluidos. Conserva los cambios de Cartera, navegación y Excel anteriores.
