## 125.6 — Hotfix 35E.2 Tablas térmicas compactas

Versión: 125.6-HOTFIX35E2-TABLAS-TERMICAS-COMPACTAS-2026-07-01

Se corrige el enfoque general de impresión térmica para que los listados no salgan como bloques largos. Ahora el motor central soporta modo **tabla compacta**.

En **Pedidos Hoy** el formato queda optimizado como:

```text
Pedido | Cliente | Ubicación | Total
```

También se aplicó tabla compacta en **Gastos** y **Cartera**, evitando textos largos en los listados térmicos. Se mantiene el selector global 58 mm / 80 mm y la regla de que ambos formatos imprimen la misma información; solo cambia la optimización visual por ancho.

Validación recomendada: `npm run thermal-tabla:check`, `npm run thermal-pedidos-hoy:check`, `npm run thermal-gastos-cartera:check`, `npm run thermal-selector:check`, `npm run build` y `npm run lint`.

---

## 125.5 — Hotfix 35E.1 Pedidos Hoy térmico compacto

Versión: 125.5-HOTFIX35E1-PEDIDOS-HOY-TERMICO-COMPACTO-2026-07-01

Ajuste puntual sobre la impresión térmica de **Pedidos Hoy**.

Ahora el listado vuelve al formato compacto:

- Número de pedido
- Cliente
- Ubicación
- Total

Se eliminan del listado térmico los textos largos de detalle del pedido, línea, pago/estado y hora, para que la impresión sea más limpia en 58 mm y 80 mm. Se mantiene el selector global y la misma información para ambos formatos.

---

## 125.4 — Fase 35E Selector térmico global 58 / 80 mm

Se reemplazaron los botones separados de **58 mm** y **80 mm** por un selector térmico reutilizable en Pedidos Hoy, Informe Caja, Gastos y Cartera. El formato seleccionado se guarda como preferencia global en el navegador, evitando botones duplicados y manteniendo una experiencia más limpia.

Regla conservada: **58 mm y 80 mm imprimen la misma información**. La diferencia sigue siendo únicamente visual: ancho, tamaño, espaciado y saltos de línea.

Archivos principales: `src/modules/impresion/ThermalPrintControls.jsx`, `src/modules/impresion/thermalReportService.js`, `src/modules/admin/components/pedidos/AdminPedidosSection.jsx`, `src/modules/caja/components/CajaAdmin.jsx`, `src/modules/gastos/components/GastosDiarios.jsx`, `src/modules/cartera/components/CarteraClientesCredito.jsx`, `src/styles/appStyles.js` y `scripts/validate-thermal-selector.mjs`.

Validación recomendada: `npm run thermal-selector:check`, `npm run thermal-reports:check`, `npm run thermal-pedidos-hoy:check`, `npm run thermal-caja:check`, `npm run thermal-gastos-cartera:check`, `npm run build` y `npm run lint`.

Versión: 125.4-FASE35E-SELECTOR-TERMICO-GLOBAL-2026-07-01

## 125.1 — Fase 35B Pedidos Hoy térmico con filtros activos

Se profundizó la impresión térmica de **Pedidos Hoy** para que los botones de 58 mm y 80 mm impriman la **misma información**, cambiando únicamente ancho, tamaño y saltos de línea. El informe ahora incluye rango/búsqueda aplicada, filtros rápidos, orden visible, cantidad impresa vs. cargada, resumen operativo, totales por método de pago y detalle ampliado por pedido.

Archivos principales: `src/modules/admin/components/pedidos/AdminPedidosSection.jsx`, `src/modules/impresion/thermalReportService.js`, `src/styles/appStyles.js` y `scripts/validate-thermal-pedidos-hoy.mjs`.

Validación recomendada: `npm run thermal-pedidos-hoy:check`, `npm run thermal-reports:check`, `npm run build` y `npm run lint`.

Versión: 125.1-FASE35B-PEDIDOS-HOY-TERMICO-FILTROS-2026-06-30


## 124.45 — Hotfix 34F.1 Cliente para llevar blindado

Se corrigió de raíz el flujo público `/cliente` para que los pedidos queden para llevar por defecto, sumen el adicional correspondiente y se guarden como `tipo_pedido: "llevar"`, salvo cuando el cliente marque explícitamente “Registrar este pedido para comer en el restaurante”. También se agregó una validación estática con `npm run cliente-para-llevar:check`.

