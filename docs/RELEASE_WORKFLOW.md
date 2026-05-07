# Release Workflow Guide

Complete guide for releasing features and bug fixes in KODI Microservices.

---

## 📋 Quick Reference

### Committing Changes

```bash
# Always use commitizen for commits
yarn commit
```

### Creating Releases

```bash
# Automatic versioning based on commits
yarn release

# Manual version control
yarn release:patch   # 1.0.0 → 1.0.1
yarn release:minor   # 1.0.0 → 1.1.0
yarn release:major   # 1.0.0 → 2.0.0

# Dry run (preview)
yarn release:dry
```

---

## 🔄 Complete Release Process

### Step-by-Step Release Workflow

```bash
# 1. Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# 2. Run all checks to ensure everything works
yarn lint
yarn test

# 3. Create release (automatically bumps version and updates CHANGELOG)
yarn release

# 4. Push changes and tags to remote
git push --follow-tags origin main
```

**What `yarn release` does automatically:**

- ✅ Analyzes commits since last release
- ✅ Determines version bump (major/minor/patch)
- ✅ Updates `package.json` version
- ✅ Generates/updates `CHANGELOG.md`
- ✅ Creates a git tag
- ✅ Commits changes

---

## ✨ Completing a Feature

### Pre-Commit Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass (`yarn test`)
- [ ] Linting passes (`yarn lint`)
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or properly documented)
- [ ] Changes tested manually

### Commit Process

```bash
# 1. Stage your changes
git add .

# 2. Commit using commitizen
yarn commit

# 3. Follow the prompts:
#    - Type: feat
#    - Scope: (service/lib name, e.g., auth, users, prisma)
#    - Subject: brief description
#    - Body: detailed explanation (optional)
#    - Breaking changes: No (or Yes with description)
#    - Issues: Reference issue numbers if applicable
```

### Example Feature Commit

```
feat(auth): implement two-factor authentication

Add TOTP-based 2FA support with QR code generation and validation.
Includes new endpoints for enabling/disabling 2FA.

Closes #45
```

### Version Impact

- **Feature commits (`feat`)** → **MINOR** version bump (1.0.0 → 1.1.0)
- **Feature with breaking changes** → **MAJOR** version bump (1.0.0 → 2.0.0)

---

## 🐛 Fixing a Bug

### Pre-Commit Checklist

- [ ] Bug is reproducible
- [ ] Root cause identified
- [ ] Fix implemented and tested
- [ ] Unit tests added/updated for the fix
- [ ] Regression tests pass
- [ ] Linting passes (`yarn lint`)

### Commit Process

```bash
# 1. Stage your changes
git add .

# 2. Commit using commitizen
yarn commit

# 3. Follow the prompts:
#    - Type: fix
#    - Scope: (affected service/lib)
#    - Subject: brief description of the bug fix
#    - Body: explanation of the fix and root cause (optional)
#    - Breaking changes: No
#    - Issues: Reference bug issue number
```

### Example Bug Fix Commit

```
fix(users): resolve email validation bug

Email validation was incorrectly rejecting valid emails with plus signs.
Fixed regex pattern to properly handle RFC 5322 compliant email addresses.

Closes #123
```

### Version Impact

- **Bug fixes (`fix`)** → **PATCH** version bump (1.0.0 → 1.0.1)

---

## 🚀 Creating a Release

### When to Release

- After completing a feature
- After fixing critical bugs
- When ready to deploy to production
- On a regular schedule (e.g., weekly, bi-weekly)

### Release Workflow

```bash
# 1. Switch to main branch and pull latest
git checkout main
git pull origin main

# 2. Verify all changes are committed
git status

# 3. Run full test suite
yarn lint
yarn test

# 4. Create release (this does everything automatically)
yarn release

# The command will:
# - Determine version bump from commit messages
# - Update package.json
# - Update CHANGELOG.md
# - Create git tag
# - Commit changes

# 5. Push changes and tags
git push --follow-tags origin main

# 6. (Optional) Create GitHub release from the tag
```

### Manual Version Control

If you need to force a specific version type:

```bash
# Force patch version
yarn release:patch

# Force minor version
yarn release:minor

# Force major version
yarn release:major
```

