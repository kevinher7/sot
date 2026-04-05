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

function createInlineExportObject(chunkSource: string): string | null {
  const exportMatch = chunkSource.match(/export\{([^}]+)\};?\s*$/u);

  if (!exportMatch) {
    return null;
  }

  const exportEntries = exportMatch[1]
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const aliasMatch = entry.match(/^(.+?)\s+as\s+(.+)$/u);

      if (!aliasMatch) {
        return `${entry}: ${entry}`;
      }

      return `${aliasMatch[2]}: ${aliasMatch[1]}`;
    });

  const body = chunkSource.slice(0, exportMatch.index).trimEnd();

  return `(() => {\n${body}\nreturn { ${exportEntries.join(", ")} };\n})()`;
}

async function inlineContentSharedImports(): Promise<void> {
  const distDir = join(process.cwd(), "dist");
  const contentEntryPath = join(distDir, "content/index.js");
  const contentSource = await readFile(contentEntryPath, "utf8").catch(
    () => undefined,
  );

  if (!contentSource) {
    return;
  }

  const importMatch = contentSource.match(
    /^import\{([^}]+)\}from"(\.\.\/assets\/[^"]+\.js)";/u,
  );

  if (!importMatch) {
    return;
  }

  const importSpecifiers = importMatch[1]
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const aliasMatch = entry.match(/^(.+?)\s+as\s+(.+)$/u);

      if (!aliasMatch) {
        return entry;
      }

      return `${aliasMatch[1]}: ${aliasMatch[2]}`;
    });
  const importPath = join(dirname(contentEntryPath), importMatch[2]);
  const importedChunk = await readFile(importPath, "utf8").catch(
    () => undefined,
  );

  if (!importedChunk) {
    return;
  }

  const inlineObject = createInlineExportObject(importedChunk);

  if (!inlineObject) {
    return;
  }

  const inlinedContent = contentSource.replace(
    importMatch[0],
    `const { ${importSpecifiers.join(", ")} } = ${inlineObject};`,
  );

  await writeFile(contentEntryPath, inlinedContent);
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
      await inlineContentSharedImports();
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
