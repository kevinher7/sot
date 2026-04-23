# Research Findings

## Components / UI

### Where is the two-button mode selector (FULL / INTERN) rendered in the DOM, and what is its parent element chain (section label row, section, content, shell, root)?

- The selector is built by `createModeSelector` at `src/entrypoints/content/runtime/overlay/renderer.ts:97-131`.
- It creates a `<div class="sot-mode-selector" role="group">` containing two `<button class="sot-mode-selector-button">` children (one per option, `FULL` and `INTERN`).
- It is appended as a child of `.sot-section-label-row` by `createSectionLabel` at `renderer.ts:166-170` via `wrapper.append(createModeSelector(...))`.
- The full parent chain (from outermost in) is:
  - `#sot-root` (the overlay host, id set in `overlay/root.ts:4`, created in `overlay/root.ts:15-18`)
  - `.sot-shell` (created in `renderer.ts:363`, appended to root in `renderOverlayChildren` → `renderOverlayResult` at `renderer.ts:447-458`)
  - `main.sot-content` (`renderer.ts:365`, appended to shell at `renderer.ts:380`)
  - `section.sot-section` (today section, `renderer.ts:287`, returned by `createTodaySection` and appended to content at `renderer.ts:373-378`)
  - `div.sot-section-label-row` (`renderer.ts:138`, appended to section at `renderer.ts:295`)
  - `div.sot-mode-selector` (appended to the label row at `renderer.ts:167-169`)

### How is the click handler for each mode selector button wired up in `renderer.ts`, and what conditions (if any) inside the handler can cause it to early-return without calling `onSelectWorkMode`?

- Wired at `renderer.ts:120-126`:
  ```ts
  button.addEventListener("click", () => {
    if (option.isActive) {
      return;
    }
    onSelectWorkMode(option.mode);
  });
  ```
- The handler early-returns only when `option.isActive === true`. It does not stop propagation, does not `preventDefault`, and has no other guards.
- The condition `option.isActive` is derived from the view model (see next question). If the view model already marks `intern` as active, clicks on the INTERN button will no-op.

### What `aria-pressed`, `data-active`, and `data-mode` attributes does each button receive, and how are they derived from the view model `OverlayModeSelectorOption.isActive`?

- At `renderer.ts:115-119`:
  - `button.type = "button"`
  - `button.ariaLabel = option.ariaLabel`
  - `button.ariaPressed = option.isActive ? "true" : "false"`
  - `button.dataset.active = option.isActive ? "true" : "false"`
  - `button.dataset.mode = option.mode` (either `"full"` or `"intern"`)
- The CSS selector `.sot-mode-selector-button[data-active="true"]` (`content.css:302-305`) applies the green "active" background, and `[data-active="false"]:hover` (`content.css:307-309`) applies the hover highlight. There are no disabled attributes; the button remains clickable regardless of active state — only the JS guard in the handler blocks the call.

### Where is the `OverlayModeSelectorOption.isActive` value computed (file, function, logic), and what value of `result.workMode` drives whether the `intern` option is considered active?

- Computed in `createModeSelector` at `src/entrypoints/content/runtime/overlay/model.ts:189-209`:
  ```ts
  options: [
    { ..., isActive: result.workMode === "full",   mode: "full"   },
    { ..., isActive: result.workMode === "intern", mode: "intern" },
  ]
  ```
- `result.workMode` comes from `OverlayCalculationResult` populated by `calculateOverlayMetrics` (invoked at `refresh-executor.ts:91-96`, passing the `settings` object returned from `getSettings`). So `result.workMode` reflects the persisted `settings.workMode`.
- `settings.workMode` is normalized in `src/domain/kot/settings.ts:3-5`:
  ```ts
  function normalizeWorkMode(workMode: string | undefined): WorkMode {
    return workMode === "intern" ? "intern" : "full";
  }
  ```
  "intern" is preserved verbatim; any other value (including undefined) falls back to "full".

### Does the mode selector appear inside only the today section, or elsewhere, and does `createSectionLabel` conditionally render it based on props?

- Only the today section. `createTodaySection` (`model.ts:211-225`) sets `modeSelector: createModeSelector(result)` on its section model; `createMonthSection` (`model.ts:227-245`) does not set `modeSelector` (left undefined).
- `createSectionLabel` (`renderer.ts:133-173`) renders the selector only when both `model.modeSelector` and `onSelectWorkMode` are truthy (`renderer.ts:166`). The month section's call at `renderer.ts:327` does not pass `onSelectWorkMode`, so even if a future model added `modeSelector`, it would not render there.

---

## Styling / CSS

