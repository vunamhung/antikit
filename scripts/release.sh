#!/bin/bash
# Helper script to release a new version
# Usage: ./scripts/release.sh

set -e

echo "🚀 Starting release process..."

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: v$CURRENT_VERSION"

# Check if tag already exists
if git rev-parse "v$CURRENT_VERSION" >/dev/null 2>&1; then
  echo "⚠️  Tag v$CURRENT_VERSION already exists locally"
  
  # Check if tag exists on remote
  if git ls-remote --tags origin | grep -q "refs/tags/v$CURRENT_VERSION"; then
    echo "✅ Tag already pushed to remote"
    exit 0
  else
    echo "📤 Pushing existing tag to remote..."
    git push origin "v$CURRENT_VERSION"
    echo "✅ Tag pushed successfully!"
    exit 0
  fi
fi

# Create new tag
echo "🏷️  Creating tag v$CURRENT_VERSION..."
git tag -a "v$CURRENT_VERSION" -m "Release v$CURRENT_VERSION"

# Push tag to remote
echo "📤 Pushing tag to remote..."
git push origin "v$CURRENT_VERSION"

echo "✅ Release v$CURRENT_VERSION completed!"
echo "🔗 Check GitHub Actions: https://github.com/vunamhung/antikit/actions"
echo "🔗 After workflow completes, check release: https://github.com/vunamhung/antikit/releases/tag/v$CURRENT_VERSION"
