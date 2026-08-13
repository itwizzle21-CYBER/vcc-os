import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

const srcPath = new URL("./src", import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, "");
const englishReceiptModel = new URL(
  "./node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz",
  import.meta.url,
);

function receiptLanguageModelPlugin(): Plugin {
  const modelRoute = "/tessdata/eng.traineddata.gz";
  let model: Buffer | undefined;
  const loadModel = () => model ??= readFileSync(englishReceiptModel);

  return {
    name: "vcc-receipt-language-model",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?", 1)[0] !== modelRoute) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/gzip");
        response.setHeader("Content-Length", String(loadModel().byteLength));
        response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        response.end(loadModel());
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: modelRoute.slice(1),
        source: loadModel(),
      });
    },
  };
}

export default defineConfig({
  plugins: [receiptLanguageModelPlugin()],
  resolve: {
    alias: {
      "@": srcPath,
    },
  },
});
