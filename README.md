# Rafiki Pedidos — 120.4

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
