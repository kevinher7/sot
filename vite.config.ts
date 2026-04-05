import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: new URL("./src/entrypoints/content/index.ts", import.meta.url)
        .pathname,
      output: {
        entryFileNames: "content/index.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.names?.[0] ?? assetInfo.name ?? "";

          if (assetName.endsWith(".css")) {
            return "content/index.css";
          }

          return "assets/[name][extname]";
        },
      },
    },
  },
});
