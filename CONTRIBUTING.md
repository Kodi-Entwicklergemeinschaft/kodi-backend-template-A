# Contributing to KODI Microservices

Thank you for considering contributing to KODI! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/kodi.microservices.git`
3. Add upstream remote: `git remote add upstream https://github.com/ORIGINAL/kodi.microservices.git`
4. Follow the setup instructions in `GETTING_STARTED.md`

## Development Workflow

### 1. Create a Branch

Use descriptive branch names:

```bash
# Feature branch
git checkout -b feature/add-user-profile

# Bug fix branch
git checkout -b fix/auth-token-expiry

# Documentation
git checkout -b docs/update-readme
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update tests if needed
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run linter
yarn lint

# Run tests
yarn test

# Run with coverage
yarn test:cov
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat(auth): add password reset functionality"

# Bug fix
git commit -m "fix(users): resolve pagination bug"

# Documentation
git commit -m "docs: update API examples in README"

# Refactor
git commit -m "refactor(redis): simplify connection logic"

# Performance
git commit -m "perf(database): add index on user email"

# Tests
git commit -m "test(auth): add unit tests for login"
```

**Commit Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies
- `ci`: CI/CD changes

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub
```

## Pull Request Guidelines

### PR Title

Use conventional commit format:

```
feat(service): description of change
```

### PR Description

Include:

- **What**: What does this PR do?
- **Why**: Why is this change needed?
- **How**: How does it work?
- **Testing**: How was it tested?
- **Screenshots**: If applicable

**Template:**

```markdown
## What

Brief description of the change

## Why

Reason for the change

## How

Technical details

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] All tests passing

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Code Style Guidelines

### TypeScript

```typescript
// Use explicit types
function getUser(id: string): Promise<User> {
  return this.prisma.user.findUnique({ where: { id } });
}

// Use async/await, not callbacks
async function fetchData() {
  const data = await getData();
  return data;
}

// Prefer const over let
const name = 'John';

// Use descriptive variable names
const userEmail = 'user@example.com'; // Good
const e = 'user@example.com'; // Bad

// Use template literals
const message = `Hello, ${name}!`; // Good
const message = 'Hello, ' + name + '!'; // Bad
```

### File Structure

```
service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health.controller.ts
│   └── modules/
│       └── feature/
│           ├── feature.module.ts
│           ├── feature.controller.ts
│           ├── feature.service.ts
│           ├── feature.service.spec.ts
│           └── dto/
│               ├── index.ts
│               ├── create-feature.dto.ts
│               └── update-feature.dto.ts
```

### Naming Conventions

- **Files**: kebab-case (e.g., `user-profile.service.ts`)
- **Classes**: PascalCase (e.g., `UserProfileService`)
- **Interfaces**: PascalCase with `I` prefix optional (e.g., `User` or `IUser`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Functions/Methods**: camelCase (e.g., `getUserById`)
- **Variables**: camelCase (e.g., `userName`)

### Comments

```typescript
// Good: Explain WHY, not WHAT
// Use Redis to prevent duplicate submissions within 5 minutes
await this.redis.set(`submission:${id}`, '1', 300);

// Bad: States the obvious
// Set redis key
await this.redis.set(`submission:${id}`, '1', 300);

// Good: Document complex algorithms
/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Implementation
}
```

## Adding a New Feature

### 1. New Endpoint

```typescript
// 1. Create DTO
// src/modules/feature/dto/create-feature.dto.ts
export class CreateFeatureDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// 2. Update service
// src/modules/feature/feature.service.ts
async create(dto: CreateFeatureDto) {
  return this.prisma.feature.create({ data: dto });
}

// 3. Update controller
// src/modules/feature/feature.controller.ts
@Post()
async create(@Body() dto: CreateFeatureDto) {
  return this.featureService.create(dto);
}

// 4. Add tests
// src/modules/feature/feature.service.spec.ts
it('should create a feature', async () => {
  const dto = { name: 'Test' };
  const result = await service.create(dto);
  expect(result.name).toBe('Test');
});
```

### 2. New Service

```bash
# Create service directory
mkdir -p apps/new-service/src/modules/feature

# Copy structure from existing service (e.g., users)
cp -r apps/users/package.json apps/new-service/
cp -r apps/users/tsconfig.app.json apps/new-service/
cp -r apps/users/src/main.ts apps/new-service/src/
cp -r apps/users/src/app.module.ts apps/new-service/src/

# Update package.json and imports
# Add to nest-cli.json
# Add to docker compose files
```

### 3. New Shared Library

```bash
# Create library
mkdir -p libs/new-lib/src

# Create package.json, tsconfig.lib.json, module, service, index.ts
# Follow structure of existing libs
# Update tsconfig.json paths
# Update nest-cli.json projects
```

## Testing Guidelines

### Unit Tests

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.user, 'create').mockResolvedValue({
      id: '1',
      email: dto.email,
      ...otherFields,
    });

    const result = await service.register(dto);
    expect(result.user.email).toBe(dto.email);
  });
});
```

### Integration Tests

```typescript
describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.user.email).toBe('test@example.com');
        expect(res.body.accessToken).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Documentation

- Update `README.md` for major changes
- Update `GETTING_STARTED.md` if setup process changes
- Add JSDoc comments for public APIs
- Update API examples if endpoints change

## Review Process

1. **Automated Checks**: All CI checks must pass
   - Linting
   - Tests
   - Build

2. **Code Review**: At least one approval required
   - Code quality
   - Test coverage
   - Documentation

3. **Testing**: Reviewer should test locally if applicable

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions creates release

## Questions?

- Create an issue for bugs
- Start a discussion for questions
- Join our community chat (link here)

## License

By contributing, you agree that your contributions will be licensed under the EUPL-1.2, the same license as the project (see [LICENSE](LICENSE)).

---

Thank you for contributing to KODI! 🙏
