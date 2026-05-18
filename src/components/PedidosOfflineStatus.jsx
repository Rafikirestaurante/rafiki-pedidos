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
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const actualizar = () => {
      const nuevoTotal = contarPedidosPendientesOffline();
      setTotal((anterior) => {
        if (nuevoTotal > anterior) {
          setToastVisible(true);
          window.setTimeout(() => setToastVisible(false), 4200);
        }
        return nuevoTotal;
      });
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

  const pendientes = leerPedidosPendientesOffline().filter((registro) => registro.estado !== 'enviado');
  const errores = pendientes.filter((registro) => registro.estado === 'error').length;
  const enviando = pendientes.filter((registro) => registro.estado === 'enviando').length;

  const reenviar = () => {
    window.dispatchEvent(new CustomEvent('rafiki:reenviar-pedidos-offline'));
  };

  return (
    <>
      {toastVisible && !abierto && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: 14,
            bottom: 138,
            zIndex: 10002,
            maxWidth: 260,
            background: '#78350f',
            color: 'white',
            borderRadius: 16,
            padding: '10px 12px',
            boxShadow: '0 12px 28px rgba(0,0,0,.24)',
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            fontWeight: 800
          }}
        >
          📦 Pedido guardado offline. Se reenviará al volver internet.
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        title="Pedidos offline pendientes"
        style={{
          position: 'fixed',
          right: 14,
          bottom: 82,
          zIndex: 10002,
          border: 'none',
          borderRadius: 999,
          padding: '10px 13px',
          background: errores > 0 ? '#991b1b' : online ? '#78350f' : '#7f1d1d',
          color: 'white',
          boxShadow: '0 12px 28px rgba(0,0,0,.26)',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 900,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 7
        }}
      >
        <span aria-hidden="true">🟠</span>
        <span>{total} pendiente{total === 1 ? '' : 's'}</span>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Pedidos pendientes offline"
          style={{
            position: 'fixed',
            right: 14,
            bottom: 132,
            zIndex: 10003,
            width: 'min(360px, calc(100vw - 28px))',
            maxHeight: '58vh',
            overflow: 'auto',
            background: 'white',
            color: '#1f2937',
            borderRadius: 18,
            padding: 14,
            boxShadow: '0 20px 46px rgba(0,0,0,.30)',
            fontFamily: 'Arial, sans-serif',
            border: '1px solid #fed7aa'
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 15 }}>Pedidos pendientes</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {online ? 'Con conexión disponible.' : 'Sin conexión. Se reenviarán después.'}
                {enviando > 0 ? ` Enviando: ${enviando}.` : ''}
                {errores > 0 ? ` Errores: ${errores}.` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              style={{ border: 'none', background: '#f3f4f6', borderRadius: 999, padding: '7px 10px', fontWeight: 900 }}
            >
              ×
            </button>
          </div>

          <button
            type="button"
            onClick={reenviar}
            disabled={!online || enviando > 0}
            style={{
              width: '100%',
              border: 'none',
              background: online && enviando === 0 ? '#f97316' : '#9ca3af',
              color: 'white',
              borderRadius: 12,
              padding: '10px 12px',
              fontWeight: 900,
              marginBottom: 10
            }}
          >
            {enviando > 0 ? 'Enviando...' : 'Reenviar pendientes'}
          </button>

          {pendientes.slice(0, 8).map((registro) => (
            <div key={registro.id_temporal} style={{ borderTop: '1px solid #f3f4f6', padding: '9px 0', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong>{registro.pedido?.mesa || registro.pedido?.cliente || 'Pedido'}</strong>
                <span style={{ color: registro.estado === 'error' ? '#b91c1c' : '#92400e', fontWeight: 900 }}>
                  {registro.estado || 'pendiente'}
                </span>
              </div>
              <div style={{ color: '#4b5563' }}>
                {Number(registro.pedido?.total || 0).toLocaleString('es-CO')} · intentos: {registro.intentos || 0}
              </div>
              {registro.ultimo_error && <div style={{ color: '#b91c1c', marginTop: 3 }}>Último error: {registro.ultimo_error}</div>}
              {Array.isArray(registro.historial_reintentos) && registro.historial_reintentos.length > 0 && (
                <details style={{ marginTop: 5, color: '#6b7280' }}>
                  <summary>Historial</summary>
                  {registro.historial_reintentos.slice(-4).map((evento, index) => (
                    <div key={`${registro.id_temporal}-${evento.fecha}-${index}`} style={{ marginTop: 3 }}>
                      {new Date(evento.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · {evento.mensaje}
                    </div>
                  ))}
                </details>
              )}
            </div>
          ))}
          {pendientes.length > 8 && <div style={{ paddingTop: 8, fontSize: 12, color: '#6b7280' }}>Y {pendientes.length - 8} más...</div>}
        </div>
      )}
    </>
  );
}
