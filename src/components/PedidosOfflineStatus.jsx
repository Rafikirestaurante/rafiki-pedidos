import React, { useEffect, useState } from 'react';
import {
  contarPedidosPendientesOffline,
  leerPedidosPendientesOffline,
  suscribirCambiosPedidosOffline
} from '../utils/offlinePedidos.js';
import { esRutaInternaPWA } from '../utils/pwa.js';

export default function PedidosOfflineStatus() {
  const [total, setTotal] = useState(() => contarPedidosPendientesOffline());
  const [online, setOnline] = useState(() => navigator.onLine);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const actualizar = () => {
      setTotal(contarPedidosPendientesOffline());
      setOnline(navigator.onLine);
    };

    const cancelar = suscribirCambiosPedidosOffline(actualizar);
    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
    actualizar();

    return () => {
      cancelar();
      window.removeEventListener('online', actualizar);
      window.removeEventListener('offline', actualizar);
    };
  }, []);

  if (!esRutaInternaPWA() || total <= 0) return null;

  const pendientes = leerPedidosPendientesOffline();

  const reenviar = () => {
    window.dispatchEvent(new CustomEvent('rafiki:reenviar-pedidos-offline'));
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 14,
        right: 14,
        bottom: 82,
        zIndex: 10002,
        maxWidth: 580,
        margin: '0 auto',
        background: online ? '#78350f' : '#7f1d1d',
        color: 'white',
        borderRadius: 18,
        padding: 14,
        boxShadow: '0 18px 40px rgba(0,0,0,.30)',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 24 }}>📦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900 }}>{total} pedido{total === 1 ? '' : 's'} pendiente{total === 1 ? '' : 's'} por enviar</div>
          <div style={{ fontSize: 13, opacity: 0.92 }}>
            {online ? 'Ya hay conexión. Puedes reenviarlos ahora.' : 'Se enviarán cuando vuelva internet.'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          style={{ border: '1px solid rgba(255,255,255,.45)', background: 'transparent', color: 'white', borderRadius: 999, padding: '8px 10px', fontWeight: 900 }}
        >
          Ver
        </button>
        <button
          type="button"
          onClick={reenviar}
          disabled={!online}
          style={{ border: 'none', background: online ? '#f97316' : '#9ca3af', color: 'white', borderRadius: 999, padding: '9px 12px', fontWeight: 900 }}
        >
          Reenviar
        </button>
      </div>

      {abierto && (
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,.12)', borderRadius: 14, padding: 10, maxHeight: 210, overflow: 'auto' }}>
          {pendientes.slice(0, 6).map((registro) => (
            <div key={registro.id_temporal} style={{ borderBottom: '1px solid rgba(255,255,255,.20)', padding: '8px 0', fontSize: 13 }}>
              <strong>{registro.pedido?.mesa || registro.pedido?.cliente || 'Pedido'}</strong> · {Number(registro.pedido?.total || 0).toLocaleString('es-CO')} · intentos: {registro.intentos || 0}
              {registro.ultimo_error && <div style={{ opacity: 0.86 }}>Último error: {registro.ultimo_error}</div>}
            </div>
          ))}
          {pendientes.length > 6 && <div style={{ paddingTop: 8, fontSize: 12 }}>Y {pendientes.length - 6} más...</div>}
        </div>
      )}
    </div>
  );
}
