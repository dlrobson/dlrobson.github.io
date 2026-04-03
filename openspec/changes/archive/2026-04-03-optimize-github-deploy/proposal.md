## Why

The GitHub Actions deploy job takes ~12 minutes primarily due to `magic-nix-cache-action` uploading the entire Nix store (including Chromium, ~500MB+) to GitHub's cache after every run. The build itself only needs Node.js and npm, and GitHub's ephemeral Ubuntu runners have no warm Nix store to benefit from. Nix is the right tool on the Forgejo CI server (warm store, hermetic), but adds pure overhead on GitHub's cold runners.

## What Changes

- Remove `nix-installer-action`, `magic-nix-cache-action`, and `nix-shell` from the GitHub deploy workflow
- Replace with `actions/setup-node` + `npm ci` + `npm run build` directly
- Add `actions/cache` to cache `node_modules` keyed on `package-lock.json` hash, skipping `npm ci` on cache hits

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `website-github-deploy`: Requirements updated to specify node_modules caching and removal of Nix from the deploy workflow

## Impact

- `.github/workflows/deploy.yml` — rewritten
- No changes to `shell.nix`, Forgejo CI workflow, or source code
- Nix remains the single toolset for local dev and Forgejo CI; npm is used directly only in the GitHub deploy context
