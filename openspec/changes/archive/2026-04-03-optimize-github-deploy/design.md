## Context

The GitHub Actions deploy job currently uses `nix-installer-action` + `magic-nix-cache-action` + `nix-shell shell.nix --run "build"`. The Nix shell includes `pkgs.chromium` (required for Mermaid diagram rendering at build time), which inflates the Nix store to ~500MB+. On every run, `magic-nix-cache-action` uploads the full store delta to GitHub's cache service, taking ~10 minutes in the post-step — dwarfing the actual build time of ~2 minutes.

Nix is valuable on the Forgejo CI runner because the Nix store is warm (cached from prior runs). GitHub's Ubuntu runners are ephemeral and start cold every time; Magic Nix Cache was intended to warm them, but the upload cost exceeds the benefit for this workload.

## Goals / Non-Goals

**Goals:**
- Reduce total GitHub deploy job time from ~12 minutes to under 3 minutes
- Cache `node_modules` between runs using `actions/cache` keyed on `package-lock.json`
- Keep Nix as the sole toolset for local dev and Forgejo CI

**Non-Goals:**
- Changing `shell.nix` or the Forgejo CI workflow
- Eliminating npm from the project entirely
- Changing the build output or deploy target

## Decisions

### Replace Nix with actions/setup-node in the deploy job

**Decision**: Use `actions/setup-node` with a pinned Node version instead of `nix-installer-action` + `nix-shell`.

**Rationale**: The deploy job only needs Node.js and npm — it does not need the full hermetic Nix environment. `actions/setup-node` is pre-installed on ubuntu-latest runners (near-instant), skips the Nix install entirely, and integrates natively with `actions/cache` for `node_modules`.

**Alternatives considered**:
- Keep Nix but create a separate slim `shell-build.nix` without Chromium — still pays the Nix install + cache upload cost for other packages; more maintenance surface.
- Use `nix build` with a proper derivation — correct long-term but requires significant restructuring (`node2nix`/`npmlock2nix`) and carries ecosystem complexity not justified for a personal site CI.

### Cache node_modules with actions/cache

**Decision**: Use `actions/cache` with key `node-modules-${{ hashFiles('package-lock.json') }}`.

**Rationale**: Standard GitHub Actions pattern. On a cache hit, `npm ci` is skipped entirely (or runs instantly). Cache is automatically invalidated when `package-lock.json` changes, which is the correct invalidation boundary.

### Pin Node version to match shell.nix

**Decision**: Pin `actions/setup-node` to `node-version: '24'` to match `pkgs.nodejs_24` in `shell.nix`.

**Rationale**: Keeps parity between local/Forgejo (Nix-managed) and GitHub deploy environments. Avoids version drift.

## Risks / Trade-offs

- **Two tooling contexts**: Nix for local/Forgejo, npm for GitHub deploy. Risk: a `package.json` script change could behave differently across contexts. Mitigation: Forgejo CI (`check` + `run-tests` + `build`) gates all merges — GitHub deploy only runs after CI passes.
- **Cache miss on first run or lockfile change**: `npm ci` runs in full (~30–60s). Acceptable; this was always the baseline cost.
- **Node version drift**: If `shell.nix` upgrades to `nodejs_26`, the deploy workflow must be updated manually. Mitigation: version is explicit and visible in both files.
