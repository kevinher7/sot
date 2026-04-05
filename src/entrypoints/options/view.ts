import type { OptionsViewModel } from "./model";

function createBadge(text: string): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className =
    "inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200";
  badge.textContent = text;
  return badge;
}

function createHeading(title: string, description: string): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-3";

  const heading = document.createElement("h1");
  heading.className = "text-3xl font-semibold tracking-tight text-white";
  heading.textContent = title;

  const copy = document.createElement("p");
  copy.className = "max-w-2xl text-sm leading-6 text-slate-300";
  copy.textContent = description;

  wrapper.append(createBadge("Scaffold"), heading, copy);
  return wrapper;
}

function createJsonSection(
  title: string,
  jsonValue: unknown,
  tone: string,
): HTMLElement {
  const section = document.createElement("section");
  section.className =
    "rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur";

  const heading = document.createElement("h2");
  heading.className = "text-lg font-medium text-white";
  heading.textContent = title;

  const pre = document.createElement("pre");
  pre.className = `mt-4 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 text-sm ${tone}`;
  pre.textContent = JSON.stringify(jsonValue, null, 2);

  section.append(heading, pre);
  return section;
}

export function renderOptionsPage(
  app: HTMLDivElement,
  model: OptionsViewModel,
): void {
  const main = document.createElement("main");
  main.className =
    "mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10";

  main.append(
    createHeading(
      "KOT Extension",
      "This is a Tailwind-powered placeholder options page for future settings and work-rule configuration.",
    ),
    createJsonSection(
      "Current settings snapshot",
      model.settings,
      "text-cyan-100",
    ),
    createJsonSection(
      "Default scaffold assumptions",
      model.defaults,
      "text-emerald-100",
    ),
  );

  app.replaceChildren(main);
}
