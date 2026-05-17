# Fase 12G Fix - useMemo

Corrección aplicada después del despliegue de la Fase 12G.

## Error detectado
La aplicación mostraba:

`useMemo is not defined`

## Causa real
En `src/App.jsx` se estaban usando varios `useMemo(...)`, pero el hook no estaba importado desde React.

Antes:
```js
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
```

Después:
```js
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
```

## Verificación
- Se revisaron las referencias de hooks React en archivos `.jsx`.
- `npm run build` ejecutado exitosamente.
- No se modificó la lógica de pedidos, roles, Supabase, WhatsApp ni paneles.
