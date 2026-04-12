# Privacy Policy

_Last updated: April 12, 2026_

SOT (SERVANT OF TIME) is an unofficial browser extension for the KING OF TIME admin monthly working page.

> Unofficial project. Not affiliated with, endorsed by, or sponsored by Human Technologies or KING OF TIME.

## What the extension reads

The extension reads only the KING OF TIME pages needed to provide its overlay functionality.

On the supported monthly working page, it may read:

- the current page URL and query parameters needed to confirm the page is supported
- the displayed year/month context
- employee-related identifiers needed to look up related request data for the same page context
- daily attendance data shown on the page, such as dates, workday/off-day state, clock-in / clock-out times, break times, worked time, and request/error markers

To support request-aware calculations, the extension may also request the related KING OF TIME request list page for the same signed-in session and read the returned HTML needed to parse:

- request dates
- request status
- time-correction values such as clock-in, clock-out, break start, and break end values
- employee identifiers already present in that KING OF TIME response

## What the extension stores in `browser.storage.local`

The extension stores data locally in your browser only.

It currently stores:

- extension settings:
  - `standardBreakMinutes`
  - `standardWorkdayHours`
- cached KING OF TIME request data used for overlay calculations, including:
  - employee ID
  - year / month
  - parsed request entries
  - derived cache/signature metadata
  - sync timestamps

## Network communication

The extension communicates only with KING OF TIME pages required for its functionality.

At this time, it talks only to the `s2.ta.kingoftime.jp` KING OF TIME site used by the extension's supported page flow.

## What the extension does not do

The extension does **not**:

- send your attendance data to the developer
- send your data to third-party analytics services
- use third-party trackers
- sell or share your data with advertisers
- transmit extension settings or parsed page data to any server other than the KING OF TIME site already required for the extension to work in your browser session

## Contact / support

For questions, bug reports, or privacy-related concerns, please use:

- GitHub repository: <https://github.com/kevinher7/sot>
- GitHub Issues: <https://github.com/kevinher7/sot/issues>
