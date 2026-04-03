## 1. Create CLAUDE.md

- [x] 1.1 Create `CLAUDE.md` at repo root with project one-liner, commands table (nix apps only, with explicit "do not use npm run"), verification gate section, fix-then-recheck section, `run-tests` scope rule, and source layout map

## 2. Create .github/copilot-instructions.md

- [x] 2.1 Create `.github/` directory if it does not exist
- [x] 2.2 Create `.github/copilot-instructions.md` with content identical to `CLAUDE.md`

## 3. Verify

- [x] 3.1 Confirm both files exist and contain identical content
- [x] 3.2 Run `build` and `check` to confirm no issues introduced

## 4. Amend — use `nix-shell --run` syntax

- [x] 4.1 Update `CLAUDE.md` commands and gate sections to use `nix-shell --run "..."` invocation
- [x] 4.2 Update `.github/copilot-instructions.md` identically
- [x] 4.3 Update `specs/agent-instructions/spec.md` scenarios to reflect `nix-shell --run` syntax
- [x] 4.4 Confirm both instruction files are still identical
- [x] 4.5 Run `nix-shell --run "build"` and `nix-shell --run "check"` to confirm clean
