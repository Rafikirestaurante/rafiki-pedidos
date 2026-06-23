# Fase 33F — Hotfix PWA en Mesas con sesión administrativa

Versión: `123.4-PWA-MESAS-LOGIN-NAV-2026-06-20`

## Objetivo

Revertir el arranque obligatorio de la PWA en `/admin` y dejar nuevamente la app instalada abriendo por defecto en `/mesas`, sin perder la barra administrativa para usuarios con permisos.

## Cambios aplicados

### 1. PWA inicia en Panel Mesas

Se actualizó el `manifest` de Vite y el manifest público para que la PWA instalada use:

```txt
/mesas?app=mesas
```

La raíz pública del navegador se mantiene redirigida a `/cliente` desde `vercel.json`.

### 2. Login al iniciar en PWA

Cuando la app se abre como PWA instalada y no existe sesión administrativa local, la vista inicial muestra el login administrativo antes de entrar al panel de mesas.

Esto permite identificar si el usuario tiene rol administrador y evitar que `/mesas` arranque sin saber qué accesos debe mostrar.

### 3. Refresco de rol en `/mesas`

Antes, el hook administrativo solo verificaba sesión en rutas como `/admin`, `/pedidos`, `/gerencia` e `/inventario`.

Ahora también verifica sesión en `/mesas` cuando:

- la app está instalada como PWA, o
- existe una sesión administrativa local activa.

Con esto, el rol se refresca y la barra administrativa aparece correctamente.

### 4. Barra en Panel Mesas

En `/mesas`, cuando hay sesión administrativa válida, se muestra la navegación:

```txt
Pedidos hoy | Admin | Gerencia
```

`Gerencia` solo aparece si el rol tiene permiso real para verla.

### 5. Recuperación PWA

La recuperación por caché o módulos dinámicos antiguos vuelve a abrir en `/mesas`, no en `/admin`.

También se corrige el arranque de instalaciones viejas que todavía conserven `/admin?app=admin` como `start_url`: al detectar esa entrada en modo PWA, la app redirige internamente a `/mesas`.

## Archivos modificados

```txt
vite.config.js
public/manifest.json
public/rafiki-version.json
scripts/validate-pwa.mjs
src/config/rafikiBuild.js
src/shared/utils/navigation.js
src/shared/utils/pwaRecovery.js
src/shared/hooks/useAuthAdmin.js
src/shared/components/InstallPWA.jsx
src/modules/mesas/components/PanelMesas.jsx
docs/FASE33F-HOTFIX-PWA-MESAS-LOGIN-NAV.md
```

## Nota operativa

Si un celular conserva una versión anterior de la PWA, puede ser necesario limpiar caché o reinstalar el acceso directo después del despliegue.
