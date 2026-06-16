# Rafiki Pedidos — 121.6

Fase 30E — Manejo profesional de errores Supabase.

## Objetivo

Reducir los mensajes técnicos visibles para el usuario y centralizar la forma en que Rafiki interpreta errores de Supabase, sin cambiar rutas, permisos, diseño ni lógica de negocio.

## Cambios principales

- Nuevo utilitario `src/shared/utils/supabaseErrors.js`:
  - traduce errores por códigos de Supabase/Postgres cuando existen,
  - detecta permisos/RLS, duplicados, relaciones, campos obligatorios, formato inválido, estructura pendiente y conexión,
  - separa el mensaje amigable para el usuario del detalle técnico para consola,
  - evita depender directamente de textos como `column` o `schema cache` en pantallas críticas.

- Pedidos y Mesas:
  - errores al guardar, editar, borrar, finalizar o cambiar estado ahora muestran mensajes más claros,
  - los detalles técnicos se registran en consola con contexto.

- Pedidos Hoy:
  - búsqueda por número, carga inicial y botón “Cargar más resultados” usan mensajes centralizados.

- Menú diario:
  - guardado con fallback de columnas ahora usa detección centralizada de estructura Supabase,
  - errores de carga/guardado son más entendibles.

- Cartera:
  - auditoría, sincronización, abonos, clientes crédito y cambios de estado muestran mensajes seguros.

- Caja, Inventario, Gastos, Catálogo, Generador de menú y Solicitud de insumos:
  - reemplazo de errores técnicos directos por mensajes operativos.

## Recomendación de prueba

1. Entrar a `/admin` e iniciar sesión.
2. Crear un pedido desde `/cliente` y otro desde `/mesas`.
3. En Pedidos Hoy, probar búsqueda por número, rango de fechas y “Cargar más resultados”.
4. Editar un pedido y cambiar forma de pago Crédito / Efectivo.
5. Abrir Gerencia → Cartera, registrar un abono y ejecutar auditoría.
6. Abrir Caja, guardar Inicio, Arqueo y Ajustes.
7. Abrir Catálogo, Inventario, Generador y Solicitud de insumos.
8. Validar que, ante un error de permisos o SQL pendiente, el usuario vea un mensaje claro y no un texto técnico largo de Supabase.

## Nota técnica

No se agregó SQL nuevo. Esta fase solo mejora arquitectura de errores y experiencia operativa.

## 121.0 — Fase 31A/31B: Sistema visual base y limpieza de Cartera

- Se agregan componentes reutilizables en `src/shared/components`: `RafikiTabs`, `RafikiModal`, `RafikiBadge`, `RafikiActionMenu` y `RafikiEmptyState`.
- Se agregan estilos globales reutilizables para tabs, modales, badges, menús contextuales y estados vacíos.
- El panel de Cartera se organiza por pestañas internas: Resumen, Clientes, Movimientos y Detalle cliente.
- Los formularios de nuevo/editar cliente y registrar abono ahora se abren en ventanas modales para no empujar el contenido.
- La tabla de clientes deja visible solo la acción principal `Abono` y agrupa acciones secundarias en `Opciones ⋮`.
- Los estados de clientes y movimientos usan badges reutilizables.
- Los rankings quedan ocultos por defecto y se abren bajo demanda desde el resumen.
- Se agregan estados vacíos amigables y encabezados de tabla pegajosos en Cartera.
- No se modifica la lógica financiera, servicios de cartera, abonos, saldos ni auditoría.

## 121.1 — Fase 31C: Limpieza visual del panel Caja

- Se aplica el sistema visual Rafiki al panel `CajaAdmin.jsx` sin modificar cálculos, servicios ni SQL.
- Se reemplazan las tabs locales por `RafikiTabs` para mantener uniformidad con Cartera.
- Se agrega una pestaña independiente `Historial` para separar los arqueos realizados del formulario de arqueo actual.
- Se agrega un resumen visual superior con Inicio, Ventas, Gastos, Esperado, Resultado y Último arqueo.
- El Informe Caja queda más limpio: el detalle de gastos se abre en modal y los ajustes de caja se editan en modal.
- Se usan `RafikiBadge` para el resultado del cuadre: Cuadrado, Sobra dinero o Falta dinero.
- Se agregan `RafikiEmptyState` para fechas sin gastos o sin arqueos.
- Se aplica color semántico: ingresos en verde, egresos en rojo y diferencias con estado visual.
- No se agrega SQL nuevo.

## 121.2 — Fase 31D: Limpieza visual de Gastos e Inventario

- Se aplica el sistema visual Rafiki al registro e informe de `GastosDiarios.jsx` sin cambiar servicios ni cálculos.
- En Gastos, el formulario principal pasa a modal en la vista administrativa para no empujar el informe ni la tabla.
- En la ruta rápida de gastos se conserva el formulario visible para mantener velocidad operativa.
- Se agregan estados vacíos amigables cuando una fecha no tiene gastos.
- Se agregan badges para categoría y método de pago, además de color semántico para valores de egreso.
- La tabla de gastos queda más limpia con encabezados pegajosos y acción destructiva agrupada en `Opciones ⋮`.
- Se aplica el sistema visual a `InventarioAdmin.jsx` con pestañas internas para `Insumos` y `Resumen`.
- El editor de insumos usa `RafikiModal` en lugar de un modal manual, manteniendo la edición de stock y productos asociados.
- Inventario ahora muestra badges para estado de stock: OK, Stock bajo, Agotado o Inactivo.
- Se agregan estados vacíos y encabezados pegajosos en el listado de inventario.
- No se agrega SQL nuevo y no se modifica lógica de inventario, descuentos, catálogo, gastos ni Supabase.



