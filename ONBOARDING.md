# Developer Onboarding Guide

**Goal**: Get any developer from zero to productive in under 5 minutes

---

## 🚀 1-Click Installation

### Prerequisites Check Script

Run this first to verify you have the required tools:

```bash
curl -fsSL https://raw.githubusercontent.com/himerus/wc-2026/main/scripts/check-prerequisites.sh | bash
```

The script checks for:

- ✅ Node.js 20.x (via nvm)
- ✅ npm 10.x
- ✅ Git 2.x
- ✅ Code editor (VS Code, Cursor, etc.)

If anything is missing, it provides installation instructions.

### One-Command Setup

```bash
curl -fsSL https://raw.githubusercontent.com/himerus/wc-2026/main/scripts/setup.sh | bash
```

This single command:

1. Clones the repository
2. Checks out the main branch
3. Installs Node.js 20.x via nvm
4. Installs all npm dependencies
5. Builds all packages
6. Verifies the setup (type-check, build)
7. Starts the dev server

**Total time**: ~2-3 minutes

---

## 📋 Manual Setup (If Preferred)

### Step 1: Clone Repository

```bash
git clone https://github.com/himerus/wc-2026.git
cd wc-2026
```

### Step 2: Use Correct Node Version

```bash
nvm use
# Automatically reads .nvmrc and switches to Node 20.x
# If Node 20.x not installed: nvm install 20
```

### Step 3: Install Dependencies

```bash
npm install
# Installs all workspace dependencies via Turborepo
```

### Step 4: Verify Installation

```bash
npm run type-check
# Should show: ✓ 1 successful, 0 cached, 1 total
```

### Step 5: Start Development

```bash
npm run dev:docs
# Documentation hub: http://localhost:4321
```

---

## 🛠️ Development Workflow

### Daily Commands

```bash
# Start documentation site
npm run dev:docs

# Start all apps (docs + storybook when ready)
npm run dev

# Type-check all packages
npm run type-check

# Build all packages
npm run build

# Clean all build artifacts
npm run clean
```

### Package-Specific Commands

```bash
# Work on docs only
cd apps/docs
npm run dev

# Work on Storybook (Phase 3)
cd apps/storybook
npm run dev

# Work on WC library (Phase 2)
cd packages/wc-library
npm run dev
```

---

## 📁 Project Structure Overview

```
wc-2026/
├── apps/
│   ├── docs/              # Documentation hub (Astro/Starlight)
│   │   └── npm run dev    # → http://localhost:4321
│   └── storybook/         # Component playground (Phase 3)
│       └── npm run dev    # → http://localhost:6006
├── packages/
│   └── wc-library/        # Web Component library (Phase 2)
│       └── npm run dev    # → Watches and rebuilds
├── build-plan/            # Planning documents (archived)
├── scripts/               # Setup and utility scripts
└── package.json           # Root workspace configuration
```

---

## 🎯 Where to Start

### For Documentation Writers

1. Navigate to `apps/docs/src/content/docs/`
2. Edit markdown/MDX files
3. Changes hot-reload at `http://localhost:4321`

### For Component Developers (Phase 2)

1. Navigate to `packages/wc-library/src/components/`
2. Create new Lit components
3. Run `npm run dev` to watch and rebuild

### For Storybook Authors (Phase 3)

1. Navigate to `apps/storybook/stories/`
2. Create `.stories.ts` files for components
3. Changes hot-reload at `http://localhost:6006`

---

## 🔧 IDE Setup

### VS Code (Recommended)

**Required Extensions** (installed automatically via workspace recommendations):

- [Astro](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

**Settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[astro]": {
    "editor.defaultFormatter": "astro-build.astro-vscode"
  },
  "files.associations": {
    "*.css": "css"
  }
}
```

### Cursor

Same extensions and settings as VS Code.

---

## 🧪 Testing Your Changes

### Before Committing

```bash
# Type-check
npm run type-check

# Build
npm run build

# Lint (when configured)
npm run lint
```

All checks should pass before pushing.

### Continuous Integration

GitHub Actions runs these checks on every PR:

- Type checking
- Build verification
- Lint (when configured)
- Visual regression tests (Chromatic, Phase 4)

---

## 📝 Git Workflow

### Branch Naming

- `feature/your-feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/description` - Documentation changes
- `chore/description` - Tooling, dependencies

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new component for content cards
fix: correct dark mode color in hero section
docs: update installation guide
chore: upgrade astro to 5.2.0
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes, commit frequently
3. Push branch to GitHub
4. Open PR with description of changes
5. Wait for CI checks to pass
6. Request review from team
7. Address feedback
8. Merge when approved

---

## 🐛 Troubleshooting

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### "Port already in use"

```bash
# Kill process using port 4321
lsof -ti:4321 | xargs kill -9

# Or use a different port
npm run dev:docs -- --port 4322
```

### Type errors after updating dependencies

```bash
# Rebuild all packages
npm run clean
npm run build
```

### Git merge conflicts

```bash
# Always pull latest from main first
git checkout main
git pull origin main

# Rebase your feature branch
git checkout feature/your-branch
git rebase main

# Resolve conflicts, then
git rebase --continue
```

---

## 🆘 Getting Help

### Documentation

- [Astro Docs](https://docs.astro.build/)
- [Starlight Docs](https://starlight.astro.build/)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Lit Docs](https://lit.dev/docs/) (Phase 2)
- [Storybook Docs](https://storybook.js.org/docs) (Phase 3)

### Team Communication

- **Slack**: #wc-2026-dev channel
- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests

### Code Review

- Tag `@frontend-team` for UI/UX changes
- Tag `@platform-team` for infrastructure changes
- Tag `@docs-team` for documentation changes

---

## 🎓 Learning Resources

### New to the Stack?

**Astro** (2 hours):

- [Astro Tutorial](https://docs.astro.build/en/tutorial/0-introduction/)
- [Astro in 100 Seconds](https://www.youtube.com/watch?v=dsTXcSeAZq8)

**Lit** (3 hours, Phase 2):

- [Lit Tutorial](https://lit.dev/tutorials/)
- [Web Components Crash Course](https://www.youtube.com/watch?v=PCWaFLy3VUo)

**Storybook** (2 hours, Phase 3):

- [Storybook Tutorial](https://storybook.js.org/tutorials/)
- [Storybook in 100 Seconds](https://www.youtube.com/watch?v=gdlTFPebzAU)

**Turborepo** (1 hour):

- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)

---

## 🎉 You're Ready!

Run this to verify everything works:

```bash
npm run dev:docs
```

Visit `http://localhost:4321` and you should see the stunning documentation homepage.

**Welcome to the team! 🚀**
