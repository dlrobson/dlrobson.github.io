# Resume App (React + TypeScript + Vite)

This project renders my resume as a React + TypeScript app.

## Run with Nix

This repo includes a `shell.nix` that provides Node.js (and npm).

### 1) Enter the Nix shell

```bash
nix-shell
```

### 2) Install dependencies

```bash
npm install
```

### 3) Start dev server

```bash
npm run dev
```

## One-liner commands (without entering shell)

```bash
nix-shell --run "npm install"
nix-shell --run "npm run dev"
nix-shell --run "npm run build"
nix-shell --run "npm run preview"
```

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
