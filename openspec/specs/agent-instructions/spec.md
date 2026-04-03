# Capability: Agent Instructions

Project-level guidance files for AI coding agents. Defines the commands, verification requirements, and source layout orientation that agents need to work correctly in this repository.

## Requirements

### Requirement: Agent instruction files exist at expected paths

The project SHALL provide agent instruction files at paths read natively by supported AI coding tools: `CLAUDE.md` (Claude Code) and `.github/copilot-instructions.md` (GitHub Copilot).

#### Scenario: Claude Code finds instructions

- **WHEN** Claude Code is invoked in the project root
- **THEN** it reads `CLAUDE.md` and applies the project instructions

#### Scenario: GitHub Copilot finds instructions

- **WHEN** GitHub Copilot is active in the repository
- **THEN** it reads `.github/copilot-instructions.md` and applies the project instructions

### Requirement: Agent instruction files use nix shell commands

The instruction files SHALL direct agents to invoke nix shell apps via `nix-shell --run "<app>"` and explicitly prohibit use of raw `npm run ...` commands.

#### Scenario: Agent uses correct build command

- **WHEN** an agent needs to build the project
- **THEN** it runs `nix-shell --run "build"`, not `npm run build`

#### Scenario: Agent uses correct verify commands

- **WHEN** an agent needs to type-check, format-check, and lint
- **THEN** it runs `nix-shell --run "check"`, not individual npm scripts

#### Scenario: Agent uses correct fix command

- **WHEN** an agent needs to fix formatting or lint issues
- **THEN** it runs `nix-shell --run "fix"`, not `npm run format && npm run lint:fix`

### Requirement: Agent verification gate runs after every change

The instruction files SHALL require agents to run `nix-shell --run "build"` then `nix-shell --run "check"` after every task, unconditionally.

#### Scenario: Agent completes a change

- **WHEN** an agent finishes implementing any task
- **THEN** it runs `nix-shell --run "build"` and `nix-shell --run "check"` before considering the task done

#### Scenario: Check fails on format or lint

- **WHEN** `check` reports a format or lint failure
- **THEN** the agent runs `nix-shell --run "fix"`, then re-runs `check` and `build` to confirm clean

### Requirement: Agent runs tests when modifying logic

The instruction files SHALL require agents to run `nix-shell --run "run-tests"` when modifying files under `src/lib/`.

#### Scenario: Agent modifies a lib file

- **WHEN** an agent changes any file in `src/`
- **THEN** it runs `nix-shell --run "run-tests"` as part of the verification gate

#### Scenario: Agent modifies a post or route

- **WHEN** an agent changes a file in `src/posts/` or `src/routes/`
- **THEN** it does NOT need to run `run-tests`

### Requirement: Agent instruction files provide source layout orientation

The instruction files SHALL include a compact source layout map so agents know where to find and place files without needing to search.

#### Scenario: Agent needs to add a post

- **WHEN** an agent is asked to create a new blog post
- **THEN** it places the file in `src/posts/` without needing to search

#### Scenario: Agent needs to add a utility

- **WHEN** an agent is asked to add a shared utility
- **THEN** it places the file in `src/` and co-locates a `.test.ts` file alongside it

### Requirement: Both instruction files contain identical content

The two agent instruction files (`CLAUDE.md` and `.github/copilot-instructions.md`) SHALL contain identical content and MUST be updated together whenever project tooling changes.

#### Scenario: Tooling changes

- **WHEN** a nix shell command is added, renamed, or removed
- **THEN** both `CLAUDE.md` and `.github/copilot-instructions.md` are updated in the same commit