Versión: 124.41-HOTFIX34E1-CAFETERIA-VISIBLE-CLIENTE-2026-06-26

## 124.40 — Fase 34E reglas clientes especiales en /cliente

- Activa reglas especiales en `/cliente` para códigos válidos.
- Si el cliente especial tiene `sin_restriccion_acompanantes`, puede continuar sin mínimo 2 acompañantes.
- Si tiene `habilita_cafeteria`, aparece una sección de Cafetería dentro del link público `/cliente`.
- Los productos de cafetería se agregan como items `categoria: "cafeteria"`, sin afectar el selector de almuerzos.
- Se guarda una referencia segura del cliente especial dentro del JSON de cada item del pedido para preparar promociones, regalos o descuentos futuros.
- No modifica `/mesas`, Caja, Cartera ni Pedidos Hoy.


## 124.39 — Hotfix 34D.9 mensaje bienvenida cliente especial

- Ajusta el texto del modal de bienvenida mostrado al aplicar un código válido en `/cliente`.
- Nuevo texto secundario: `Gracias por preferirnos. Ya puedes continuar con tu pedido.`
- No modifica `/mesas`, Caja, Cartera, Pedidos Hoy ni reglas 34E.


## 124.37 - Hotfix 34D.7: Código cliente discreto y bienvenida destacada

- Ajusta el recuadro de código de cliente especial en `/cliente` para que sea más discreto.
- Elimina el bloque posterior con nombre, código y texto de precarga.
- Mantiene un mensaje de bienvenida más grande y limpio.
- No modifica `/mesas`, Caja, Cartera, Pedidos Hoy ni reglas de 34E.


## 124.36-HOTFIX-PASTAS-EN-PLATOS-ACOMPANANTES-DIA-2026-06-26

- Corrige el caso donde productos en categoría **Platos** cuyo nombre contiene **Pastas** todavía no eran tratados como producto sin selección manual de acompañantes.
- Aplica para `/cliente` y `/mesas` porque ambos usan la función compartida `esProductoSinAcompanantes`.
- Mantiene el mensaje: “Este Producto viene con acompañantes del día”.

# Rafiki Pedidos — 124.35

Hotfix 34D.5 — Mensaje de acompañantes del día para Sopas, Pastas y Arroces.

## Objetivo del hotfix

Corregir el mensaje visual de los productos que no llevan selección manual de acompañantes en `/cliente` y `/mesas`.

## Cambios principales

- Se mantiene que Sopas, Pastas y Arroces no muestran selector de acompañantes.
- Se elimina el mensaje visual “🥣 Producto de sopas”.
- Se elimina el texto “Este producto no requiere acompañantes”.
- En su lugar se muestra: **Este Producto viene con acompañantes del día**.
- El resumen del pedido también deja de mostrar “Acompañantes: No aplica” para estos productos.
- Se centraliza el texto en `MENSAJE_ACOMPANANTES_DEL_DIA` dentro de `src/shared/utils/pedidos.js`.

## Alcance seguro

Este hotfix no modifica Caja, Cartera, Pedidos Hoy, servicios de guardado ni reglas de clientes especiales. Tampoco activa todavía la Fase 34E.

## Validación

- `npm run build`: correcto.
- `npm run lint`: sin errores, solo advertencias antiguas.
- `node scripts/validate-pwa.mjs`: correcto.

Documentación: `docs/FASE34D5-HOTFIX-ACOMPANANTES-DIA.md`.

---

# Rafiki Pedidos — 124.3

Fase 34D — Recuadro de código especial en `/cliente`.

## Objetivo de Fase 34D

Permitir que un cliente ingrese un código especial desde `/cliente`, validarlo con la RPC segura `validar_cliente_especial_codigo`, mostrar mensaje de bienvenida y precargar nombre, teléfono y ubicación sin afectar `/mesas`.

## Cambios principales

