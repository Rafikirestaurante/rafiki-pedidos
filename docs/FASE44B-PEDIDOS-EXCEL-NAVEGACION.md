# Fase 44B — Pedidos hoy: navegación y Excel

Base 135.0. Se conserva la tabla de pedidos y la distribución de mesas.
Buscar y Filtros son botones pequeños en la misma fila. Ambos se abren en ventanas y permanecen cerrados por defecto en Pedidos y Mesas. Buscar contiene búsqueda general y búsqueda global por número sin fecha. Filtros contiene día/rango y filtros rápidos por tipo de pedido/pago.

Excel abre un selector Desde/Hasta y descarga un archivo .xlsx real. El rango incluye ambos días completos en horario Colombia y consulta todos los registros del servidor mediante paginación, independientemente de las filas cargadas o filtros rápidos. Excluye borrados, anulados y cancelados. Un archivo incompleto por límite de consulta se rechaza para que se reduzca el rango.

Columnas: Pedido, Fecha y hora (Colombia), Cliente, Teléfono, Ubicación, Mesa, Mesero, Detalle del pedido, Tipo de pago, Estado, Observaciones, Total. Teléfono y mesa son texto. No se inventan datos ausentes. Hoja Resumen con rango, cantidad y total. Encabezado fijo y autofiltro.

No requiere SQL nuevo. Si aún no se ha instalado la Fase 44 de cartera, ejecutar primero su SQL incluido según docs/FASE44-CARTERA-LIBRO-DIARIO.md. Incluye todos los cambios de cartera de la versión 135.0.

Validación: compilación y pruebas de límites de fechas y lectura del XLSX generado para verificar columnas independientes, importes numéricos y conservación de ceros iniciales del teléfono.
