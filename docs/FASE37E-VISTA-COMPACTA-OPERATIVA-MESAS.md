# Fase 37E — Selector Normal y Compacta operativa en Mesas

Base: `127.14-FASE37D-ADICIONALES-CANTIDADES-MESAS-2026-07-31.zip`.

Versión: `127.15-FASE37E-VISTA-COMPACTA-OPERATIVA-MESAS-2026-08-05`.

## Objetivo

Probar dentro de `/mesas` la interfaz compacta desarrollada anteriormente como beta, sin reemplazar ni poner en riesgo la vista Normal.

## Implementación

- Se agrega un selector compacto al inicio de `/mesas` con las opciones **Normal** y **Compacta**.
- Normal continúa siendo la opción predeterminada al cargar la ruta.
- La vista Compacta se integra dentro de `PanelMesas.jsx`; no crea un segundo motor de pedidos.
- Ambas vistas comparten `itemsMesa`, mesa o llevar, cliente, teléfono, ubicación, mesero, forma de pago, observaciones, total y estado de edición.
- Es posible alternar durante un pedido sin perder la información ingresada.
- El flujo compacto utiliza ventanas modales para proteína, acompañantes y datos de mesa.
- El botón de envío ejecuta `enviarPedidoMesa`, la misma función usada por la vista Normal.
- Los pedidos compactos se guardan en Supabase, se reflejan en Pedidos Hoy, actualizan los módulos financieros correspondientes y usan el flujo de impresión oficial.
- La edición administrativa también puede guardarse desde la vista Compacta.
- Cafetería y adicionales siguen usando temporalmente la presentación Normal; la Compacta ofrece accesos directos que cambian de vista conservando el pedido.

## Seguridad operativa

- No se altera la vista Normal ni su flujo de envío.
- No se duplica el estado del pedido.
- No se modifica Supabase ni se requiere SQL.
- No se crean servicios paralelos de guardado o impresión.
- Después de enviar, se utiliza la confirmación oficial de Mesas.

## Archivos principales

- `src/modules/mesas/components/PanelMesas.jsx`
- `src/styles/app.css`
- `src/config/rafikiBuild.js`
- `public/rafiki-version.json`
- `scripts/validate-fase37e-vista-compacta-mesas.mjs`
