# Commit Quick Reference Card

Quick guide for making conventional commits and releases.

---

## 🚀 Quick Commands

```bash
# Make a commit (interactive)
yarn commit

# Create a release (automatic versioning)
yarn release

# Create specific version bump
yarn release:patch    # 1.0.0 → 1.0.1
yarn release:minor    # 1.0.0 → 1.1.0
yarn release:major    # 1.0.0 → 2.0.0

# Dry run (see what would happen)
yarn release:dry
```

---

## 📝 Commit Types

| Type       | When to Use      | Example                                |
| ---------- | ---------------- | -------------------------------------- |
| `feat`     | New feature      | `feat(auth): add 2FA support`          |
| `fix`      | Bug fix          | `fix(users): resolve validation error` |
| `docs`     | Documentation    | `docs(readme): update setup guide`     |
| `style`    | Code formatting  | `style(core): format with prettier`    |
| `refactor` | Code restructure | `refactor(api): simplify routes`       |
| `perf`     | Performance      | `perf(db): optimize queries`           |
| `test`     | Tests            | `test(auth): add login tests`          |
| `build`    | Build system     | `build(docker): update dockerfile`     |
| `ci`       | CI/CD            | `ci(github): add workflow`             |
| `chore`    | Maintenance      | `chore(deps): update dependencies`     |

---

## 🎯 Common Scopes

**Services:**

- `auth`, `users`, `city`, `core`, `notification`, `scheduler`, `integration`

**Libraries:**

- `prisma`, `logger`, `redis`, `rabbitmq`, `jwt`, `metrics`, `monitoring`, `health`

**Infrastructure:**

- `docker`, `k8s`, `ci`, `build`, `deps`

**Other:**

- `api`, `config`, `scripts`, `docs`

---

## ✍️ Commit Message Format

```
<type>(<scope>): <short description>

[optional longer description]

[optional footer with breaking changes or issue references]
```

### Examples

**Basic commit:**

```
feat(auth): add JWT refresh token
```

**With body:**

```
fix(prisma): resolve connection leak

Properly close database connections after queries
to prevent pool exhaustion.
```

**With breaking change:**

```
feat(api): change response format

BREAKING CHANGE: API now returns { data, meta } instead of flat object
```

**With issue reference:**

```
fix(users): validate email format

Closes #42
```

---

## 🔄 Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feat/my-feature

# 2. Make changes
# ... code, code, code ...

# 3. Stage changes
git add .

# 4. Commit with commitizen
yarn commit

# 5. Push branch
git push origin feat/my-feature

# 6. Create PR
```

### Creating Release

```bash
# 1. Ensure on main branch
git checkout main
git pull origin main

# 2. Run tests
yarn test:all
yarn lint:all

# 3. Create release
yarn release

# 4. Push with tags
git push --follow-tags origin main
```

---

## 📊 Version Bumping

| Commits Include            | Bump Type | Example       |
| -------------------------- | --------- | ------------- |
| Only `fix`, `perf`         | PATCH     | 1.0.0 → 1.0.1 |
| Any `feat`                 | MINOR     | 1.0.0 → 1.1.0 |
| Any with `BREAKING CHANGE` | MAJOR     | 1.0.0 → 2.0.0 |

---

## ⚡ Shortcuts

```bash
# Stage all and commit
git add . && yarn commit

# Check what would be released
yarn release:dry

# View commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# View all tags
git tag -l
```

---

## 🚫 Don't Forget

- ✅ Use `yarn commit` instead of `git commit`
- ✅ Choose appropriate type and scope
- ✅ Keep descriptions clear and concise
- ✅ Reference issues when applicable
- ✅ Mark breaking changes explicitly
- ✅ Test before committing
- ✅ Push tags after release

---

## 📚 Full Documentation

See [CONTRIBUTING_COMMITS.md](./CONTRIBUTING_COMMITS.md) for complete guide.