## 121.3 — Fase 31E: Limpieza visual de Pedidos Hoy

- Se aplica el sistema visual Rafiki al módulo `Pedidos Hoy` sin modificar consultas, paginación ni lógica de cambio de estado.
- Se agregan pestañas internas para organizar la vista en `Pedidos`, `Mesas` y `Borrados`.
- La vista principal queda más limpia: el resumen de mesas y los pedidos borrados ya no quedan apilados debajo de la tabla principal.
- Los filtros de Pedidos Hoy ahora se pueden ocultar y volver a mostrar para reducir ruido visual en celular.
- La tabla compacta usa `RafikiBadge` para mostrar estado del pedido y forma de pago con colores semánticos.
- Las acciones secundarias de cada pedido se agrupan en `Opciones ⋮`: editar, imprimir, pasar/gestionar crédito, WhatsApp y borrar.
- Se deja visible la acción principal `Entregado` para mantener velocidad operativa durante el servicio.
- Se agrega estado vacío amigable cuando no hay pedidos en la vista seleccionada.
- Se agregan estilos específicos para tabs, filtros colapsados, badges y menú de acciones en Pedidos Hoy.
- No se agrega SQL nuevo y no se modifican servicios, auditoría, cartera, pagos, edición administrativa ni carga optimizada.


## 121.4 — Fase 31F: Uniformidad visual final

- Se agrega una capa global de consistencia visual sobre el sistema Rafiki sin modificar lógica de negocio, servicios ni SQL.
- Se unifican radios, sombras, bordes y superficies para tarjetas, cajas suaves, resumenes, tablas y módulos administrativos.
- Se mejora la consistencia de botones principales, botones pequeños, tabs, chips, opciones y menús contextuales.
- Se agrega un foco accesible uniforme para teclado en botones, enlaces, inputs, selects, textareas, tabs y opciones de menú.
- Inputs, selects y textareas quedan con bordes, fondos y estados de foco más uniformes en formularios de pedidos, caja, gastos, inventario y catálogo.
- Tablas principales reciben una presentación más uniforme: encabezados, hover, bordes, sombras y lectura más consistente.
- Se pulen badges, modales y estados vacíos para mantener el mismo lenguaje visual en Cartera, Caja, Gastos, Inventario y Pedidos Hoy.
- Se agregan reglas responsive generales para celular: menos padding, tarjetas más compactas, botones más tocables y tablas con mejor contenedor horizontal.
- Se respeta `prefers-reduced-motion` para reducir animaciones en usuarios que lo tengan configurado.
- No se agrega SQL nuevo y no se modifica lógica financiera, carga de pedidos, inventario, caja, cartera ni Supabase.

## 121.5 — Fase 31G: Revisión móvil y experiencia en celular

- Se refuerza la experiencia móvil general sin modificar lógica de negocio, servicios ni SQL.
- Los modales `RafikiModal` ahora bloquean el scroll del fondo mientras están abiertos y usan identificadores accesibles únicos.
- En celular, los modales se comportan como hoja inferior para facilitar el uso con el pulgar y mantener el botón de cierre y el footer visibles.
- El menú `Opciones ⋮` ahora responde a Escape y, en celular, se muestra como una hoja inferior con fondo de cierre para evitar menús pequeños o cortados dentro de tablas.
- Se agregan mejoras de safe area para PWA instalada en celulares, respetando notch, barra inferior y modo standalone.
- Se refuerzan tamaños táctiles mínimos en botones, mini botones, tabs, chips, inputs, selects y textareas.
- Las tablas largas muestran una guía visual “Desliza la tabla →” en móvil y mantienen desplazamiento horizontal suave.
- Se compactan y ordenan acciones en móvil para Pedidos Hoy, Cartera, Caja, Gastos, Inventario, Catálogo, Mesas y formularios de filtros.
- Se ajustan grids y formularios a una sola columna en pantallas pequeñas para reducir cortes, overflow y botones incómodos.
- Se mantiene intacta la lógica de pedidos, cartera, caja, inventario, gastos, Supabase, auditoría y PWA.


## 121.6 — Fase 31H.1: Correcciones críticas de componentes reutilizables

- Se corrige `RafikiActionMenu` para renderizar el menú desplegable mediante React Portal directamente en `document.body`, evitando que `overflow: auto` de tablas o contenedores corte las opciones.
- El menú `Opciones ⋮` ahora calcula su posición con `getBoundingClientRect()` en escritorio y conserva la hoja inferior en celular.
- Se agregan listeners de reposicionamiento en scroll y resize para mantener el menú alineado con su botón mientras está abierto.
- Se refuerza el cierre por clic externo, fondo móvil y tecla Escape sin depender de que el menú esté dentro del mismo contenedor visual.
- Se mejora `RafikiModal` con un contador global de modales abiertos para que el bloqueo de scroll del body solo se retire cuando no quede ningún modal activo.
- Se agrega un trap básico de foco en modales para que Tab y Shift+Tab no saquen el foco accidentalmente del diálogo abierto.
- Se mejora `RafikiTabs` con navegación por teclado usando flechas, Home y End, manteniendo `tabIndex` accesible según la pestaña activa.
- Se agrega navegación por teclado en `RafikiActionMenu` con flechas, Home, End, Escape y Tab.
- No se modifica lógica de negocio, servicios, SQL, pedidos, cartera, caja, gastos, inventario ni cálculos financieros.
