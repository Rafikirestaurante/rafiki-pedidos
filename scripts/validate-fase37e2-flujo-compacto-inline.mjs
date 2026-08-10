import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const compacto = read("src/modules/mesas/components/PanelMesasCompacto.jsx");
const css = read("src/styles/app.css");
const build = read("src/config/rafikiBuild.js");
const versionDetectada = Number(build.match(/version:\s*"127\.(\d+)-/)?.[1] || 0);

const checks = [
  ["El Paso 3 sigue identificado como Datos y envío", compacto.includes('{ id: "datos", numero: 3, titulo: "Datos y envío" }')],
  ["DatosMesa se renderiza debajo del resumen", compacto.includes('id="mesa-resumen-compacto"') && compacto.includes('className="mesas-compacta-datos-inline"')],
  ["Datos y envío ya no se renderiza dentro del modal", !compacto.includes('paso === "datos" && (')],
  ["El modal solo abre para proteína o acompañantes", compacto.includes('open={paso === "proteina" || paso === "acompanantes"}')],
  ["El progreso modal muestra únicamente los pasos 1 y 2", compacto.includes('PASOS.filter((pasoItem) => pasoItem.id !== "datos")')],
  ["Continuar del Paso 1 usa el botón verde", compacto.includes('className="button green" onClick={continuarProteina}>Continuar</button>')],
  ["Paso 2 ofrece Agregar otro almuerzo", compacto.includes('onClick={agregarOtroAlmuerzoDesdeAcompanantes}>Agregar otro almuerzo</button>')],
  ["Continuar del Paso 2 usa el botón verde", compacto.includes('className="button green" onClick={continuarAcompanantes}>Continuar</button>')],
  ["Agregar otro almuerzo valida acompañantes antes de crear", compacto.includes('function agregarOtroAlmuerzoDesdeAcompanantes()') && compacto.includes('if (!validarAcompanantesActuales()) return;')],
  ["Continuar del Paso 2 muestra el resumen y los datos", compacto.includes('function mostrarResumenYDatos()') && compacto.includes('desplazarA("mesa-resumen-compacto")')],
  ["El acceso al Paso 3 desplaza al formulario integrado", compacto.includes('function irADatos()') && compacto.includes('desplazarA("mesa-datos-final")')],
  ["El resumen conserva la opción de agregar otro almuerzo", compacto.includes('onClick={iniciarAlmuerzo}>+ Otro almuerzo</button>')],
  ["Se retiraron los botones redundantes Editar datos y Revisar y enviar", !compacto.includes('>Editar datos</button>') && !compacto.includes('>Revisar y enviar</button>')],
  ["El formulario integrado desactiva el sticky interno", css.includes('.mesas-compacta-datos-inline .sticky-total') && css.includes('position: static;')],
  ["La versión conserva la Fase 37E.2 o una posterior", versionDetectada >= 17],
];

let ok = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (pass) ok += 1;
}

console.log(`\n${ok}/${checks.length} controles Fase 37E.2 aprobados.`);
if (ok !== checks.length) process.exit(1);
