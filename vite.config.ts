import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import {
  createWebExtensionBuildPlugin,
  getExtensionBuildTarget,
} from "./build/webext-build-plugin";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const extensionBuildTarget = getExtensionBuildTarget();

function getOutDir(): string {
  if (extensionBuildTarget === "firefox") {
    return "dist-firefox";
  }

  return "dist-chromium";
}

export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), createWebExtensionBuildPlugin(extensionBuildTarget)],
  resolve: {
    alias: {
      "@": srcDir,
    },
  },
  build: {
    emptyOutDir: true,
    outDir: getOutDir(),
    rollupOptions: {
      input: new URL("./src/entrypoints/content/index.ts", import.meta.url)
        .pathname,
      output: {
        entryFileNames: "content/index.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.some((name) => name.endsWith(".css"))) {
            return "content/index.css";
          }

          return "assets/[name][extname]";
        },
      },
    },
  },
});
