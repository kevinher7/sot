import "./styles.css";

import { DEFAULT_SETTINGS } from "../shared/settings";
import { loadSettings } from "../shared/storage";

async function render(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    throw new Error("Options root element was not found.");
  }

  const settings = await loadSettings();

  app.innerHTML = `
    <main class="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <div class="space-y-3">
        <span class="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Scaffold
        </span>
        <h1 class="text-3xl font-semibold tracking-tight text-white">KOT Extension</h1>
        <p class="max-w-2xl text-sm leading-6 text-slate-300">
          This is a Tailwind-powered placeholder options page for future settings and work-rule configuration.
        </p>
      </div>
      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <h2 class="text-lg font-medium text-white">Current settings snapshot</h2>
        <pre class="mt-4 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 text-sm text-cyan-100">${JSON.stringify(settings, null, 2)}</pre>
      </section>
      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <h2 class="text-lg font-medium text-white">Default scaffold assumptions</h2>
        <pre class="mt-4 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 text-sm text-emerald-100">${JSON.stringify(DEFAULT_SETTINGS, null, 2)}</pre>
      </section>
    </main>
  `;
}

void render();
