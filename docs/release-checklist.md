# Release checklist

## Prepare v1.2.2 artifacts

1. Run `npm ci`.
2. Run `npm run release:prepare`.
3. Confirm these files exist:
   - `releases/firefox.xpi`
   - `releases/chromium.zip`

## Firefox Add-ons (existing listing)

1. Open the existing SOT listing in AMO Developer Hub.
2. Upload `releases/firefox.xpi` as a new version.
3. Add release notes for v1.2.2:
   - Fix: remove superseded request entries from patch simulation
   - Fix: merge storage defaults with stored values
   - Fix: ignore requested break markers when parsing monthly rows
4. Verify permissions and data disclosures still match the extension behavior.
5. Submit the update for review.

## Chrome Web Store (existing listing)

1. Open the Chrome Web Store Developer Dashboard.
2. Open the existing SOT listing and upload `releases/chromium.zip` as an update.
3. Verify the store listing is still accurate.
4. Submit for review, then publish when approved.

## Manual verification before submission

- Install the Firefox package and verify the monthly page overlay still works.
- Install the Chromium package and verify the same behavior in Chrome.
- Install the Chromium package in Vivaldi and verify compatibility there too.
