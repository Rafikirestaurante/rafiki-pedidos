import { leerArchivo } from "./validation-utils.mjs";

const componente = leerArchivo("src/modules/dashboard/components/VentasMensualesDashboard.jsx");
const css = leerArchivo("src/styles/app.css");
const errores = [];

function exigir(condicion, mensaje) {
  if (!condicion) errores.push(mensaje);
}

exigir(componente.includes("CalendarioVentasAmpliado"), "Falta la vista ampliada del calendario.");
exigir(componente.includes("ventas-calendario-ampliar"), "Falta el botón móvil Ampliar.");
exigir(componente.includes("distanciaEntreToques"), "Falta el soporte de gesto de zoom con dos dedos.");
exigir(componente.includes("manejarTouchMove"), "Falta el manejo táctil de zoom/desplazamiento.");
exigir(componente.includes("NavegacionMesCompacta"), "Falta la navegación mensual compacta compartida.");
exigir(componente.includes("ventas-mes-flecha"), "Faltan las flechas compactas de navegación mensual.");
exigir(!componente.includes(">Ajustar<") && !componente.includes("ventas-calendario-ajustar"), "La vista ampliada no debe mostrar el botón Ajustar.");
exigir(!componente.includes("ventas-calendario-zoom-controles"), "La vista ampliada no debe mostrar controles manuales de zoom.");
exigir(componente.includes("onMesAnterior"), "La vista ampliada debe permitir navegar al mes anterior.");
exigir(componente.includes("onMesSiguiente"), "La vista ampliada debe permitir navegar al mes siguiente.");
exigir(css.includes("@media (max-width: 700px)"), "Falta la regla específica de visualización móvil.");
exigir(css.includes(".ventas-calendario-modal.rafiki-ui-modal-card"), "Faltan estilos de la vista ampliada.");
exigir(css.includes("touch-action: none"), "Falta el control táctil necesario para gesto y desplazamiento.");
exigir(css.includes("height: 100dvh"), "La vista móvil no está configurada a pantalla completa.");
exigir(css.includes(".ventas-mes-control") && css.includes("border-radius: 999px"), "Falta el control mensual compacto tipo cápsula.");
exigir(css.includes(".ventas-calendario-ampliar") && css.includes("display: none"), "El botón Ampliar debe permanecer oculto por defecto en escritorio.");

if (errores.length) {
  console.error("Validación Dashboard móvil con zoom FALLÓ:");
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Validación Dashboard móvil con zoom OK: 16 controles aprobados.");
