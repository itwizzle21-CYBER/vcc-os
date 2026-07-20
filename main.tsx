import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { loadAppData } from "@/lib/storage/localStore";
import { applyVisualSettings } from "@/lib/theme/themePreference";
import "@/index.css";

applyVisualSettings(loadAppData().settings);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/vitascan-sw.js", { scope: "/vitascan" }));
}
