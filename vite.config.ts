import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

async function moveHtmlEntry(entryName: string): Promise<void> {
  const distDir = join(process.cwd(), "dist");
  const generatedHtml = join(
    distDir,
    `src/entrypoints/${entryName}/index.html`,
  );
  const finalHtml = join(distDir, `${entryName}/index.html`);
  const generatedContent = await readFile(generatedHtml, "utf8").catch(
    () => undefined,
  );

  if (!generatedContent) {
    return;
  }

  await mkdir(dirname(finalHtml), { recursive: true });
  await rename(generatedHtml, finalHtml);

  const updatedHtml = generatedContent
    .replaceAll(`../../../${entryName}/index.js`, "./index.js")
    .replaceAll("../../../assets/", "../assets/");

  await writeFile(finalHtml, updatedHtml);
}

function organizeExtensionOutput(): Plugin {
  return {
    name: "organize-extension-output",
    apply: "build",
    async closeBundle() {
      const distDir = join(process.cwd(), "dist");
      const candidateCssFiles = [
        join(distDir, "assets/index.css"),
        join(distDir, "assets/index2.css"),
        join(distDir, "assets/index3.css"),
      ];
      const finalContentCss = join(distDir, "content/index.css");

      await moveHtmlEntry("options");

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