### What CSS rules are applied to `.sot-mode-selector` and `.sot-mode-selector-button` — in particular, are there any `pointer-events`, `overflow`, `z-index`, `visibility`, `opacity`, `transform`, or `position` declarations that could block clicks?

- `.sot-mode-selector` at `src/entrypoints/content/content.css:270-279`:
  - `display: inline-grid; grid-template-columns: repeat(2, minmax(0, 1fr));`
  - `flex: 0 0 auto; min-width: 96px;`
  - `overflow: hidden;` ← clipping declaration (but on the container itself, does not disable clicks on children that stay within bounds)
  - `border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 4px; background: #ffffff;`
  - No `pointer-events`, `z-index`, `visibility`, `opacity`, `transform`, or `position` declarations.
- `.sot-mode-selector-button` at `content.css:281-296`:
  - `display: flex; align-items: center; justify-content: center;`
  - `min-width: 0; padding: 3px 6px;`
  - `border: 0; background: transparent;`
  - `cursor: pointer;`
  - `font-size: 9px; font-weight: 800; letter-spacing: 0.08em; line-height: 1; text-transform: uppercase; color: #334155;`
  - No `pointer-events`, `position`, `z-index`, `opacity`, `visibility`, or `transform`.
- Project-wide search for `pointer-events`, `user-select`, `touch-action`, and `-webkit-` in `src/` returned no matches.

### Does the `.sot-shell` element use `overflow: hidden`, and does the mode selector sit inside it? Could it be visually clipped out of the clickable area?

- `.sot-shell` at `content.css:24-31` declares `overflow: hidden` and `position: relative`.
- The mode selector sits inside `.sot-shell` (chain: shell → content → section → label-row → mode-selector), so any portion of the selector that extends beyond the shell's content box is clipped and not hit-testable.
- Fixed widths to be aware of:
  - `#sot-root` width is 248px (`content.css:3`).
  - `.sot-content` padding 12px on each side (`content.css:168`), leaving ~224px for sections.
  - `.sot-section-label-row` uses `display: flex; justify-content: space-between; gap: 8px; padding: 0 2px` (`content.css:182-189`).
  - `.sot-mode-selector` uses `min-width: 96px` and `flex: 0 0 auto` (`content.css:272-275`).
  - The left child (`.sot-section-label-wrap`) uses `flex-wrap: wrap` and `min-width: 0` (`content.css:191-197`), so in normal layouts the selector retains its 96px and is fully visible.
- On today's section only the label `TODAY MMDD` plus optional badges occupy the left side; this is short and leaves room. Unless the "今日 / TODAY" content somehow grows, the selector should not be clipped.

### What is the `z-index` of `#sot-root`, and does any `::before` pseudo-element or sibling layer overlap the mode selector region with a higher stacking level?

- `#sot-root` sets `z-index: 2147483647` (`content.css:2`) — the maximum signed 32-bit integer; this is the highest possible z-index on the page.
- `.sot-shell::before` (`content.css:33-42`): `position: absolute; inset: -2px; z-index: -1; ... filter: blur(14px); opacity: 0.6`. Because of `z-index: -1` on a positioned pseudo-element, it renders below the shell's content, not above it. It does not overlap the buttons in the stacking order.
- No other overlay CSS rules use `z-index` or create overlapping positioned layers.
- `.sot-accent` at `content.css:511-520` is a 4px-tall gradient at the bottom of the shell; it sits after the main content flow and does not cover the mode selector area.

### Is `box-sizing` reset on descendants of `#sot-root`, and could the `.sot-mode-selector` `min-width: 96px` combined with the flex layout of `.sot-section-label-row` push the INTERN button beyond the 248px root width where it becomes invisible or overlapped?

- `box-sizing: border-box` is applied to all descendants at `content.css:20-22` (`#sot-root *`).
- The label row is `display: flex` with `justify-content: space-between` and `gap: 8px`. Its left child wraps (`.sot-section-label-wrap { flex-wrap: wrap; min-width: 0 }`). The right child is the selector with `flex: 0 0 auto; min-width: 96px`. Effective layout width available: ~224px (root 248 − `.sot-content` padding 24) − `.sot-section-label-row` padding 4 = 220px, leaving ~116px for the label column next to a 96px selector plus 8px gap.
- For the TODAY label `TODAY 0423` (around 10 chars at 9px text), there is ample room — the selector does not overflow past the shell.
- The shell clips via `overflow: hidden` (`content.css:26`); if the selector were wider than available space, the right edge of the INTERN button would be clipped and unclickable in that clipped region. Not observed in normal layouts but possible if the label row content expands (e.g. multiple warning/error badges inside the left wrap forcing the row into a larger width — but `flex-wrap: wrap` on the left child mitigates this).