### Preview Release

Before creating an actual release, preview what would happen:

```bash
yarn release:dry
```

This shows what version would be created and what would be in the CHANGELOG without actually making changes.

---

## 📊 Version Bumping Rules

Standard Version automatically determines the version bump based on commit messages:

| Commits Include                    | Bump Type | Example       |
| ---------------------------------- | --------- | ------------- |
| Only `fix`, `perf`, `revert`       | PATCH     | 1.0.0 → 1.0.1 |
| At least one `feat`                | MINOR     | 1.0.0 → 1.1.0 |
| Any commit with `BREAKING CHANGE:` | MAJOR     | 1.0.0 → 2.0.0 |

**Important:** Only commits since the last release are analyzed.

---

## 📝 Commit Message Guidelines

### Required Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types

- `feat`: New feature (MINOR bump)
- `fix`: Bug fix (PATCH bump)
- `perf`: Performance improvement (PATCH bump)
- `docs`: Documentation only (no version bump)
- `style`: Code formatting (no version bump)
- `refactor`: Code restructuring (no version bump)
- `test`: Test additions/changes (no version bump)
- `chore`: Maintenance tasks (no version bump)
- `build`: Build system changes (no version bump)
- `ci`: CI/CD changes (no version bump)

### Common Scopes

**Services:** `auth`, `users`, `city`, `core`, `notification`, `scheduler`, `integration`

**Libraries:** `prisma`, `logger`, `redis`, `rabbitmq`, `jwt`, `metrics`, `monitoring`, `health`

**Infrastructure:** `docker`, `ci`, `build`, `deps`, `config`, `scripts`

---

## ✅ Pre-Release Checklist

Before running `yarn release`, ensure:

- [ ] All code changes are committed
- [ ] All tests pass (`yarn test`)
- [ ] Linting passes (`yarn lint`)
- [ ] No merge conflicts
- [ ] Branch is up to date with main
- [ ] Commit messages follow conventional format
- [ ] Breaking changes are documented
- [ ] Documentation is updated (if needed)

---

## 🔍 Verifying Releases

### Check Current Version

```bash
# View package.json
cat package.json | grep version

# Or view latest tag
git describe --tags --abbrev=0
```

### View Release History

```bash
# View all tags
git tag -l

# View commits since last release
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# View CHANGELOG
cat CHANGELOG.md
```

---

## 🚨 Handling Breaking Changes

### How to Document Breaking Changes

When committing a breaking change, include `BREAKING CHANGE:` in the commit footer:

```
feat(api): change response format

BREAKING CHANGE: API now returns { data, meta } instead of flat object.
Update all API clients to handle the new response structure.
```

### Impact

- Breaking changes trigger a **MAJOR** version bump
- They appear prominently in the CHANGELOG
- They notify consumers of the need to update their code

---

## 🎯 Best Practices

### For Features

1. **One feature per commit** - Keep commits focused
2. **Test thoroughly** - Add/update unit and integration tests
3. **Update documentation** - Especially for new APIs
4. **Consider backwards compatibility** - Avoid breaking changes when possible
5. **Reference issues** - Link to related issues/tickets

### For Bug Fixes

1. **Reproduce first** - Ensure the bug is understood
2. **Add regression tests** - Prevent the bug from returning
3. **Explain the fix** - Document why the fix works
4. **Test edge cases** - Ensure fix doesn't break other functionality
5. **Reference bug reports** - Link to the reported issue

### For Releases

1. **Review CHANGELOG** - Ensure generated changelog is accurate
2. **Test before releasing** - Run full test suite
3. **Push tags immediately** - Don't forget `--follow-tags`
4. **Communicate** - Notify team of new releases
5. **Monitor deployment** - Watch for issues after release

---

## 📚 Additional Resources

- [Commit Quick Reference](./COMMIT_QUICK_REFERENCE.md) - Quick command reference
- [Contributing Commits Guide](./CONTRIBUTING_COMMITS.md) - Detailed commit guidelines
- [Contributing Guide](../CONTRIBUTING.md) - General contribution guidelines

---

**Remember:** Always use `yarn commit` instead of `git commit` to ensure proper commit formatting!
