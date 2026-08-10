# Fase 37A.2 — Hotfix Parfait en Mesas y Cliente

Versión: `127.10-FASE37A2-HOTFIX-PARFAIT-MESAS-CLIENTE-2026-07-23`

## Problema encontrado

El Catálogo de productos de Cafetería almacena los tamaños del Parfait con nombres como `Parfait 12 oz`, `Parfait 16 oz` y `Parfait 22 oz`. En `/mesas`, el constructor volvía a anteponer la palabra `Parfait`, generando internamente textos como `Parfait Parfait 12 oz - Frutas: Fresa, Banano`.

La Fase 37A.1 limpiaba algunos textos heredados, pero si el campo `tamano` también contenía `Parfait 12 oz`, el formateador volvía a crear la duplicación. Además, ciertos registros podían identificar la subcategoría directamente como `Parfait` en lugar de usar `categoria: cafeteria`.

## Corrección

- `/mesas` extrae y guarda ahora el tamaño canónico `12 oz`, `16 oz` o `22 oz` antes de construir el item.
- El resumen canónico normaliza el campo `tamano`, aunque llegue como `Parfait 12 oz`.
- El detector reconoce `Parfait`, Batidos y Jugos tradicionales como categorías de Cafetería aunque no exista `area: cafeteria`.
- `/cliente`, `/mesas`, sus variantes beta, Pedidos Hoy, Cartera y comandas siguen utilizando el mismo formateador compartido.
- Los pedidos heredados con `Parfait Parfait...` se muestran e imprimen como `Parfait 12 oz · Fresa, Banano`.

No requiere nueva migración de Supabase.
