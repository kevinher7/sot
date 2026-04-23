# Research Questions

## Components / UI

- Where is the two-button mode selector (FULL / INTERN) rendered in the DOM, and what is its parent element chain (section label row, section, content, shell, root)?
- How is the click handler for each mode selector button wired up in `renderer.ts`, and what conditions (if any) inside the handler can cause it to early-return without calling `onSelectWorkMode`?
- What `aria-pressed`, `data-active`, and `data-mode` attributes does each button receive, and how are they derived from the view model `OverlayModeSelectorOption.isActive`?
- Where is the `OverlayModeSelectorOption.isActive` value computed (file, function, logic), and what value of `result.workMode` drives whether the `intern` option is considered active?
- Does the mode selector appear inside only the today section, or elsewhere, and does `createSectionLabel` conditionally render it based on props?

## Styling / CSS

- What CSS rules are applied to `.sot-mode-selector` and `.sot-mode-selector-button` — in particular, are there any `pointer-events`, `overflow`, `z-index`, `visibility`, `opacity`, `transform`, or `position` declarations that could block clicks?
- Does the `.sot-shell` element use `overflow: hidden`, and does the mode selector sit inside it? Could it be visually clipped out of the clickable area?
- What is the `z-index` of `#sot-root`, and does any `::before` pseudo-element or sibling layer overlap the mode selector region with a higher stacking level?
- Is `box-sizing` reset on descendants of `#sot-root`, and could the `.sot-mode-selector` `min-width: 96px` combined with the flex layout of `.sot-section-label-row` push the INTERN button beyond the 248px root width where it becomes invisible or overlapped?
- Does the `.sot-section-label-row` have `justify-content: space-between` and `gap` rules that could overlap the mode selector with section labels/badges when content is long?

## Business Logic / State Flow

- When a mode button is clicked, what sequence of calls happens: `onSelectWorkMode` → `setWorkMode` → `queueModeRefresh` → re-render? Is there anywhere in this chain the write to storage could silently fail?
- In `setWorkMode` (storage.ts), what does `normalizeSettings` return when given `{ workMode: "intern" }`, and does `normalizeWorkMode` actually preserve the "intern" value?
- After `setWorkMode` resolves, does `queueModeRefresh` re-render using fresh settings from storage? Is there any stale cache check (`shouldSkipRender`, `settingsSignature`) that would prevent a re-render when only `workMode` changed?

## Observer / Event Interference

- Does `observeDocumentChanges` (MutationObserver) monitor changes inside the overlay root, and could its `isOverlayMutationTarget` check misclassify overlay mutations in a way that triggers reflow cycles that unmount the button before the click handler fires?
- Does the host KOT page re-render or mutate the body in a way that would cause `ensureOverlayRoot` / `renderOverlayResult` to rebuild the overlay DOM (destroying the button) between `mousedown` and `click`?
- Are there any global event listeners, `preventDefault`, or `stopPropagation` calls anywhere in the codebase that could interfere with button clicks inside `#sot-root`?

## Browser-Specific / Chrome Extension

- Does the manifest (manifest v2/v3) or any content script injection config introduce isolated worlds that might prevent the click handler from firing in Chrome specifically?
- Are there any Chrome-specific CSS features being used (e.g., `-webkit-` prefixes, `user-select`, `touch-action`) on the mode selector that would differ from Firefox behavior?
- Is the overlay root attached to the main document or inside a shadow DOM / iframe, and could Chrome's event propagation differ there?

## Testing

- Are there unit or integration tests covering the mode selector's click behavior, and what do they assert about `onSelectWorkMode` being invoked?
