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
  domain/
    kot/
  platform/
    webext/
```

- `entrypoints/` contains shipped or future extension surfaces.
- `domain/kot/` contains KOT-specific types and pure page/settings logic.
- `platform/webext/` contains browser API and storage adapters.

## Scripts

- `npm install`
- `npm run lint`
- `npm run build`
- `npm run typecheck`
- `npm run dev`

## Load in Firefox / Zen

1. Run `npm install`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Open `about:debugging` in Firefox or Zen.
5. Choose **This Firefox**.
6. Click **Load Temporary Add-on**.
7. Select `dist/manifest.json`.

## Notes

- This scaffold uses Manifest V3.
- Tailwind CSS is integrated through the official Vite plugin.
- No feature logic is implemented yet.
- The shipped extension currently contains only the content-script surface.
- Settings still come from `browser.storage.local`; there is just no built-in options UI right now.
- The source tree is organized by extension surface and layer to keep future popup/background additions straightforward.
