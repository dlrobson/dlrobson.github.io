#!/usr/bin/env sh
set -eux -o pipefail

# Initialize devcontainer environment
# This script is run before the container is built

cd "$(dirname "$0")"

# Create compose.override.yaml if it doesn't exist
touch -a compose.override.yaml

# Extract repository name from git remote URL, falling back to directory name
REPO_NAME=$(git -C .. config --get remote.origin.url 2>/dev/null \
    | sed 's/.*\/\([^/]*\)\.git$/\1/' \
    | sed 's/.*\/\([^/]*\)$/\1/' \
    || basename "$(cd .. && pwd)")

# Recreate .env file with repo name
{
  echo "REPO_NAME=${REPO_NAME}"
} > .env

echo "Devcontainer initialization complete"
