import fs from "node:fs";
import path from "node:path";
import { obtenerVersionBuild, versionRafikiEsAlMenos } from "./validation-utils.mjs";

const root = process.cwd();
let errores = 0;

function leer(ruta) {
  return fs.readFileSync(path.join(root, ruta), "utf8");
}

function ok(condicion, mensaje) {
  if (condicion) {
    console.log(`✓ ${mensaje}`);
    return;
  }
  errores += 1;
  console.error(`✗ ${mensaje}`);
}

function contiene(ruta, fragmento, mensaje) {
  ok(leer(ruta).includes(fragmento), mensaje);
}

console.log("Validando registro público de clientes y cumpleaños...");

const componente = "src/modules/cliente/components/CodigoClienteEspecial.jsx";
const servicio = "src/services/clientesEspecialesService.js";
const migracion = "supabase/2026-07-21-fase37a-registro-clientes-cumpleanos.sql";
const estilos = "src/styles/app.css";
const catalogo = "src/modules/catalogo/components/ClientesEspecialesCatalogo.jsx";

contiene(componente, "Registrarme", "existe la acción discreta para registrarse");
contiene(componente, "Celular o código", "el acceso acepta celular o código");
contiene(componente, "Solo guardaremos el día y el mes, no el año.", "el cumpleaños no solicita año");
contiene(componente, "Autorizo guardar estos datos", "el registro solicita autorización de datos");
contiene(componente, "registrarClientePublico", "el formulario usa el servicio público controlado");

contiene(servicio, 'supabase.rpc("registrar_cliente_publico"', "el servicio usa la RPC de registro");
contiene(servicio, "cumple_mes", "el servicio maneja mes de cumpleaños");
contiene(servicio, "cumple_dia", "el servicio maneja día de cumpleaños");
contiene(servicio, "esCelularColombianoValido", "el celular se valida antes de registrar");

ok(fs.existsSync(path.join(root, migracion)), "existe la migración de Supabase de Fase 37A");
contiene(migracion, "add column if not exists cumple_mes", "la migración agrega el mes de cumpleaños");
contiene(migracion, "add column if not exists cumple_dia", "la migración agrega el día de cumpleaños");
contiene(migracion, "registrar_cliente_publico", "la migración crea la RPC pública controlada");
contiene(migracion, "sin_restriccion_acompanantes,", "la RPC define explícitamente las reglas del registro");
contiene(migracion, "false,\n    false,\n    true,", "el registro público no recibe privilegios VIP automáticos");

contiene(estilos, ".cliente-especial-box.cliente-especial-box-discreta", "existe el estilo compacto del acceso por código");
contiene(estilos, "box-shadow: none;", "el bloque discreto elimina la sombra destacada");
contiene(catalogo, "Mes de cumpleaños", "Gerencia puede editar el mes de cumpleaños");
contiene(catalogo, "Registro web", "Gerencia identifica registros realizados por clientes");

const version = obtenerVersionBuild();
ok(versionRafikiEsAlMenos(version, "127.8"), "la versión es 127.8 o posterior");

if (errores > 0) {
  console.error(`\nValidación de registro de clientes FALLÓ: ${errores} problema(s).`);
  process.exit(1);
}

console.log("\nValidación de registro de clientes OK.");
