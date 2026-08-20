(() => {
  if (!/^\/vitascan(?:\/|$)/.test(window.location.pathname)) return;
  document.title = "VitaScan — VCC Receipt Scanner";
  document.getElementById("application-name")?.setAttribute("content", "VitaScan");
  document.getElementById("apple-app-title")?.setAttribute("content", "VitaScan");
  document.getElementById("app-manifest")?.setAttribute("href", "/vitascan.webmanifest");
  document.getElementById("apple-touch-icon")?.setAttribute("href", "/icons/vitascan-apple-180.png?v=2");
  document.getElementById("app-icon")?.setAttribute("href", "/icons/vitascan-android-192.png?v=2");
})();
