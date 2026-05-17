import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import InstallPWA from "./components/InstallPWA.jsx";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt.jsx";
import { registerServiceWorker } from "./registerSW.js";

registerServiceWorker();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", padding: 24, background: "#fff7ed", fontFamily: "Arial, sans-serif" }}>
          <div style={{ maxWidth: 760, margin: "40px auto", background: "white", border: "1px solid #fecaca", borderRadius: 18, padding: 24 }}>
            <h1 style={{ marginTop: 0, color: "#991b1b" }}>Rafiki Pedidos no pudo iniciar</h1>
            <p>La aplicación ya no queda en blanco. Este es el error real:</p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#fef2f2", padding: 16, borderRadius: 12, color: "#7f1d1d" }}>
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <p style={{ color: "#57534e" }}>
              Revisa que Vercel tenga VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Production y luego haz Redeploy sin caché.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
    <InstallPWA />
    <PWAUpdatePrompt />
  </ErrorBoundary>
);
