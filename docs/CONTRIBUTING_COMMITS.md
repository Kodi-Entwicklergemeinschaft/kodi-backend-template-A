# Commit Guidelines & Versioning

This project uses **Commitizen** for standardized commit messages and **Standard Version** for automated semantic versioning and CHANGELOG generation.

---

## 📝 Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Examples

```bash
feat(auth): add JWT refresh token functionality
fix(users): resolve email validation bug
docs(readme): update installation instructions
perf(database): optimize query performance
refactor(core): simplify error handling logic
```

---

## 🚀 Making Commits with Commitizen

### Method 1: Using yarn commit (Recommended)

Instead of `git commit`, use:

```bash
# Stage your changes
git add .

# Use commitizen
yarn commit
```

This will launch an interactive CLI that guides you through creating a proper commit message.

### Method 2: Using git cz

```bash
git add .
git cz
```

### Interactive Prompts

1. **Select type** - Choose the type of change:
   - `feat` - A new feature
   - `fix` - A bug fix
   - `docs` - Documentation only changes
   - `style` - Code style changes (formatting, semicolons, etc)
   - `refactor` - Code changes that neither fix a bug nor add a feature
   - `perf` - Performance improvements
   - `test` - Adding or updating tests
   - `build` - Changes to build system or dependencies
   - `ci` - CI/CD configuration changes
   - `chore` - Other changes (maintenance tasks)
   - `revert` - Revert a previous commit

2. **Scope** (optional) - What is the scope of this change?
   - Examples: `auth`, `users`, `city`, `core`, `notification`, `scheduler`, `integration`
   - Examples: `prisma`, `redis`, `rabbitmq`, `docker`, `monitoring`

3. **Short description** - Brief summary of the change

4. **Long description** (optional) - More detailed explanation

5. **Breaking changes** - List any breaking changes

6. **Issues closed** - Reference issues (e.g., "closes #123")

---

## 🎯 Commit Types

| Type       | Description             | CHANGELOG Section   | Version Bump |
| ---------- | ----------------------- | ------------------- | ------------ |
| `feat`     | New feature             | ✨ Features         | MINOR        |
| `fix`      | Bug fix                 | 🐛 Bug Fixes        | PATCH        |
| `perf`     | Performance improvement | ⚡ Performance      | PATCH        |
| `revert`   | Revert previous commit  | ⏪ Reverts          | PATCH        |
| `docs`     | Documentation           | 📚 Documentation    | -            |
| `style`    | Code style/formatting   | 💎 Styles           | -            |
| `refactor` | Code refactoring        | ♻️ Code Refactoring | -            |
| `test`     | Tests                   | ✅ Tests            | -            |
| `build`    | Build system            | 🏗️ Build System     | -            |
| `ci`       | CI/CD                   | 👷 CI/CD            | -            |
| `chore`    | Maintenance             | 🔧 Chores           | -            |

**Breaking Changes:** Any commit with `BREAKING CHANGE:` in the footer triggers a **MAJOR** version bump.

---

## 📦 Releasing with Standard Version

### Automatic Versioning

Standard Version automatically determines the next version based on commit messages:

```bash
# Automatic version bump based on commits
yarn release

# This will:
# 1. Analyze commits since last release
# 2. Determine version bump (major/minor/patch)
# 3. Update package.json version
# 4. Generate/update CHANGELOG.md
# 5. Create a git tag
# 6. Commit changes
```

### Manual Version Control

```bash
# Release a specific version type
yarn release:patch   # 1.0.0 → 1.0.1
yarn release:minor   # 1.0.0 → 1.1.0
yarn release:major   # 1.0.0 → 2.0.0

# First release (doesn't bump version)
yarn release:first

# Dry run (see what would happen)
yarn release:dry
```

### What Standard Version Does

1. ✅ Bumps the version in `package.json`
2. ✅ Updates or creates `CHANGELOG.md`
3. ✅ Commits `package.json` and `CHANGELOG.md`
4. ✅ Tags the commit with the new version
5. ✅ Formats CHANGELOG with emojis and sections

---

## 🔄 Complete Release Workflow

### Step-by-Step Release Process

```bash
# 1. Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# 2. Run tests to ensure everything works
yarn test:all
yarn lint:all

# 3. Stage any final changes
git add .

# 4. Commit using commitizen
yarn commit

# 5. Create release (automatic versioning)
yarn release

# 6. Push changes and tags to remote
git push --follow-tags origin main

# 7. Optional: Publish to npm (if public package)
# npm publish
```

### Pre-release Versions

```bash
# Create pre-release versions
npx standard-version --prerelease alpha
# 1.0.0 → 1.0.1-alpha.0

npx standard-version --prerelease beta
# 1.0.0 → 1.0.1-beta.0
```

---

## 📋 Examples

### Example 1: New Feature

