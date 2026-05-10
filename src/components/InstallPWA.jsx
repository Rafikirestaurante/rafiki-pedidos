import React, { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [isAdminPage, setIsAdminPage] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(Boolean(standalone));
    setIsAdminPage(window.location.pathname.startsWith('/admin'));

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  const installApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    if (isIOS) {
      setShowIOSHelp(true);
    }
  };

  // La instalación solo se ofrece desde el panel administrativo.
  // Al instalarla, la app abrirá directamente en /admin por el start_url del manifest.
  if (!isAdminPage) return null;
  if (isStandalone) return null;
  if (!installPrompt && !isIOS) return null;

  return (
    <>
      <button
        onClick={installApp}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 9999,
          border: 'none',
          borderRadius: 999,
          padding: '12px 16px',
          background: '#f97316',
          color: 'white',
          fontWeight: 800,
          boxShadow: '0 10px 25px rgba(0,0,0,.22)',
          cursor: 'pointer'
        }}
      >
        Instalar panel
      </button>

      {showIOSHelp && (
        <div
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 78,
            zIndex: 9999,
            background: 'white',
            borderRadius: 18,
            padding: 16,
            boxShadow: '0 12px 30px rgba(0,0,0,.25)',
            border: '1px solid #fed7aa'
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Instalar panel en iPhone</div>
          <div style={{ fontSize: 14, lineHeight: 1.4 }}>
            Toca el botón compartir de Safari y luego selecciona “Agregar a pantalla de inicio”.
          </div>
          <button
            onClick={() => setShowIOSHelp(false)}
            style={{ marginTop: 10, border: 'none', background: '#111827', color: 'white', borderRadius: 10, padding: '8px 12px' }}
          >
            Entendido
          </button>
        </div>
      )}
    </>
  );
}
