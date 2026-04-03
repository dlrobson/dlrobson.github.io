## Context

The project uses nix shell apps (`build`, `check`, `fix`, `run-tests`) as the canonical interface to all dev tasks — not raw npm scripts. Agents default to npm and have no awareness of this. Two agent instruction file conventions exist: `CLAUDE.md` (Claude Code) and `.github/copilot-instructions.md` (GitHub Copilot). The site is in active transition from Claude Code to GitHub Copilot, so both need to be maintained simultaneously with identical content.

## Goals / Non-Goals

**Goals:**

- Give agents the correct commands (nix apps, not npm)
- Define a required verification gate for all tasks
- Orient agents to source layout and test scope rules
- Support both Claude Code and GitHub Copilot with one canonical content source

**Non-Goals:**

- Documenting the full project architecture (agents can read the code)
- Automating sync between the two files
- Covering edge-case workflows (PDF generation, deployment, etc.)

## Decisions

### Single source, two files — not symlink or include

Both files will contain identical content written manually. Alternatives:

| Option                                                  | Reason rejected                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| Symlink `CLAUDE.md` → `.github/copilot-instructions.md` | Git doesn't handle symlinks portably; GitHub renders them poorly |
| `CLAUDE.md` with `@include` directive                   | Copilot doesn't support includes; diverges immediately           |
| Single shared file with both tools reading it           | Neither tool supports custom paths                               |

Manual duplication is acceptable given the file is small and changes rarely (only when tooling changes).

### Verification gate runs unconditionally

Every task runs `build` + `check`, regardless of change type. Alternatives considered:

- Conditional gating (e.g., skip build for content edits): More nuanced, but agents misclassify change types and skip incorrectly. The cost of a false skip (broken build in CI) exceeds the cost of always running (~15-20s extra).

### `run-tests` scoped to `src/`

Tests exist only in `src/` (co-located `.test.ts` files). Routes and components have no tests. Scoping to `src/` is precise and avoids running tests on post/content edits.

## Risks / Trade-offs

- **Sync drift**: Two identical files will diverge over time → Mitigation: note in both files and in this design that they must be kept in sync; treat any tooling change as a trigger to update both.
- **Nix environment assumed**: Instructions only work inside `nix-shell`. Agents running outside nix will get command-not-found → Mitigation: acceptable for this project; dev is always done inside nix-shell.
