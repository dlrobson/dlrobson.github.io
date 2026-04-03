SvelteKit static site. TypeScript + mdsvex. Prettier + ESLint.

## Commands

Wrap nix shell apps with `nix-shell --run`. Do not use `npm run ...`.

| Purpose                    | Command                       |
| -------------------------- | ----------------------------- |
| Build                      | `nix-shell --run "build"`     |
| Type-check + format + lint | `nix-shell --run "check"`     |
| Fix format + lint          | `nix-shell --run "fix"`       |
| Tests                      | `nix-shell --run "run-tests"` |

## After every change

    nix-shell --run "build"
    nix-shell --run "check"

If `check` fails on format or lint:

    nix-shell --run "fix"
    nix-shell --run "check"

Re-run `build` and `check` to confirm clean.

Run `run-tests` when modifying `src/`:

    nix-shell --run "run-tests"

## Source layout

    src/
      posts/         markdown posts (mdsvex)
      routes/        SvelteKit file-based routing
      lib/
        components/  Svelte UI components
        *.ts         utilities and data
        *.test.ts    tests co-located alongside source
