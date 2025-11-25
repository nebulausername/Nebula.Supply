import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Register Service Worker (only in production)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('./lib/utils/serviceWorker').then(({ getServiceWorkerManager }) => {
    getServiceWorkerManager({
      enabled: true,
      onUpdateAvailable: () => {
        // Show update notification
        if (confirm('Eine neue Version ist verfügbar. Seite neu laden?')) {
          window.location.reload();
        }
      }
    }).register();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
