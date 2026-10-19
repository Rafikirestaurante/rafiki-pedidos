// El catálogo conserva IDs por tamaño para validar precios en el servidor.
// El cliente ve cada sabor una sola vez y elige su tamaño en el siguiente paso.
export function agruparMenuKiara(catalogo) {
  const grupos = new Map();
  for (const p of catalogo) {
    const esBebida = ["Batido cremoso", "Batido refrescante", "Jugo tradicional"].includes(p.tipo);
    const id = esBebida ? p.id.split(":")[0] : p.id;
    if (!grupos.has(id))
      grupos.set(id, {
        ...p,
        id,
        nombre: esBebida ? p.producto.replace(/\s+\d+\s*oz\s*$/i, "") : p.nombre,
        variantes: []
      });
    const grupo = grupos.get(id);
    grupo.variantes.push(p);
    grupo.precio = Math.min(grupo.precio, p.precio);
  }
  return [...grupos.values()];
}
