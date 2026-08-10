# Fase 37B — Calendario móvil ampliable

Versión: `127.11-FASE37B-CALENDARIO-MOVIL-ZOOM-2026-07-25`

## Objetivo

Mejorar la lectura del calendario mensual de **Informes → Rafa** en teléfonos sin rediseñar la versión de escritorio que ya estaba aprobada.

## Implementación

- El calendario normal de escritorio se mantiene sin cambios visuales.
- En pantallas de hasta 700 px aparece un botón discreto **🔍 Ampliar**.
- El botón abre una vista de pantalla completa en móvil.
- El calendario inicia ajustado al ancho disponible, como si fuera una imagen completa.
- Se puede ampliar o alejar con gesto de dos dedos.
- Se puede desplazar con un dedo cuando el calendario supera el área visible.
- Incluye controles `−`, `+` y **Ajustar** como alternativa al gesto.
- La vista ampliada permite cambiar de mes sin cerrarla.
- Tocar un día cierra la ampliación y abre el mismo detalle de ventas/gastos/pedidos/ticket promedio ya existente.
- Se conserva la semántica y accesibilidad de los botones de cada día.

## Alcance técnico

Archivos funcionales principales:

- `src/modules/dashboard/components/VentasMensualesDashboard.jsx`
- `src/styles/app.css`

No hay cambios en Supabase, servicios de pedidos, cálculos financieros, Cartera, Caja ni impresión.
