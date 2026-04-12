# SOT (SERVANT OF TIME)

SOT (SERVANT OF TIME) is an unofficial Firefox-first WebExtension that adds a focused overlay to the KING OF TIME admin monthly working page.

> Unofficial project. SOT is not affiliated with, endorsed by, or sponsored by Human Technologies or KING OF TIME.

## What it does

SOT reads the currently open monthly timecard page and renders an in-page summary overlay to make the page easier to understand at a glance.

Current v1 behavior:

- shows an overlay summary on the monthly working page
- calculates today and month-level metrics from the page data
- accounts for request-related time corrections when available
- stores extension settings locally in the browser
- stays intentionally narrow in scope instead of running across the full KING OF TIME product

## Supported page scope

The extension only runs on:

- `https://s2.ta.kingoftime.jp/admin/*`

## Permissions and privacy

SOT keeps its access intentionally narrow.

- **Host access:** `https://s2.ta.kingoftime.jp/admin/*`
- **Extension permission:** `storage`
- **Data handling:** settings and request-cache data are stored locally in `browser.storage.local`
- **Third-party services:** none

For full details, see [PRIVACY.md](./PRIVACY.md).

## Installation

### Firefox / Zen Browser (temporary local install)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the extension:
   ```bash
   npm run build
   ```
3. Open `about:debugging#/runtime/this-firefox`.
4. Click **Load Temporary Add-on...**.
5. Select `dist/manifest.json`.

## Development

### Requirements

- Node.js 20+
- npm
- Firefox or Zen Browser

### Start a watch build

```bash
npm run dev
```

### Type-check

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

## Project status

SOT is currently a focused content-script extension with a deliberately small v1 scope.

### Features in progress

- Working on chromium support
- Month breakdown panel
- CSS augmented page (highlight current day, etc)
- Remove recorder invalid buttons based on current status

### Maybe

Potentially but not sure

- Easier 申請 panel from a popup

## Support

For bug reports, feature requests, or questions, please open an issue in this repository.

## License

Released under the [MIT License](./LICENSE).
