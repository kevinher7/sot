# About SOT

SOT is a Firefox-first WebExtension for augmenting KING OF TIME's admin monthly working page.

- The content script runs on `https://s2.ta.kingoftime.jp/admin/*`

# Code Style

- Do not reintroduce a generic `shared/` dumping ground
- Use **named exports only**. No default exports
- Prefer `type` over `interface` for new TypeScript types
- Never use `any`
- No `@ts-ignore` or `@ts-expect-error`
- Keep entrypoint files thin; move logic into focused modules when possible
- Keep domain logic pure and independent from DOM/browser APIs
- Keep browser API access behind `src/platform/webext/`
- Prefer small functions with explicit names over large procedural files
- For DOM rendering, prefer creating elements and assigning `textContent` over injecting large HTML strings
- Tailwind should be used for future extension pages; content-script styling may use scoped CSS when interacting with the host page requires it

# Guidelines

- Keep manifest-facing paths aligned with Vite output paths
- Do not plan, propose, or write automated tests for this project right now unless the user explicitly asks for them

# Extension-Specific Guardrails

- Do not make selectors broader than necessary on the KOT page
- Avoid polling-based DOM logic unless absolutely necessary
- Be cautious with resize, mutation, or scroll listeners; they should stay lightweight
- Avoid injecting global styles that could leak into the host page beyond the extension root
- Keep storage reads/writes centralized through `src/platform/webext/storage.ts`
- For `manifest.json` content scripts, keep the built JS self-contained. Do not introduce imports that make Vite emit extra JS chunks for the content script entrypoint; after changes, verify `dist/content/index.js` does not import other JS files
- If adding new persisted settings, update the domain settings defaults and normalization path together

