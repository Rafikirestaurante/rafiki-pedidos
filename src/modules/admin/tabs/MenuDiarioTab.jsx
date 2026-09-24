import { useMemo, useState } from "react";
import { CampoTexto } from "../../../shared/components/common";
import RafikiModal from "../../../shared/components/RafikiModal";
import { textoAPlatosDetalle, fechaISOColombia } from "../../../shared/utils/pedidos";
import { clavePlato, guardarCantidadMenu, estadoDisponibilidad } from "../../../services/disponibilidadMenuService";
import { useDisponibilidadMenu } from "../../../shared/hooks/useDisponibilidadMenu";

export default function MenuDiarioTab({
  menu,
  setMenu,
  platosTexto,
  setPlatosTexto,
  acompanantesTexto,
  setAcompanantesTexto,
  traerTextoDesdeGeneradorMenu,
  imprimirMenuDiarioTicket,
  guardarMenu,
  guardandoMenu,
  mensajeMenu,
}) {
  const [platosSaAutomatico, setPlatosSaAutomatico] = useState([]);
  const [cantidadesEditadas, setCantidadesEditadas] = useState({});
  const [mensajeCantidad, setMensajeCantidad] = useState("");
  const platosControl = useMemo(() => textoAPlatosDetalle(platosTexto).platos || [], [platosTexto]);
  const fechaControl = menu.fecha || fechaISOColombia();
  const { limites, ventas, error: errorControl, recargar } = useDisponibilidadMenu(fechaControl, platosControl);

  async function guardarCantidad(plato) {
    const clave = clavePlato(plato.nombre);
    if (!Object.prototype.hasOwnProperty.call(cantidadesEditadas, clave)) return;
    try {
      await guardarCantidadMenu(fechaControl, plato.nombre, cantidadesEditadas[clave], limites[clave]?.agotado || false);
      setCantidadesEditadas((actual) => { const siguiente = { ...actual }; delete siguiente[clave]; return siguiente; });
      setMensajeCantidad("Cantidad guardada para todos los dispositivos.");
      await recargar();
    } catch (fallo) { setMensajeCantidad(fallo?.message || "No se pudo guardar la cantidad."); }
  }

  function manejarTraerDesdeGenerador() {
    const resultado = traerTextoDesdeGeneradorMenu?.();
    const platosConSa = Array.isArray(resultado?.platosConSa) ? resultado.platosConSa : [];
    setPlatosSaAutomatico(platosConSa);
  }

  return (
    <section className="card card-pad">
      <h2>✏️ Editar menú diario</h2>
      <p className="muted">
        Aquí modificas los platos, precios, categorías y acompañantes disponibles para los clientes.
      </p>

      <div className="box soft" style={{ marginBottom: 14 }}>
        <strong>Traer desde Generador de menú</strong>
        <p className="muted small" style={{ margin: "4px 0 10px" }}>
          Carga automáticamente el texto de platos del día y acompañantes generado en la sección Generador. Arroces y Pastas reciben SA automáticamente y Rafiki te mostrará cuáles fueron marcados.
        </p>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <button
            type="button"
            className="button"
            onClick={manejarTraerDesdeGenerador}
            style={{ width: "100%", fontWeight: 900 }}
          >
            📥 Traer platos y acompañantes del generador
          </button>
          <button
            type="button"
            className="button light"
            onClick={imprimirMenuDiarioTicket}
            style={{ width: "100%", padding: "8px 10px", fontSize: 13 }}
          >
            🧾 Imprimir menú del día
          </button>
        </div>
      </div>

      <CampoTexto
        etiqueta="Fecha"
        value={menu.fecha || ""}
        onChange={(valor) => setMenu((actual) => ({ ...actual, fecha: valor }))}
      />

      <CampoTexto
        etiqueta="Nombre del menú"
        value={menu.titulo || ""}
        onChange={(valor) => setMenu((actual) => ({ ...actual, titulo: valor }))}
      />

      <CampoTexto
        etiqueta="Descripción"
        value={menu.descripcion || ""}
        onChange={(valor) => setMenu((actual) => ({ ...actual, descripcion: valor }))}
        multiline
        rows={3}
      />

      <CampoTexto
        etiqueta="Platos del día"
        value={platosTexto}
        onChange={setPlatosTexto}
        placeholder={
          "Pechuga | Pechuga asada sin salsa:17500\nPechuga | Pechuga en salsa criolla:18500\nCerdo | Cerdo asado sin salsa:17000\nSopas | Sopas medianas sin arroz:7000\nSopas | Sopas medianas con arroz:9000\nSopas | Sancocho de pollo con arroz:15000\nCarnes | Carne guisada:19000"
        }
        multiline
        rows={9}
      />

      <CampoTexto
        etiqueta="Acompañantes del día"
        value={acompanantesTexto}
        onChange={setAcompanantesTexto}
        placeholder={"Arroz con coco\nEnsalada verde\nPuré de papa\nTajadas maduras\nYuca cocida"}
        multiline
        rows={7}
      />

      <div className="box soft control-cantidades-menu">
        <strong>Control de cantidades disponibles</strong>
        <p className="muted small">Deja la casilla vacía para vender sin límite ni alertas. Las cantidades se guardan al salir de cada casilla.</p>
        {errorControl && <p role="alert" className="alert alert-warning">No se pudo consultar el control: {errorControl}</p>}
        {mensajeCantidad && <p role="status" className="muted small">{mensajeCantidad}</p>}
        <div className="control-cantidades-desborde">
          <table className="control-cantidades-tabla"><thead><tr><th>Plato</th><th>Cantidad estimada</th><th>Cantidad vendida</th></tr></thead><tbody>
            {platosControl.map((plato) => {
              const clave = clavePlato(plato.nombre);
              const limite = limites[clave];
              const vendido = ventas[plato.nombre] || 0;
              const estado = estadoDisponibilidad(limite, vendido);
              return <tr key={clave}><td>{plato.nombre}</td><td><input aria-label={`Cantidad estimada de ${plato.nombre}`} type="number" inputMode="numeric" min="0" step="1" placeholder="Sin límite" value={cantidadesEditadas[clave] ?? limite?.cantidad_estimada ?? ""} onChange={(e) => setCantidadesEditadas((actual) => ({ ...actual, [clave]: e.target.value }))} onBlur={() => guardarCantidad(plato)} /></td><td><span className={estado ? `control-cantidad-punto ${estado}` : ""} />{vendido}</td></tr>;
            })}
          </tbody></table>
        </div>
      </div>

      <div className="box soft small">
        <strong>Platos:</strong> escribe un plato por línea con este formato:
        <br />
        Categoría | Nombre del plato:Precio
        <br />
        <br />
        <strong>Ejemplo:</strong> Pechuga | Pechuga en salsa criolla:18500
        <br />
        <br />
        <strong>Sin acompañantes (SA):</strong> agrega SA al final de la categoría.
        <br />
        Ejemplo: Platos SA | Arroz con pollo:18000
        <br />
        SA es una regla interna y no aparecerá en el nombre visible del plato.
        <br />
        <br />
        <strong>Sopas:</strong> los platos con categoría Sopas no permiten acompañantes ni incluyen sopa + bebida.
        <br />
        <br />
        <strong>Para llevar:</strong> las sopas configuradas como “Sopas medianas sin arroz”, “Sopas medianas con arroz” y “Sancocho de pollo con arroz” tienen empaque sin costo adicional.
      </div>

      <button
        type="button"
        onClick={guardarMenu}
        disabled={guardandoMenu}
        className="button"
        style={{ width: "100%", marginTop: 14 }}
      >
        {guardandoMenu ? "Guardando menú..." : "Guardar menú del día"}
      </button>



      <RafikiModal
        open={platosSaAutomatico.length > 0}
        title="SA aplicado automáticamente"
        description="Al traer el menú desde el Generador, Rafiki marcó estos Arroces y Pastas como Sin Acompañantes (SA)."
        onClose={() => setPlatosSaAutomatico([])}
        footer={(
          <button type="button" className="button" onClick={() => setPlatosSaAutomatico([])}>
            Entendido
          </button>
        )}
      >
        <div className="box soft" style={{ display: "grid", gap: 8 }}>
          {platosSaAutomatico.map((plato, index) => (
            <div key={`${plato.tipo}-${plato.nombre}-${index}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <strong>{plato.tipo === "Pasta" ? "🍝" : "🍚"} {plato.nombre}</strong>
              <span className="badge">SA</span>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ margin: "12px 0 0" }}>
          SA es una regla interna: evita que estos platos soliciten acompañantes y no se muestra al cliente ni en las impresiones.
        </p>
      </RafikiModal>

      {mensajeMenu.texto && (
        <div
          id="confirmacion-menu-diario"
          className={`alert alert-${mensajeMenu.tipo} menu-action-message`}
          role="alert"
        >
          {mensajeMenu.texto}
        </div>
      )}
    </section>
  );
}
