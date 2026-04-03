## 1. Rewrite GitHub deploy workflow

- [x] 1.1 Remove `nix-installer-action` and `magic-nix-cache-action` steps from `.github/workflows/deploy.yml`
- [x] 1.2 Add `actions/setup-node` step with `node-version: '24'`
- [x] 1.3 Add `actions/cache` step to restore/save `node_modules` keyed on `hashFiles('package-lock.json')`
- [x] 1.4 Replace `nix-shell shell.nix --run "build"` with `npm ci` + `npm run build` steps

## 2. Verify

- [ ] 2.1 Push to GitHub and confirm the deploy job completes in under 3 minutes
- [ ] 2.2 Confirm `node_modules` cache hit on a second run with no lockfile change
- [ ] 2.3 Confirm the deployed site at `https://dlrobson.github.io` renders correctly (including Mermaid diagrams)
