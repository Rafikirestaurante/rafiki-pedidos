import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import InstallPWA from "./components/InstallPWA.jsx";

// Fase 8 FIX: limpiar service workers/caché antiguos que pueden dejar la pantalla en blanco.
if (typeof window !== "undefined") {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    }).catch(() => {});
  }

  if ("caches" in window) {
    caches.keys?.().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    }).catch(() => {});
  }
}

createRoot(document.getElementById("root")).render(
  <>
    <App />
    <InstallPWA />
  </>
);
