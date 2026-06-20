# Fase 33F Hotfix — Root público hacia Cliente y PWA obligatoria en Admin

Versión: `123.3-ROOT-CLIENTE-PWA-ADMIN-2026-06-20`

## Objetivo

Separar dos comportamientos que necesitaban convivir sin conflicto:

1. El enlace público `https://rafiki-pedidos.vercel.app/` debe abrir directamente la vista de clientes (`/cliente`).
2. La PWA instalada debe abrir obligatoriamente en el panel administrativo (`/admin`).

## Cambios aplicados

### 1. Redirección pública desde `/` hacia `/cliente`

Se agregó una regla en `vercel.json`:

```json
{
  "source": "/",
  "destination": "/cliente",
  "permanent": false
}
```

Esto permite compartir la URL principal del dominio con clientes sin que vean el inicio interno.

### 2. PWA instalada reforzada hacia `/admin`

Aunque el manifest ya tenía `start_url: /admin?app=admin`, algunos celulares pueden conservar la ruta desde donde la PWA fue instalada previamente, por ejemplo `/mesas` o `/cliente`.

Por eso se reforzó `src/shared/utils/navigation.js` para que, cuando detecte modo instalado, el primer arranque redirija a `/admin` si la ruta inicial es:

- `/`
- `/cliente`
- `/pedido`
- `/mesas`

Se mantiene una excepción para accesos directos explícitos del manifest con `source=pwa-shortcut`.

### 3. Manifest y accesos directos

Se conservó:

- `id: /admin`
- `start_url: /admin?app=admin`
- `scope: /`

Además, los accesos rápidos antiguos de `/rafa` y `/gastos` se llevaron hacia `/gerencia`, que es la ruta actual del proyecto.

## Archivos modificados

- `vercel.json`
- `vite.config.js`
- `public/manifest.json`
- `public/rafiki-version.json`
- `src/config/rafikiBuild.js`
- `src/shared/utils/navigation.js`
- `src/shared/utils/pwa.js`
- `docs/FASE33F-HOTFIX-ROOT-CLIENTE-PWA-ADMIN.md`

## Nota importante para celulares

Si un celular ya tenía instalada una PWA antigua, es posible que conserve caché o el acceso anterior. Después de desplegar esta versión, si aún abre en otra ruta, se recomienda:

1. Abrir la app instalada.
2. Usar el botón de limpiar caché si aparece.
3. Si persiste, eliminar el acceso instalado y volver a instalar desde `/admin`.

La corrección 123.3 reduce este problema porque ahora también fuerza `/admin` desde código cuando detecta modo PWA instalada.
