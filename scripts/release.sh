#!/usr/bin/env bash
set -euo pipefail

level="${1:-patch}"

if [[ "$level" != "patch" && "$level" != "minor" && "$level" != "major" ]]; then
  echo "Usage: npm run release [patch|minor|major]"
  exit 1
fi

branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$branch" != "main" ]]; then
  echo "🚫 Must be on main branch (current: $branch)"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "🚫 Working tree not clean. Commit or stash first."
  exit 1
fi

git pull --ff-only

npm version "$level"
git push --no-verify
git push --tags

echo "✅ Released $(node -p "require('./package.json').version") — GitHub Actions will publish to npm"
