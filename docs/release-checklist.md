# Release checklist

## Prepare v1.2.0 artifacts

1. Run `npm ci`.
2. Run `npm run release:prepare`.
3. Confirm these files exist:
   - `releases/firefox.xpi`
   - `releases/chromium.zip`

## Firefox Add-ons (existing listing)

1. Open the existing SOT listing in AMO Developer Hub.
2. Upload `releases/firefox.xpi` as a new version.
3. Add release notes for v1.2.0:
   - Work mode selector
   - Intern overlay projection
4. Verify permissions and data disclosures still match the extension behavior.
5. Submit the update for review.

## Chrome Web Store (new listing)

1. Open the Chrome Web Store Developer Dashboard.
2. Create a new item and upload `releases/chromium.zip`.
3. Complete the store listing:
   - title, summary, description
   - screenshots
   - 128x128 icon
   - privacy policy URL
   - support/homepage URLs
4. Complete the privacy practices section based on `PRIVACY.md`.
5. Submit for review, then publish when approved.

## Manual verification before submission

- Install the Firefox package and verify the monthly page overlay still works.
- Install the Chromium package and verify the same behavior in Chrome.
- Install the Chromium package in Vivaldi and verify compatibility there too.
