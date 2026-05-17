# Rafiki Pedidos

Aplicación web/PWA para gestionar pedidos de Rafiki: panel de cliente, panel de mesas, administración, cafetería, solicitud de insumos y generación de menú.

## Estado del proyecto

Versión de trabajo: **Fase 13C — Base técnica segura**.

Esta fase agrega infraestructura de desarrollo sin cambiar la lógica visual grande de la aplicación:

- README de instalación y despliegue.
- ESLint básico y flexible.
- Prettier básico.
- Vitest para pruebas unitarias iniciales.
- Primeras pruebas sobre utilidades puras.

## Requisitos

- Node.js 18 o superior.
- npm.
- Proyecto de Supabase configurado.
- Variables de entorno disponibles en local y en Vercel.

## Instalación local

```bash
npm install
npm run dev
```

La aplicación se abre normalmente en:

```bash
http://localhost:5173
```

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```bash
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

En Vercel deben configurarse las mismas variables en **Project Settings > Environment Variables**.

## Scripts disponibles

```bash
npm run dev
```

Inicia el servidor local de Vite.

```bash
npm run build
```

Genera la versión de producción.

```bash
npm run preview
```

Permite revisar localmente el build de producción.

```bash
npm run lint
```

Ejecuta ESLint con reglas básicas.

```bash
npm run format
```

Formatea el proyecto con Prettier.

```bash
npm run format:check
```

Revisa si el formato está correcto sin modificar archivos.

```bash
npm run test
```

Ejecuta las pruebas unitarias con Vitest.

## Estructura general

```text
src/
  components/        Componentes principales de la app
  config/            Configuración interna
  data/              Menús, productos y datos base
  styles/            Estilos centralizados
  utils/             Funciones reutilizables y lógica pura
  App.jsx            Entrada principal de la aplicación
  main.jsx           Montaje React
  registerSW.js      Registro del Service Worker
  supabaseClient.js  Cliente Supabase validado
public/
  manifest.json      Configuración PWA
  sw.js              Service Worker
  icon-*.png         Iconos PWA
```

## PWA y caché

La app usa manifest e iconos PWA desde `public/`. El Service Worker debe mantenerse simple y versionado para evitar errores por caché viejo.

Cuando haya cambios importantes en producción, se recomienda:

1. Subir nueva versión a Vercel.
2. Probar en navegador normal.
3. Probar en modo incógnito.
4. Probar en celular.
5. Si el celular mantiene una versión vieja, borrar datos del sitio o reinstalar la PWA.

## Pruebas iniciales

Las pruebas de esta fase se enfocan en funciones seguras y puras:

- Limpieza de texto.
- Formato de número de pedido.
- Detección de cafetería.
- Formato de mensajes para solicitud de insumos.
- Limpieza de listas/precios del generador de menú.

Estas pruebas son una base mínima para seguir dividiendo componentes grandes con menos riesgo.

## Recomendación para próximas fases

Antes de dividir componentes delicados como `PanelMesas.jsx`, `SolicitudProductos.jsx` o `GeneradorMenu.jsx`, conviene ampliar pruebas sobre:

- Cálculo de totales.
- Pedido para llevar.
- Mensajes de WhatsApp.
- Estados de pedidos.
- Solicitudes de insumos.

## Despliegue en Vercel

1. Subir el proyecto a GitHub.
2. Conectar el repositorio en Vercel.
3. Configurar variables de entorno.
4. Ejecutar deploy.
5. Validar rutas principales:

```text
/
/cliente
/mesas
/admin
```

## Notas importantes

- No subir `.env.local` al repositorio.
- No modificar el Service Worker sin probar caché en móvil.
- No dividir componentes grandes sin pruebas mínimas.
- Evitar `package-lock.json` si está causando conflictos en el flujo actual del proyecto.