- Nuevo componente `src/modules/cliente/components/CodigoClienteEspecial.jsx`.
- Nuevo recuadro inicial **¿Tienes código de cliente?** dentro de `/cliente`.
- Validación pública del código mediante RPC, sin exponer el listado completo de clientes especiales.
- Precarga controlada de nombre, teléfono y ubicación.
- Mensajes controlados para código válido, inválido, inactivo o corto.
- Estado interno `clienteEspecialAplicado` preparado en `App.jsx` para la Fase 34E.
- Nuevos estilos responsive para el bloque de código especial.
- Documentación de fase en `docs/FASE34D-RECUADRO-CODIGO-CLIENTE.md`.

## Alcance seguro

Esta subfase sí modifica `/cliente`, pero de forma limitada. No elimina todavía la restricción de acompañantes, no habilita todavía Cafetería en `/cliente` y no modifica `/mesas`.

## Requisito previo

Ejecutar previamente el SQL de Fase 34A:

```text
supabase/2026-06-25-fase34a-clientes-especiales.sql
```

---

# Rafiki Pedidos — 124.1

Fase 34B — Panel de Clientes Especiales en Catálogo.

## Objetivo de Fase 34B

Agregar administración visual de clientes especiales/VIP dentro de **Gerencia > Catálogo**, sin activar todavía cambios en `/cliente` ni `/mesas`.

## Cambios principales

- Nueva pestaña **Clientes especiales** dentro de `CatalogoRafa`.
- Nuevo componente `src/modules/catalogo/components/ClientesEspecialesCatalogo.jsx`.
- Formulario para crear/editar clientes especiales con código, nombre, teléfono, ubicación, mensaje de bienvenida y observaciones.
- Activación/desactivación de clientes especiales desde el listado.
- Reglas guardadas para próximas fases: sin restricción de acompañantes, habilitación futura de cafetería y datos editables.
- Listado responsive con tabla en escritorio y tarjetas en móvil.
- Documentación de fase en `docs/FASE34B-PANEL-CLIENTES-ESPECIALES.md`.

## Alcance seguro

Esta subfase no modifica `src/modules/cliente`, `src/modules/mesas` ni `src/App.jsx`. Por lo tanto, `/cliente` y `/mesas` deben conservar el mismo comportamiento de la versión anterior.

## Requisito previo

Ejecutar previamente el SQL de Fase 34A:

```text
supabase/2026-06-25-fase34a-clientes-especiales.sql
```

---

# Rafiki Pedidos — 124.0

Fase 34A — Base SQL y arquitectura de Clientes Especiales.

## Objetivo de Fase 34A

Crear la base segura para códigos de clientes especiales sin modificar todavía `/cliente`, `/mesas` ni la lógica de pedidos.

## Cambios principales

- Nueva tabla SQL `clientes_especiales` para nombre, teléfono, ubicación, código, estado y reglas especiales.
- Nueva RPC `validar_cliente_especial_codigo(p_codigo text)` para validar códigos desde la zona pública sin exponer toda la tabla.
- Nuevo servicio `src/services/clientesEspecialesService.js`, preparado para futuras integraciones visuales.
- Campo flexible `reglas_json` para promociones, regalos, descuentos y beneficios futuros.
- Documentación de fase en `docs/FASE34A-BASE-CLIENTES-ESPECIALES.md`.

## Alcance seguro

Esta subfase no modifica `src/modules/cliente`, `src/modules/mesas` ni `src/App.jsx`. Por lo tanto, `/cliente` y `/mesas` deben conservar el mismo comportamiento de la versión anterior.

---

# Rafiki Pedidos — 121.10

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



## 121.8 — Fase 31H.3: Ajustes específicos en pantallas operativas

- Se ajustó la experiencia móvil del Panel Mesas evitando que el topbar general compita con la navegación fija de pasos.
- Se agregó clase contextual `mesas-pos-activo` en la app cuando la vista activa es `/mesas`.
- En móvil, el topbar se oculta solo en Panel Mesas y se conserva espacio seguro superior para el `mesa-step-nav`.
- `GastosDiarios` ahora memoriza la carga principal con `useCallback` para evitar recrear la función en cada render.
- La edición de gastos en modo rápido ahora usa `scrollIntoView` suave hacia el formulario en vez de saltar al inicio absoluto de la app.
- No se modificaron cálculos, servicios, SQL, pedidos, cartera, caja, inventario ni Supabase.

## 121.7 — Fase 31H.2: Correcciones CSS móvil críticas

