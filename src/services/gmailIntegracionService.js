import { supabase } from "../supabaseClient";

async function describirErrorFuncion(error, respaldo) {
  if (!error) return respaldo;

  try {
    const response = error.context;
    if (response && typeof response.clone === "function") {
      const payload = await response.clone().json();
      if (payload?.error) return String(payload.error);
    }
  } catch {
    // La respuesta puede no ser JSON; usamos el mensaje general.
  }

  return String(error.message || respaldo);
}

async function invocar(nombre, body = {}) {
  const { data, error } = await supabase.functions.invoke(nombre, { body });
  if (error) throw new Error(await describirErrorFuncion(error, `No se pudo ejecutar ${nombre}.`));
  if (data?.error) throw new Error(String(data.error));
  return data || {};
}

export async function obtenerEstadoConexionGmail() {
  return invocar("gmail-connection-status");
}

export async function iniciarConexionGmail() {
  return invocar("gmail-oauth-start");
}

export async function probarConexionGmail() {
  return invocar("gmail-test-connection");
}

export async function desconectarGmail() {
  return invocar("gmail-disconnect");
}
