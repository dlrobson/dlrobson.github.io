default: ci

ci: install check lint fmt-check test

install:
    npm ci

check:
    npm run check

lint:
    npm run lint

fmt-check:
    npm run format:check

test:
    npm run test

build: install
    npm run build
