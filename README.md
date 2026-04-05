# KOT Extension

Browser extension scaffold for KING OF TIME's admin monthly working page.

## Target page

The scaffold activates only on URLs under:

- `https://s2.ta.kingoftime.jp/admin/*`

and only mounts its placeholder overlay when the page query includes:

- `page_id=/working/monthly_individual_working_list`

## Project structure

```text
public/
  manifest.json
  icons/

src/
  entrypoints/
    content/
    options/
  domain/
    kot/
  platform/
    webext/
```

- `entrypoints/` contains extension surfaces referenced by the manifest or extension HTML.
- `domain/kot/` contains KOT-specific types and pure page/settings logic.
- `platform/webext/` contains browser API and storage adapters.

## Scripts

- `npm install`
- `npm run build`
- `npm run typecheck`
- `npm run dev`

## Load in Firefox / Zen

1. Run `npm install`.
2. Run `npm run build`.
3. Open `about:debugging` in Firefox or Zen.
4. Choose **This Firefox**.
5. Click **Load Temporary Add-on**.
6. Select `dist/manifest.json`.

## Notes

- This scaffold uses Manifest V3.
- Tailwind CSS is integrated through the official Vite plugin.
- No feature logic is implemented yet.
- The options page is intentionally a placeholder for future settings UI.
- The source tree is organized by extension surface and layer to keep future popup/background additions straightforward.
