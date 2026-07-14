import { defineConfig } from "vite";

const srcPath = new URL("./src", import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, "");

export default defineConfig({
  resolve: {
    alias: {
      "@": srcPath,
    },
  },
});
