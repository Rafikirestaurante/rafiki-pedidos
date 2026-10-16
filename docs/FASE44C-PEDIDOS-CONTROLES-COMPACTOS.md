# Fase 44C — Pedidos hoy compacto

Base 135.1. Se conserva la tabla, Excel y cambios de cartera anteriores.

Controles superiores: actualizar por icono y estado explícito de conexión en vivo (activo, pausado o conectando). Barra compartida: Buscar, Filtros, Excel, Imprimir y Orden. Impresión despliega el selector térmico de 58/80 mm; Orden permite antiguos/recientes primero. Finalizar todos se ubica después de la tabla y la carga adicional.

Se eliminan resúmenes de carga, títulos repetidos, encabezados explicativos, aviso visual del corte y encabezado/toggle de últimas tres mesas. Las mesas muestran hasta tres pedidos con acceso al detalle completo. Se mantienen errores, alertas de pedidos nuevos y advertencias de carga incompleta. No se altera el corte visual existente a las 19:30 Colombia: no modifica los registros en Supabase.

Instalación: reemplazar todo el contenido de rafiki41_1300 en la raíz del repositorio, incluyendo package.json y package-lock.json. No necesita SQL adicional a la Fase 44. Validación: compilación de producción y pruebas existentes de Excel.
