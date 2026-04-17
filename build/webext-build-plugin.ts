import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

type JsonObject = Record<string, unknown>;

type BundleFile = {
  type: "asset" | "chunk";
  code?: string;
};

export const supportedExtensionBuildTargets = [
  "firefox",
  "chromium",
] as const;

export type ExtensionBuildTarget =
  (typeof supportedExtensionBuildTargets)[number];

function isSupportedExtensionBuildTarget(
  value: string,
): value is ExtensionBuildTarget {
  return supportedExtensionBuildTargets.includes(value as ExtensionBuildTarget);
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeJsonObjects(base: JsonObject, overlay: JsonObject): JsonObject {
  const next: JsonObject = { ...base };

  for (const [key, value] of Object.entries(overlay)) {
    const baseValue = base[key];

    if (isPlainObject(baseValue) && isPlainObject(value)) {
      next[key] = mergeJsonObjects(baseValue, value);
      continue;
    }

    next[key] = value;
  }

  return next;
}

async function readJsonObject(path: string): Promise<JsonObject> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));

  if (!isPlainObject(value)) {
    throw new Error(`Expected JSON object in ${path}.`);
  }

  return value;
}

async function loadManifest(
  rootDir: string,
  target: ExtensionBuildTarget,
): Promise<JsonObject> {
  const manifestDir = resolve(rootDir, "manifest");
  const [baseManifest, overlayManifest] = await Promise.all([
    readJsonObject(resolve(manifestDir, "base.json")),
    readJsonObject(resolve(manifestDir, `${target}.json`)),
  ]);

  return mergeJsonObjects(baseManifest, overlayManifest);
}

function getContentBundle(bundle: Record<string, BundleFile>): BundleFile {
  const contentBundle = bundle["content/index.js"];

  if (!contentBundle || contentBundle.type !== "chunk") {
    throw new Error("Expected content/index.js chunk in build output.");
  }

  return contentBundle;
}

export function getExtensionBuildTarget(
  rawTarget = process.env.EXTENSION_TARGET,
): ExtensionBuildTarget {
  if (rawTarget && isSupportedExtensionBuildTarget(rawTarget)) {
    return rawTarget;
  }

  if (!rawTarget) {
    return "firefox";
  }

  throw new Error(`Unsupported EXTENSION_TARGET: ${rawTarget}`);
}

export function createWebExtensionBuildPlugin(
  target: ExtensionBuildTarget,
): Plugin {
  let config: ResolvedConfig | null = null;

  return {
    name: "sot-webext-build",
    apply: "build",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async buildStart() {
      if (!config) {
        throw new Error("Vite config must be resolved before build starts.");
      }

      const manifest = await loadManifest(config.root, target);

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },
    generateBundle(_outputOptions, bundle) {
      const contentBundle = getContentBundle(bundle as Record<string, BundleFile>);

      if (/^import\s/mu.test(contentBundle.code ?? "")) {
        throw new Error(
          `Content script bundle for ${target} must stay self-contained.`,
        );
      }
    },
  };
}
