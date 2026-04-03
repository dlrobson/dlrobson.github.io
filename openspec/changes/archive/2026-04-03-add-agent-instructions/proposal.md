## Why

AI coding agents (Claude Code today, GitHub Copilot soon) have no project-level guidance, so they reach for `npm run ...` commands, miss the nix shell apps, and don't know to verify builds, formatting, and lint before finishing a task. This creates rework cycles: commit → discover issue → re-prompt → fix.

## What Changes

- Add `CLAUDE.md` at the repo root with agent instructions for Claude Code
- Add `.github/copilot-instructions.md` with identical content for GitHub Copilot
- Both files cover: nix commands, required verification gate, source layout, test scope

## Capabilities

### New Capabilities

- `agent-instructions`: Project-level guidance files for AI coding agents — commands to run, verification requirements, and source layout orientation

### Modified Capabilities

_(none)_

## Impact

- Two new files: `CLAUDE.md` and `.github/copilot-instructions.md`
- No code changes; no dependencies affected
- Must be kept in sync when project tooling changes