- Se corrigió la regla móvil global que forzaba todos los `.button` a `width: 100%`.
- El ancho completo queda limitado a botones marcados como `full-width`, `add-meal`, `continue-button` o `summary-continue`, además de contextos específicos ya definidos.
- Se ajustó `.nav-wrap` para trabajar siempre con `flex-wrap: nowrap`, evitando saltos visuales inesperados.
- Se reforzó el scroll horizontal de navegación, tabs y chips en celular.
- Se evitó que botones de navegación, tabs y chips hereden ancho completo en móvil.
- Se eliminaron bloques CSS duplicados de Caja para reducir riesgo de divergencia futura.
- No se modificó lógica de negocio, servicios, SQL, pedidos, cartera, caja, inventario ni Supabase.


## 121.10 — Hotfix navegación Panel Mesas

- Se corrigió un efecto secundario de la Fase 31H.3/31H.4: en móvil, el Panel Mesas estaba ocultando la barra superior completa.
- En `/mesas` vuelve a mostrarse la navegación principal: Admin, Pedidos hoy y Gerencia cuando el usuario tiene permiso.
- La barra superior de Mesas ahora queda compacta y debajo de la navegación fija de pasos 1-2-R-3.
- No se modificó lógica de pedidos, cartera, caja, inventario, gastos, Supabase ni SQL.

## 121.9 — Fase 31H.4: Limpieza visual gradual y deuda técnica

- Se inició la migración gradual de colores repetidos en `appStyles.js` hacia variables CSS reutilizables.
- Se agregaron variables complementarias para tonos frecuentes de marca, borde y texto.
- Se redujeron colores hardcodeados principales como naranja Rafiki, fondo crema, borde naranja claro, texto principal y texto secundario.
- Se agregaron utilidades visuales pequeñas para espaciado y tamaño de íconos: `u-mt-12`, `u-mt-18`, `u-mb-0`, `u-mb-12`, `u-mb-18`, `u-icon-sm`.
- Se limpió de forma segura `PedidoCliente.jsx`, reemplazando estilos inline simples por clases reutilizables.
- Se agregó clase específica `pedido-cliente-submit` para el botón final de envío a cocina, evitando estilos inline.
- No se hizo una limpieza masiva de todo `/cliente` para evitar cambios visuales bruscos en la pantalla del usuario final.
- No se modificó lógica de pedidos, servicios, SQL, Supabase, cartera, caja, gastos, inventario ni cálculos financieros.

## 124.2 — Fase 34C: Validación controlada de código especial

- Se agrega en `Gerencia > Catálogo > Clientes especiales` un bloque interno para probar códigos especiales antes de activarlos en `/cliente`.
- La prueba usa la RPC `validar_cliente_especial_codigo` creada en Fase 34A.
- Si el código está activo, se muestran nombre, código, teléfono, ubicación, mensaje y reglas disponibles para próximas fases.
- Si el código no existe, está inactivo o es inválido, se muestra una advertencia controlada sin exponer el listado completo de clientes especiales.
- Esta validación no crea pedidos, no altera pedidos existentes y no cambia reglas operativas.
- No se modifica `src/modules/cliente`, `src/modules/mesas` ni `src/App.jsx`.
- Esta fase deja lista la prueba previa para Fase 34D, donde se podrá incorporar el recuadro de código en `/cliente` de manera segura.


## Fase 34D.1 — Hotfix recuadro código cliente visible

Versión: `124.32-HOTFIX34D2-CLIENTE-LINK-PUBLICO-SIN-PWA-2026-06-26`

Se movió el recuadro **“⭐ ¿Tienes código de cliente?”** al inicio visible de `/cliente`, antes del encabezado del menú. Esta ruta corresponde al link público de clientes y no debe mezclarse con el flujo PWA interno.

No se modificó `/mesas`.


## 124.33-HOTFIX34D3-RECUADRO-CLIENTE-DESDE-APP-2026-06-26

Hotfix 34D.3: el recuadro `⭐ ¿Tienes código de cliente?` se renderiza directamente desde `App.jsx` cuando la vista es `/cliente`, antes del formulario de pedido. Se retiró el render duplicable desde `PedidoCliente.jsx`. No se modificó `/mesas`, Caja, Cartera ni reglas de pedidos.


