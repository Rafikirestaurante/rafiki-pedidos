export default function NavegacionInterna({ vistaActual = "", navegar, puedeVerGerencia = false }) {
  const opciones = [
    { id: "mesas", label: "Mesas", ruta: "/mesas", vista: "mesas", habilitada: true },
    { id: "pedidos", label: "Pedidos hoy", ruta: "/pedidos", vista: "pedidos", habilitada: true },
    { id: "admin", label: "Admin", ruta: "/admin", vista: "admin", habilitada: true },
    { id: "gerencia", label: "Gerencia", ruta: "/gerencia", vista: "gerencia", habilitada: puedeVerGerencia }
  ];

  return (
    <div className="nav nav-wrap navegacion-interna" aria-label="Navegación principal interna">
      {opciones.map((opcion) => {
        const activa = vistaActual === opcion.id;
        return (
          <button
            key={opcion.id}
            type="button"
            onClick={() => opcion.habilitada && navegar(opcion.ruta, opcion.vista)}
            disabled={!opcion.habilitada}
            className={activa ? "active" : ""}
            aria-current={activa ? "page" : undefined}
            title={!opcion.habilitada ? "Disponible para el rol Administrador" : undefined}
          >
            {opcion.label}
          </button>
        );
      })}
    </div>
  );
}
