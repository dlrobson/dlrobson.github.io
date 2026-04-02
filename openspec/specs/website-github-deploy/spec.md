# website-github-deploy

## Purpose

TBD

## Requirements

### Requirement: GitHub Actions workflow builds and deploys to Pages

A `.github/workflows/deploy.yml` SHALL exist inside `dlrobson.github.io/`. When `git subtree push` mirrors the directory to `dlrobson/dlrobson.github.io`, this file SHALL land at `.github/workflows/deploy.yml` in the GitHub repo root and trigger on push to `main`.

The workflow SHALL:
1. Check out the repository
2. Install Node dependencies via `npm ci`
3. Build the static site via `npm run build`
4. Upload the `build/` directory as a Pages artifact
5. Deploy the artifact to GitHub Pages

The Forgejo CI workflow for the website SHALL only run the `ci` job (build/lint). It SHALL NOT contain a `deploy` job — deploys are triggered manually by the developer via `just website-push`.

#### Scenario: Push to main triggers build and deploy

- **WHEN** a commit is pushed to `main` of `dlrobson/dlrobson.github.io` (via `just website-push`)
- **THEN** the GitHub Actions workflow runs, builds the Svelte app, and deploys to GitHub Pages

#### Scenario: Site is accessible at dlrobson.github.io after deploy

- **WHEN** the GitHub Actions deploy job completes successfully
- **THEN** the live site at `https://dlrobson.github.io` reflects the pushed changes

#### Scenario: Build failure blocks deploy

- **WHEN** `npm run build` exits with a non-zero status
- **THEN** the deploy job does NOT run and Pages is not updated

#### Scenario: Forgejo CI does not auto-deploy

- **WHEN** a commit touching `dlrobson.github.io/**` is pushed to the monolith main branch
- **THEN** Forgejo CI runs only the `ci` job (build/lint)
- **AND** no push to the GitHub mirror occurs automatically

### Requirement: GitHub Pages is configured to deploy via GitHub Actions

The `dlrobson/dlrobson.github.io` GitHub repository SHALL have GitHub Pages configured with "GitHub Actions" as the source (not a branch). This is a one-time manual configuration in repository settings.

#### Scenario: Pages source is set correctly

- **WHEN** GitHub Pages settings are viewed for `dlrobson/dlrobson.github.io`
- **THEN** the source is shown as "GitHub Actions" (not "Deploy from a branch")

### Requirement: dlrobson.github.io justfile has a build target

The `dlrobson.github.io/justfile` SHALL include a `build` target that runs `npm run build`, enabling local verification of the static output.

#### Scenario: Developer runs just build locally

- **WHEN** a developer runs `just build` inside `dlrobson.github.io/`
- **THEN** `npm run build` executes and produces a `build/` directory with the static site output
