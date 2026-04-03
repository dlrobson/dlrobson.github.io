## MODIFIED Requirements

### Requirement: GitHub Actions workflow builds and deploys to Pages

A `.github/workflows/deploy.yml` SHALL exist inside `dlrobson.github.io/`. Forgejo automatically mirrors the repository to `dlrobson/dlrobson.github.io` on push to `main`; this file SHALL land at `.github/workflows/deploy.yml` in the GitHub repo root and trigger on that push.

The workflow SHALL:
1. Check out the repository
2. Set up Node.js 24 via `actions/setup-node`
3. Restore `node_modules` from cache keyed on `package-lock.json` hash
4. Install Node dependencies via `npm ci` (skipped on cache hit)
5. Build the static site via `npm run build`
6. Upload the `build/` directory as a Pages artifact
7. Deploy the artifact to GitHub Pages

The workflow SHALL NOT use `nix-installer-action`, `magic-nix-cache-action`, or `nix-shell`.

The Forgejo CI workflow for the website SHALL only run the `ci` job (check/test/build via nix-shell). It SHALL NOT contain a `deploy` job — deploys are triggered automatically via the Forgejo mirror.

#### Scenario: Push to main triggers build and deploy

- **WHEN** a commit is pushed to `main` on Forgejo and the mirror syncs to `dlrobson/dlrobson.github.io`
- **THEN** the GitHub Actions workflow runs, builds the Svelte app, and deploys to GitHub Pages

#### Scenario: node_modules cache is used on subsequent runs

- **WHEN** `package-lock.json` has not changed since the last successful run
- **THEN** the `node_modules` cache is restored and `npm ci` is skipped

#### Scenario: node_modules cache is invalidated on lockfile change

- **WHEN** `package-lock.json` changes
- **THEN** the cache key does not match, `npm ci` runs in full, and a new cache entry is saved

#### Scenario: Site is accessible at dlrobson.github.io after deploy

- **WHEN** the GitHub Actions deploy job completes successfully
- **THEN** the live site at `https://dlrobson.github.io` reflects the pushed changes

#### Scenario: Build failure blocks deploy

- **WHEN** `npm run build` exits with a non-zero status
- **THEN** the deploy job does NOT run and Pages is not updated

#### Scenario: Forgejo CI does not run the deploy job

- **WHEN** a commit touching `dlrobson.github.io/**` is pushed to the Forgejo main branch
- **THEN** Forgejo CI runs only the `ci` job (check/test/build)
- **AND** the GitHub deploy is handled separately by the mirror trigger
