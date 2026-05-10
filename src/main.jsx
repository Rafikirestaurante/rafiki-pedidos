import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import InstallPWA from "./components/InstallPWA.jsx";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}


createRoot(document.getElementById("root")).render(
  <>
    <App />
    <InstallPWA />
  </>
);

