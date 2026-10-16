export default function NavegacionInterna({ vistaActual = "", rutaActual = "", navegar, puedeVerGerencia = false }) {
  const opciones = [
    { id: "mesas", label: "Mesas", ruta: "/mesas", vista: "mesas", habilitada: true },
    { id: "consulta-mesas", label: "🍽️", descripcion: "Consultar mesas", ruta: "/pedidos-hoy/mesas", vista: "pedidos", habilitada: true },
    { id: "pedidos", label: "Pedidos hoy", ruta: "/pedidos", vista: "pedidos", habilitada: true },
    { id: "admin", label: "Admin", ruta: "/admin", vista: "admin", habilitada: true },
    { id: "gerencia", label: "Gerencia", ruta: "/gerencia", vista: "gerencia", habilitada: puedeVerGerencia }
  ];

  return (
    <div className="nav nav-wrap navegacion-interna" aria-label="Navegación principal interna">
      {opciones.map((opcion) => {
        const consultaMesas = rutaActual === "/pedidos-hoy/mesas";
        const activa = opcion.id === "consulta-mesas" ? consultaMesas && vistaActual === "pedidos" : vistaActual === opcion.id && !(opcion.id === "pedidos" && consultaMesas);
        return (
          <button
            key={opcion.id}
            type="button"
            onClick={() => opcion.habilitada && navegar(opcion.ruta, opcion.vista)}
            disabled={!opcion.habilitada}
            className={activa ? "active" : ""}
            aria-current={activa ? "page" : undefined}
            aria-label={opcion.descripcion || opcion.label}
            title={!opcion.habilitada ? "Disponible para el rol Administrador" : opcion.descripcion}
          >
            {opcion.label}
          </button>
        );
      })}
    </div>
  );
}
