import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        options: new URL("./options.html", import.meta.url).pathname,
        content: new URL("./src/content/main.ts", import.meta.url).pathname,
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "content" ? "content.js" : "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
