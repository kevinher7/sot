import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

function organizeExtensionOutput(): Plugin {
  return {
    name: "organize-extension-output",
    apply: "build",
    async closeBundle() {
      const distDir = join(process.cwd(), "dist");
      const generatedOptionsHtml = join(
        distDir,
        "src/entrypoints/options/index.html",
      );
      const finalOptionsHtml = join(distDir, "options/index.html");
      const candidateCssFiles = [
        join(distDir, "assets/index.css"),
        join(distDir, "assets/index2.css"),
      ];
      const finalContentCss = join(distDir, "content/index.css");

      await mkdir(dirname(finalOptionsHtml), { recursive: true });
      await rename(generatedOptionsHtml, finalOptionsHtml);
      const updatedOptionsHtml = (await readFile(finalOptionsHtml, "utf8"))
        .replaceAll("../../../options/index.js", "./index.js")
        .replaceAll("../../../assets/", "../assets/");
      await writeFile(finalOptionsHtml, updatedOptionsHtml);

      for (const candidatePath of candidateCssFiles) {
        const css = await readFile(candidatePath, "utf8").catch(() => "");
        if (!css.includes("#kot-extension-root")) {
          continue;
        }

        await mkdir(dirname(finalContentCss), { recursive: true });
        await rename(candidatePath, finalContentCss);
        break;
      }

      await rm(join(distDir, "src"), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), organizeExtensionOutput()],
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        "options/index": new URL(
          "./src/entrypoints/options/index.html",
          import.meta.url,
        ).pathname,
        "content/index": new URL(
          "./src/entrypoints/content/index.ts",
          import.meta.url,
        ).pathname,
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.names?.[0] ?? assetInfo.name ?? "";

          if (assetName === "content.css") {
            return "content/index.css";
          }

          return "assets/[name][extname]";
        },
      },
    },
  },
});
