import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App_dividido.jsx";
import InstallPWA from "./components/InstallPWA.jsx";
import { registerServiceWorker } from "./registerSW.js";

createRoot(document.getElementById("root")).render(
  <>
    <App />
    <InstallPWA />
  </>
);

registerServiceWorker();
