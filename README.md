# SOT (SERVANT OF TIME)

SOT (SERVANT OF TIME) is an unofficial Firefox-first WebExtension overlay for the KING OF TIME admin monthly working page.

> Unofficial project. Not affiliated with, endorsed by, or sponsored by Human Technologies or KING OF TIME.

## Supported page scope

The extension is intentionally narrow in scope.

It only runs on:

- `https://s2.ta.kingoftime.jp/admin/*`

And it only activates its overlay when the current page is the KING OF TIME admin monthly individual working list page:

- `page_id=/working/monthly_individual_working_list`

If the page does not match that scope, the content script does not mount the overlay.

## Current behavior

- Reads the monthly timecard page and renders an in-page overlay summary
- Reads extension settings from `browser.storage.local`
- Falls back to domain defaults when stored settings are missing
- Refreshes the overlay as page data changes and as time advances
- Stays scoped to the supported KING OF TIME monthly page only

## Install / development

### Requirements

- Node.js 20+ recommended
- npm
- Firefox or Zen Browser

### Install dependencies

```bash
npm install
```

### Development build

Watch and rebuild into `dist/` on file changes:

```bash
npm run dev
```

### Typecheck

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Production build

```bash
npm run build
```

## Load the extension in Firefox / Zen

1. Install dependencies with `npm install`.
2. Run `npm run typecheck`.
3. Run `npm run build`.
4. Open `about:debugging` in Firefox or Zen.
5. Open **This Firefox**.
6. Click **Load Temporary Add-on**.
7. Select `dist/manifest.json`.

## Screenshots / GIF

This repo does not include product screenshots yet.

Recommended media to add before a public release:

- `docs/media/monthly-page-overlay.png`
- `docs/media/monthly-page-overlay.gif`

When those files are added, embed them here, for example:

```md
![Monthly page overlay](docs/media/monthly-page-overlay.png)
```

## Privacy

See [PRIVACY.md](./PRIVACY.md).

## Support / contact

For bug reports, feature requests, or support, please use:

- [GitHub Issues](../../issues)

## License

This project is licensed under the [MIT License](./LICENSE).

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

## Notes

- The extension uses Manifest V3.
- Tailwind CSS is integrated through the official Vite plugin.
- The shipped extension currently contains only the content-script surface.
- Settings come from `browser.storage.local`; there is no built-in options UI yet.
- The source tree is organized by extension surface and layer to keep future popup/background additions straightforward.
