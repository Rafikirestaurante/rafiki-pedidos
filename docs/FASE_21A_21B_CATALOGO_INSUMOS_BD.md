# Fase 21A-21B — Catálogo de insumos en base de datos

Esta versión inicia la Fase 21 de forma segura: todavía no cambia el funcionamiento de la pantalla de Solicitud de insumos. Primero deja preparada la base de datos para mover el catálogo hardcodeado hacia Supabase.

## Qué incluye

- Tabla `catalogo_insumos_categorias`.
- Tabla `catalogo_insumos`.
- Índices para evitar duplicados por nombre.
- Campos iniciales: categoría, nombre, unidad base, proveedor, activo y orden.
- Políticas RLS iniciales para usuarios autenticados.
- Semilla con los 144 insumos actuales organizados en 7 categorías.

## Cómo aplicarlo en Supabase

1. Abrir Supabase.
2. Ir a **SQL Editor**.
3. Crear una consulta nueva.
4. Copiar y ejecutar el contenido de:

`supabase/migrations/20260524_fase21a_21b_catalogo_insumos.sql`

5. Al final debe mostrar:

- `categorias`: 7
- `insumos`: 144

## Importante

Esta fase no toca realtime, offline, pedidos, autenticación, menú diario ni PWA. La conexión de la pantalla “Solicitud de insumos” a esta tabla se debe hacer en la Fase 21C, manteniendo fallback local en Fase 21D.
