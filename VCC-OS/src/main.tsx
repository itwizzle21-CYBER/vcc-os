import ReactDOM from "react-dom/client";
import App from "../App";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("VCC_OS offline service worker active:", registration.scope);
      })
      .catch((error) => {
        console.error("VCC_OS offline service worker failed:", error);
      });
  });
}
