import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { loadAppData } from "@/lib/storage/localStore";
import { applyVisualSettings } from "@/lib/theme/themePreference";
import "@/index.css";

const initialData = loadAppData();
applyVisualSettings(initialData.settings);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App initialData={initialData} />
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD && /^\/vitascan(?:\/|$)/.test(window.location.pathname)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/vitascan-sw.js", { scope: "/vitascan" }));
}
