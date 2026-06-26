import React from "react";
import "./styles/pwaMobile.css";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import InstallPWA from "./shared/components/InstallPWA.jsx";
import PWAUpdatePrompt from "./shared/components/PWAUpdatePrompt.jsx";
import PWAOfflineNotice from "./shared/components/PWAOfflineNotice.jsx";
import PWAOldVersionGuard from "./shared/components/PWAOldVersionGuard.jsx";
import PedidosOfflineStatus from "./modules/pedidos/components/PedidosOfflineStatus.jsx";
import { registerServiceWorker } from "./registerSW.js";
import { activarRecuperacionPWA } from "./shared/utils/pwaRecovery.js";
import ErrorBoundary from "./shared/components/ErrorBoundary.jsx";

activarRecuperacionPWA();
registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <ErrorBoundary nombreModulo="Rafiki Pedidos" usarRecuperacionPWA>
    <App />
    <InstallPWA />
    <PWAUpdatePrompt />
    <PWAOfflineNotice />
    <PWAOldVersionGuard />
    <PedidosOfflineStatus />
  </ErrorBoundary>
);
