# KOT Extension

Browser extension scaffold for KING OF TIME's admin monthly working page.

## Target page

The scaffold activates only on URLs under:

- `https://s2.ta.kingoftime.jp/admin/*`

and only mounts its placeholder overlay when the page query includes:

- `page_id=/working/monthly_individual_working_list`

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
- The project is organized to stay portable to Chromium later, but only Firefox/Zen loading has been validated in the scaffold design.
