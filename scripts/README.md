# Release Scripts

Helper scripts for managing releases.

## Usage

### Auto Release & Push Tag

After running `npm run release`, use this to automatically push the tag:

```bash
npm run release:push
```

Or run directly:

```bash
./scripts/release.sh
```

## Full Release Workflow

1. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: your feature"
   ```

2. **Create release** (bump version, update CHANGELOG, create tag)
   ```bash
   npm run release
   ```

3. **Push everything**
   ```bash
   git push origin main
   npm run release:push
   ```

The `release:push` script will:
- Read current version from package.json
- Create tag if not exists
- Push tag to remote
- Trigger GitHub Actions workflow
- Create GitHub Release & publish to NPM

## GitHub Actions

When a tag is pushed (e.g., `v1.15.0`), the workflow will:
1. ✅ Checkout code
2. ✅ Setup Node.js
3. ✅ Install dependencies
4. ✅ Publish to NPM
5. ✅ Create GitHub Release with auto-generated notes

Check workflow status: https://github.com/vunamhung/antikit/actions
