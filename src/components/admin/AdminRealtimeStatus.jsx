import React from "react";

function AdminRealtimeStatusBase({ estadoRealtimePedidos }) {
  if (!estadoRealtimePedidos) return null;

  return (
    <div className={`realtime-status realtime-${estadoRealtimePedidos.estado || "inactivo"}`}>
      <strong>{estadoRealtimePedidos.texto || "Realtime"}</strong>
      <span>{estadoRealtimePedidos.detalle || "Estado de conexión en vivo."}</span>
    </div>
  );
}

export default React.memo(AdminRealtimeStatusBase);
