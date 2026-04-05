# SOT (SERVANT OF TIME)

SOT (SERVANT OF TIME) is an unofficial extension overlay for the KING OF TIME timecard.

Not affiliated with or endorsed by Human Technologies or KING OF TIME.

## Target page

The extension activates only on URLs under:

- `https://s2.ta.kingoftime.jp/admin/*`

and only mounts its overlay when the page query includes:

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

## Current behavior

- Reads the monthly timecard page and renders an overlay summary in-page
- Uses `browser.storage.local` settings with domain defaults when values are missing
- Refreshes the overlay as page data changes and as time advances
- Stays scoped to the supported KOT monthly page only

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

- The extension uses Manifest V3.
- Tailwind CSS is integrated through the official Vite plugin.
- The shipped extension currently contains only the content-script surface.
- Settings come from `browser.storage.local`; there is no built-in options UI yet.
- The source tree is organized by extension surface and layer to keep future popup/background additions straightforward.