### Does the `.sot-section-label-row` have `justify-content: space-between` and `gap` rules that could overlap the mode selector with section labels/badges when content is long?

- `.sot-section-label-row` at `content.css:182-189`: `display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; padding: 0 2px`.
- `.sot-section-label-wrap` at `content.css:191-197` uses `flex-wrap: wrap; min-width: 0`, so the left column wraps rather than pushing the selector.
- Because flexbox enforces `gap: 8px` between children and the selector has `flex: 0 0 auto`, the two children cannot visually overlap under standard flex behaviour — the selector keeps its 96px and the label column shrinks/wraps. No CSS was found that would cause overlap. However, Chrome inherits from the `ja-JP` locale some letter-spacing/kerning quirks that shouldn't change this layout.

---

## Business Logic / State Flow

### When a mode button is clicked, what sequence of calls happens: `onSelectWorkMode` → `setWorkMode` → `queueModeRefresh` → re-render? Is there anywhere in this chain the write to storage could silently fail?

- The button handler calls `onSelectWorkMode(option.mode)` at `renderer.ts:125`.
- That callback is defined in `src/entrypoints/content/runtime/refresh-executor.ts:99-107`:
  ```ts
  renderOverlayResult(root, doc, model, (workMode: WorkMode) => {
    if (workMode === settings.workMode) {
      return;
    }
    void setWorkMode(workMode).then(() => {
      queueModeRefresh();
    });
  });
  ```
- `settings` here is captured from the outer `async` scope of `runRefresh` — it is the snapshot of settings at the time of the last render. If `settings.workMode === workMode`, the callback no-ops. Since the button handler already guards with `option.isActive` (which is also derived from `settings.workMode`), both guards align: only clicks on the non-active button will proceed.
- `setWorkMode` (storage.ts:38-50) calls `getSettings`, `normalizeSettings`, and `setSettings` → `setStorageValues`. Failures in the underlying `browser.storage.local` call would throw, but the promise is `void`'d (`.then` not `.catch`), so any error is swallowed silently. `queueModeRefresh` would not fire if `setWorkMode` rejects — the `.then` handler would not run on rejection.
- `queueModeRefresh` at `src/entrypoints/content/runtime/index.ts:46-48` calls `coordinator.queueRefresh("dom")`, which runs `runRefresh("dom")` via `refresh-coordinator.ts:27-48`.

### In `setWorkMode` (storage.ts), what does `normalizeSettings` return when given `{ workMode: "intern" }`, and does `normalizeWorkMode` actually preserve the "intern" value?

- `normalizeSettings` at `src/domain/kot/settings.ts:13-21` spreads `DEFAULT_SETTINGS`, then the input, and overrides `workMode` with `normalizeWorkMode(settings?.workMode)`.
- `normalizeWorkMode` at `src/domain/kot/settings.ts:3-5` returns `"intern"` iff the input equals `"intern"`, else `"full"`. Therefore `{ workMode: "intern" }` is preserved correctly.
- Defaults: `DEFAULT_SETTINGS.workMode = "full"` (`settings.ts:7-11`).

### After `setWorkMode` resolves, does `queueModeRefresh` re-render using fresh settings from storage? Is there any stale cache check (`shouldSkipRender`, `settingsSignature`) that would prevent a re-render when only `workMode` changed?

- `runRefresh` awaits `getSettings()` fresh each call (`refresh-executor.ts:33`), so the new `workMode` is read from storage.
- `createSettingsSignature` at `src/entrypoints/content/runtime/state.ts:24-32` includes `workMode`:
  ```ts
  JSON.stringify({
    standardBreakMinutes, standardWorkdayHours, workMode,
  })
  ```
- `shouldSkipRender` (refresh-executor.ts:78-84) requires all four comparisons to match including `cache.settingsSignature === settingsSignature`. Since the signature changed, the skip does not apply and a re-render proceeds.

---

## Observer / Event Interference

### Does `observeDocumentChanges` (MutationObserver) monitor changes inside the overlay root, and could its `isOverlayMutationTarget` check misclassify overlay mutations in a way that triggers reflow cycles that unmount the button before the click handler fires?

