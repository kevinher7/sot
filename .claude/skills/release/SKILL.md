---
name: release
description: "Prepare and publish a new SOT extension release. Bumps version, creates a release branch + PR, and after merge handles tagging, building, and GitHub release creation."
argument-hint: "[<version> | finish]"
allowed-tools: [Bash, Read, Edit, Write, Grep, Glob, AskUserQuestion]
user-invocable: true
---

# SOT Release Skill

Manages the full release lifecycle for the SOT browser extension. Two modes dispatched from `$ARGUMENTS`:

| `$ARGUMENTS`                    | Action                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- |
| A semver version (e.g. `1.2.3`) | **Prepare**: create release branch, bump version, open PR                   |
| `finish`                        | **Finish**: after PR is merged, build artifacts, tag, create GitHub release |
| Empty or ambiguous              | Detect current state and suggest the right action                           |

---

## Mode: Prepare (`/release <version>`)

### Step 1: Validate

1. Confirm working tree is clean (`git status --porcelain` should be empty).
2. Confirm you are on `main` and up to date with `origin/main`.
3. Confirm the version argument is valid semver and greater than the current version in `package.json`.
4. Confirm the tag `v<version>` does not already exist.

If any check fails, report the issue and stop.

### Step 2: Create release branch

```bash
git checkout -b release/v<version>
```

### Step 3: Bump version

Update the version string in both files:

- `package.json` — the `"version"` field
- `manifest/base.json` — the `"version"` field

### Step 4: Update release checklist

Update `docs/release-checklist.md`:

- Change the version in the "Prepare" heading
- Update the release notes bullet list under the Firefox section

To build the release notes, collect user-facing PRs merged since the last tag:

```bash
git log <last-tag>..main --oneline --grep="^feat\|^fix" --extended-regexp
```

Include PRs with `feat:` or `fix:` prefixes. Omit `chore:`, `docs:`, and `ci:` commits.

### Step 5: Update lock file

```bash
npm install --package-lock-only
```

### Step 6: Commit

```bash
git add package.json package-lock.json manifest/base.json docs/release-checklist.md
git commit -m "chore(release): v<version>"
```

### Step 7: Push and create PR

```bash
git push -u origin release/v<version>
```

Create a PR targeting `main` with:

- **Title**: `chore(release): v<version>`
- **Body**: summary of version bump + "What's in this release" section listing the user-facing changes + "Post-merge steps" section telling the user to run `/release finish`

Report the PR URL and tell the user to merge it, then run `/release finish`.

---

## Mode: Finish (`/release finish`)

Run this after the release PR has been merged to `main`.

### Step 1: Validate state

1. Switch to `main` and pull latest: `git checkout main && git pull origin main`.
2. Read the current version from `package.json` — this is the version to release.
3. Confirm the tag `v<version>` does not already exist.
4. Confirm the merge commit for the release PR is on `main`.

### Step 2: Build artifacts

```bash
npm ci
npm run release:prepare
```

Verify these files exist and are fresh:

- `releases/firefox.xpi`
- `releases/chromium.zip`

Also verify the built manifests have the correct version:

```bash
grep '"version"' dist-firefox/manifest.json dist-chromium/manifest.json
```

### Step 3: Create source zip

```bash
git archive --format=zip --prefix=sot-<version>/ -o releases/sot-<version>-source.zip HEAD
```

### Step 4: Tag and push

```bash
git tag v<version>
git push origin v<version>
```

### Step 5: Create GitHub release

Build the release notes from the same user-facing PRs identified during prepare. Format:

```markdown
## What's Changed

- <PR title> by @kevinher7 in https://github.com/kevinher7/sot/pull/<number>
  ...

**Full Changelog**: https://github.com/kevinher7/sot/compare/<previous-tag>...v<version>
```

Create the release:

```bash
gh release create v<version> \
  --title "v<version>" \
  --notes "<release notes>" \
  releases/chromium.zip releases/firefox.xpi releases/sot-<version>-source.zip
```

### Step 6: Clean up

Delete the release branch locally and remotely:

```bash
git branch -d release/v<version>
git push origin --delete release/v<version>
```

### Step 7: Report

Print:

- The GitHub release URL
- Remind the user to follow `docs/release-checklist.md` for submitting to AMO and Chrome Web Store

---

## Mode: Auto-detect (no arguments)

If `$ARGUMENTS` is empty:

1. Check if a `release/v*` branch exists locally or on origin.
2. Check if there is an open PR from a release branch.
3. If a release PR exists and is merged → suggest `/release finish`.
4. If a release branch exists but PR is not merged → report PR status.
5. If no release branch exists → read the current version from `package.json`, suggest the next patch version, and ask the user to confirm before running prepare.
