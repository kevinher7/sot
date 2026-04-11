# About SOT

SOT is a Firefox-first WebExtension for augmenting KING OF TIME's admin monthly working page.

The current runtime flow is:

1. Firefox loads the extension manifest from `dist/manifest.json`
2. The content script runs on `https://s2.ta.kingoftime.jp/admin/*`
3. The content entrypoint checks whether the current page is the monthly individual working list page
4. If the page matches, the extension mounts a lightweight overlay into the document and keeps it positioned relative to the page title
5. The content runtime reads extension settings from `browser.storage.local` and falls back to domain defaults when stored values are missing

This extension runs directly against a third-party production web app, so be careful with DOM selectors, page assumptions, and any logic that may run frequently on resize, navigation, or page mutation. Small mistakes can make the overlay noisy, brittle, or expensive for end users.

# Code Style

- Prefer the current layered structure:
  - `src/entrypoints/` for extension surfaces
  - `src/domain/` for KOT-specific pure logic and types
  - `src/platform/` for browser/WebExtension adapters
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

# Project Structure

- Content script code: `src/entrypoints/content/`
- KOT page detection and settings domain logic: `src/domain/kot/`
- WebExtension API and storage adapters: `src/platform/webext/`
- Static extension assets and manifest: `public/`
- Production build output: `dist/`

When adding new extension surfaces, follow the same pattern:

- Popup: `src/entrypoints/popup/`
- Background/service worker: `src/entrypoints/background/`
- Additional domain modules: `src/domain/[area]/`
- Additional browser/platform adapters: `src/platform/[area]/`

# Workflow

- Keep manifest-facing paths aligned with Vite output paths
- Load the built extension in Firefox/Zen from `dist/manifest.json`
- If you change manifest entries, verify the referenced files actually exist in `dist/`
- If you change the content script, verify the overlay still mounts only on the intended KOT page

# Extension-Specific Guardrails

- Do not make selectors broader than necessary on the KOT page
- Avoid polling-based DOM logic unless absolutely necessary
- Be cautious with resize, mutation, or scroll listeners; they should stay lightweight
- Avoid injecting global styles that could leak into the host page beyond the extension root
- Preserve the page check in `src/domain/kot/page.ts` as the single source of truth for deciding whether the content script should activate
- Keep storage reads/writes centralized through `src/platform/webext/storage.ts`
- For `manifest.json` content scripts, keep the built JS self-contained. Do not introduce imports that make Vite emit extra JS chunks for the content script entrypoint; after changes, verify `dist/content/index.js` does not import other JS files
- If adding new persisted settings, update the domain settings defaults and normalization path together

# Build and Packaging Notes

- The project uses Vite to build a WebExtension-shaped `dist/` directory
- `public/manifest.json` is copied into the final build and must stay consistent with generated asset paths
- The Vite config should keep extension-friendly output paths such as:
  - `content/index.js`
  - `content/index.css`
- If future extension surfaces are added, update both Vite and the manifest together

# Testing and Verification

- Do not plan, propose, or write automated tests for this project right now unless the user explicitly asks for them
- Minimum verification for code changes:
  - `npm run typecheck`
  - `npm run build`