## 124.38 - Hotfix 34D.8 - Bienvenida cliente especial en modal

- La bienvenida al aplicar un código de cliente especial en `/cliente` ahora aparece en un `RafikiModal` elegante.
- Se conserva el recuadro de código en versión discreta.
- Se elimina el mensaje fijo de bienvenida dentro de la tarjeta para no ocupar espacio permanente.
- Se corrigió la ubicación de estilos del hotfix visual anterior dentro de `appStyles`.
- No se tocaron `/mesas`, Caja, Cartera, Pedidos Hoy ni reglas pendientes de 34E.


## 124.42-HOTFIX34E2-CLIENTE-RESTAURANTE-CAFETERIA-TABS-2026-06-26

Hotfix 34E.2: en `/cliente`, para clientes especiales con Cafetería habilitada, se agregó una fila discreta de selección `Restaurante / Cafetería`, dejando `Restaurante` abierto por defecto. También se simplificó el aviso a solo `⭐ Cliente especial activo`. No se tocó `/mesas`, Caja, Cartera ni Pedidos Hoy.

## 124.43-FASE34E3-TRAZABILIDAD-CLIENTE-ESPECIAL-2026-06-26

Fase 34E.3: se centralizó la normalización del cliente especial para pedidos y se guarda una referencia segura dentro de `items[].cliente_especial`, preparando promociones, regalos, descuentos y reportes futuros sin agregar columnas SQL. La confirmación de `/cliente` muestra una franja discreta `⭐ Cliente especial aplicado` cuando corresponde. No se tocó `/mesas`, Caja, Cartera ni Pedidos Hoy.

## 124.44-FASE34F-PRUEBAS-FINALES-CLIENTES-ESPECIALES-2026-06-26

Fase 34F: cierre de pruebas controladas para Clientes Especiales. Se agregó una matriz de pruebas manuales y el script `npm run clientes-especiales:check` para validar puntos críticos del flujo: `/cliente` como link público, modal de bienvenida, selector `Restaurante / Cafetería`, restaurante abierto por defecto, guardado de `items[].cliente_especial`, mensaje de acompañantes del día y aislamiento de `/mesas`. No se agregaron reglas nuevas ni se tocaron Caja, Cartera, Pedidos Hoy o Dashboard.

## 125.0-FASE35A-INFORMES-TERMICOS-58-80-2026-06-30

Fase 35A: se agregó una base central para impresión térmica de informes administrativos en 58 mm y 80 mm. La regla aplicada es que ambos formatos imprimen la misma información; solo cambia la optimización visual para cada ancho. Se integró impresión de Pedidos Hoy según filtros visibles en pantalla y de Informe Caja desde Gerencia. No se tocó `/cliente`, `/mesas`, guardado de pedidos, Caja en cálculos internos, Cartera, Dashboard, SQL ni impresión actual de comandas.

## 125.2-FASE35C-INFORME-CAJA-TERMICO-REFORZADO-2026-07-01

Fase 35C: se reforzó la impresión térmica de `Gerencia > Caja > Informe Caja` en 58 mm y 80 mm. Ambos formatos imprimen la misma información; solo cambia la optimización visual por ancho. El informe ahora incluye resumen operativo, ajustes de Caja, ventas y gastos por método de pago, saldos de inicio, saldos del último arqueo, detalle enriquecido de gastos, arqueos realizados con saldos y fórmula validada opción 2. No se tocaron `/cliente`, `/mesas`, Pedidos Hoy, Cartera, Dashboard, SQL, guardado de pedidos ni impresión de comandas.


## 125.3-FASE35D-GASTOS-CARTERA-TERMICO-2026-07-01

Fase 35D: se agregó impresión térmica administrativa para `Gastos Diarios` y `Cartera` en 58 mm y 80 mm. Ambos formatos imprimen la misma información; solo cambia la optimización visual por ancho. En Gastos se imprime fecha, total, resumen por categoría, resumen por método de pago y detalle de gastos. En Cartera se agregó impresión de resumen general y movimientos filtrados, incluyendo indicadores, filtros, resumen por estado, abonos por método y detalle de movimientos. No se tocaron `/cliente`, `/mesas`, Caja, Pedidos Hoy, Dashboard, SQL, guardado de pedidos ni comandas.