- `observeDocumentChanges` at `src/entrypoints/content/runtime/dom-observer.ts:11-37` observes `doc.body` with `{ subtree: true, childList: true, attributes: true, attributeFilter: ["class", "value"] }`.
- `isOverlayMutationTarget(node)` at `dom-observer.ts:3-9` returns `true` when the target is `#sot-root` itself, when the target is inside `#sot-root`, or when its parent element is inside `#sot-root`. The MutationObserver callback only proceeds if `some(record => !isOverlayMutationTarget(record.target))` — i.e. at least one record targeting outside the overlay.
- Mutations caused by `root.replaceChildren(...)` target `#sot-root` and its descendants; those are filtered out. Thus overlay re-renders should not self-trigger.
- Risk: the host KoT page continuously updates elements with `class` or `value` attributes (very common on form-heavy admin pages). Each unfiltered mutation calls `onChange → coordinator.scheduleRefresh("dom")` (`runtime/index.ts:50-52`), which via `requestAnimationFrame` queues a refresh. A busy host page could force frequent overlay re-renders, replacing the mode selector button between `mousedown` and `click`. In Chrome this racing is a known cause of cancelled clicks (a `click` only fires if the same element receives both `mousedown` and `mouseup`). This is the most plausible root cause of "cannot click intern mode" on Chrome.

### Does the host KOT page re-render or mutate the body in a way that would cause `ensureOverlayRoot` / `renderOverlayResult` to rebuild the overlay DOM (destroying the button) between `mousedown` and `click`?

- Yes — see previous answer. `renderOverlayResult` (`renderer.ts:447-458`) calls `renderOverlayChildren` which does `root.replaceChildren(...children)` (`renderer.ts:385-392`). Each refresh replaces the entire `.sot-shell`, destroying and recreating the `<button>` element and its event listeners.
- `createRefreshExecutor` (`refresh-executor.ts:78-89`) performs a `shouldSkipRender` guard only when `reason === "dom"` AND all caches match. Other renders proceed and rebuild the DOM. In practice, most mutations from the KoT page end up invalidating `pageSignature` (via `readMonthlyPageSnapshot`) or at minimum pass through to `renderOverlayResult`. Between rapid `scheduleRefresh("dom")` calls, the shell is replaced; the user's `mousedown` on an old button followed by `mouseup` on a freshly-rendered button yields no `click` event.

### Are there any global event listeners, `preventDefault`, or `stopPropagation` calls anywhere in the codebase that could interfere with button clicks inside `#sot-root`?

- Grep for `preventDefault`, `stopPropagation`, `stopImmediatePropagation` across `src/` returned no matches.
- Window-level listeners in the codebase: only `win.addEventListener("resize", ...)` in `bootstrap.ts:59-61` and `doc.addEventListener("DOMContentLoaded", ..., { once: true })` in `bootstrap.ts:53-54`. Neither interferes with button clicks.
- No capture-phase listeners or synthetic event systems are used.

---

## Browser-Specific / Chrome Extension

### Does the manifest (manifest v2/v3) or any content script injection config introduce isolated worlds that might prevent the click handler from firing in Chrome specifically?

- `manifest/base.json` uses `manifest_version: 3` with a single content script entry:
  ```json
  { "matches": ["https://s2.ta.kingoftime.jp/admin/*"],
    "js": ["content/index.js"], "css": ["content/index.css"],
    "run_at": "document_idle" }
  ```
- No `world: "MAIN"` specifier, so Chrome runs the script in the default isolated world. `chromium.json` is empty (`{}`) and `firefox.json` only adds `browser_specific_settings`. The event listeners are attached inside the isolated world to DOM nodes the content script itself created (`doc.createElement("button")` in the same isolated world), so clicks in the main world bubble through to the listener normally. No Chrome-specific isolation barrier.

### Are there any Chrome-specific CSS features being used (e.g., `-webkit-` prefixes, `user-select`, `touch-action`) on the mode selector that would differ from Firefox behavior?

- Grep across `src/` for `pointer-events`, `user-select`, `touch-action`, `-webkit-` returned no matches. The mode selector styles use only cross-browser properties (flex/grid, border, background, cursor, etc.).

### Is the overlay root attached to the main document or inside a shadow DOM / iframe, and could Chrome's event propagation differ there?

- `ensureOverlayRoot` at `src/entrypoints/content/runtime/overlay/root.ts:6-24` uses `doc.createElement("div")` then `doc.body.append(root)`. No `attachShadow` call anywhere in `src/` (grep returned no matches). The overlay lives directly in the main document, so standard DOM event propagation applies.

---

## Testing

### Are there unit or integration tests covering the mode selector's click behavior, and what do they assert about `onSelectWorkMode` being invoked?

- No test files found. Glob for `*.test.{ts,js}`/`*.spec.{ts,js}` across the repo returned zero matches (excluding `node_modules`). There is no test scaffolding (no `vitest`/`jest` config observed in the repo tree at `package.json` level).
- There are no assertions for the mode selector's click behavior anywhere in the codebase.
