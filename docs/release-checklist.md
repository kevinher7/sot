# Release checklist

## Prepare v1.4.2 artifacts

1. Run `npm ci`.
2. Run `npm run release:prepare`.
3. Confirm these files exist:
   - `releases/firefox.xpi`
   - `releases/chromium.zip`

## Firefox Add-ons (existing listing)

1. Open the existing SOT listing in AMO Developer Hub.
2. Upload `releases/firefox.xpi` as a new version.
3. Add release notes for v1.4.2:
   - Track office days with a 社/宅 workplace marker, a 出社 count, and an office/remote prompt on clock-in
   - Add an opt-in automatic clock-out at 22:00 JST
   - Fix stale leave credits after a schedule request changes a day back to 通常勤務
   - Fix totals when two pending 申請 move different punches on the same day
   - Remove the 二重申請 checkbox from the 打刻申請 panel and block only true duplicate punches
   - Fix the floating table header falling out of line with the columns after scrolling
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