```bash
git add apps/auth/
yarn commit

# Interactive prompts:
# Type: feat
# Scope: auth
# Subject: implement two-factor authentication
# Body: Add TOTP-based 2FA support with QR code generation
# Breaking: No
# Issues: Closes #45

# Result:
# feat(auth): implement two-factor authentication
#
# Add TOTP-based 2FA support with QR code generation
#
# Closes #45
```

### Example 2: Bug Fix

```bash
git add libs/prisma/
yarn commit

# Type: fix
# Scope: prisma
# Subject: resolve connection pool exhaustion
# Body: Increase pool size and add connection timeout handling
# Breaking: No

# Result:
# fix(prisma): resolve connection pool exhaustion
#
# Increase pool size and add connection timeout handling
```

### Example 3: Breaking Change

```bash
git add apps/users/
yarn commit

# Type: feat
# Scope: users
# Subject: change user ID format to UUID v4
# Body: Migrate from integer IDs to UUID v4 for better scalability
# Breaking: Yes
# Breaking description: User IDs are now UUIDs instead of integers. Update all API clients.

# Result:
# feat(users): change user ID format to UUID v4
#
# Migrate from integer IDs to UUID v4 for better scalability
#
# BREAKING CHANGE: User IDs are now UUIDs instead of integers.
# Update all API clients to handle UUID format.
```

---

## 🏷️ Versioning Strategy

We follow [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH

1.2.3
│ │ │
│ │ └─ Patch: Bug fixes, performance improvements
│ └─── Minor: New features (backward compatible)
└───── Major: Breaking changes
```

### Version Bump Rules

| Commits                      | Version Bump | Example       |
| ---------------------------- | ------------ | ------------- |
| Only `fix`, `perf`, `revert` | PATCH        | 1.0.0 → 1.0.1 |
| At least one `feat`          | MINOR        | 1.0.0 → 1.1.0 |
| Any with `BREAKING CHANGE`   | MAJOR        | 1.0.0 → 2.0.0 |

---

## 📝 CHANGELOG Format

The generated CHANGELOG will look like:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-10-30

### ✨ Features

- **auth**: implement two-factor authentication (#45)
- **notification**: add Slack integration

### 🐛 Bug Fixes

- **prisma**: resolve connection pool exhaustion
- **redis**: fix cache invalidation logic

### ♻️ Code Refactoring

- **core**: simplify error handling logic

### 📚 Documentation

- **readme**: update installation instructions
```

---

## 🛠️ Configuration Files

### `.versionrc.json`

Standard Version configuration:

```json
{
  "types": [
    { "type": "feat", "section": "✨ Features" },
    { "type": "fix", "section": "🐛 Bug Fixes" },
    { "type": "perf", "section": "⚡ Performance Improvements" }
    // ... more types
  ],
  "releaseCommitMessageFormat": "chore(release): {{currentTag}} [skip ci]"
}
```

### `package.json` commitizen config

```json
{
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  }
}
```

---

## 🚫 What NOT to Do

### ❌ Bad Commits

```bash
# Too vague
git commit -m "fix stuff"

# No type
git commit -m "updated readme"

# Unclear scope
git commit -m "feat: new thing"

# Multiple concerns in one commit
git commit -m "feat: add auth + fix bug + update docs"
```

### ✅ Good Commits

```bash
# Clear and specific
feat(auth): add JWT refresh token support

# Proper scope
docs(readme): add installation instructions

# Focused on single concern
fix(users): validate email format before saving
```

---

## 🔍 Viewing Commit History

```bash
# View conventional commits
git log --oneline

# View commits by type
git log --oneline --grep="^feat"
git log --oneline --grep="^fix"

# View commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

---

## 🤝 Team Workflow

### For Developers

1. **Always use `yarn commit`** instead of `git commit`
2. Choose appropriate type and scope
3. Write clear, concise descriptions
4. Reference issue numbers
5. Mark breaking changes explicitly

### For Maintainers

1. Review commit messages in PRs
2. Ensure conventional format
3. Run `yarn release` for new versions
4. Push tags after release: `git push --follow-tags`
5. Review and edit CHANGELOG if needed

---

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Commitizen](https://github.com/commitizen/cz-cli)
- [Standard Version](https://github.com/conventional-changelog/standard-version)
- [Conventional Changelog](https://github.com/conventional-changelog/conventional-changelog)

---

## 💡 Tips

1. **Commit often** - Small, focused commits are better than large ones
2. **Use scopes** - They help organize CHANGELOG
3. **Test before committing** - Run `yarn lint` and `yarn test`
4. **Breaking changes** - Document them thoroughly
5. **Revert commits** - Use `git revert` with proper commit message

---

## ⚙️ CI/CD Integration

The commit format enables:

- ✅ Automated version bumping
- ✅ Automatic CHANGELOG generation
- ✅ Semantic release workflows
- ✅ Automated deployment based on version
- ✅ Skip CI with `[skip ci]` in commit message

---

**Last Updated:** 2025-10-30
