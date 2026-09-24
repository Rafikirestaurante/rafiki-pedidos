import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { consultarDisponibilidadMenu } from "../../services/disponibilidadMenuService";

export function useDisponibilidadMenu(fecha, platos = [], activo = true) {
  const [datos, setDatos] = useState({ limites: {}, ventas: {} });
  const [error, setError] = useState("");
  const nombres = platos.map((item) => item.nombre).join("\u0000");
  const recargar = useCallback(async () => {
    if (!activo || !fecha) return null;
    try {
      const resultado = await consultarDisponibilidadMenu(fecha, platos);
      setDatos(resultado);
      setError("");
      return resultado;
    } catch (fallo) {
      setError(fallo?.message || "No fue posible consultar las cantidades.");
      return null;
    }
  }, [fecha, nombres, activo]);

  useEffect(() => {
    if (!activo || !fecha) return undefined;
    recargar();
    const canal = supabase.channel(`disponibilidad-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, recargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_cantidades_diarias" }, recargar)
      .subscribe();
    const intervalo = window.setInterval(recargar, 20000);
    const alVolver = () => { if (!document.hidden) recargar(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => { window.clearInterval(intervalo); document.removeEventListener("visibilitychange", alVolver); supabase.removeChannel(canal); };
  }, [fecha, recargar, activo]);
  return { ...datos, error, recargar };
}
