# Fase 37B.1 — Zoom por gestos y navegación compacta

Versión: `127.12-FASE37B1-ZOOM-GESTOS-NAVEGACION-COMPACTA-2026-07-30`

## Cambios

- Se retiraron de la vista ampliada los botones `−`, `+` y **Ajustar**.
- El zoom queda exclusivamente mediante gesto de dos dedos.
- El desplazamiento del calendario continúa funcionando con un dedo.
- La navegación mensual del Dashboard se convirtió en un control compacto tipo cápsula.
- Las flechas quedan integradas a ambos lados del nombre del mes.
- El mismo control compacto se usa dentro de la vista ampliada.
- El botón **Hoy** solo aparece cuando se consulta un mes diferente al actual.
- No se modificaron datos, cálculos, Supabase, pedidos, Caja, Cartera o impresión.

## Archivos funcionales

- `src/modules/dashboard/components/VentasMensualesDashboard.jsx`
- `src/styles/app.css`
