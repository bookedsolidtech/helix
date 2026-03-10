# HELiX: Enterprise Healthcare Web Component Library

**A production-ready Web Component library for healthcare organizations' content hubs, with seamless Drupal integration.**

<!-- Badges -->

![CI Status](https://img.shields.io/github/actions/workflow/status/bookedsolidtech/helix/ci.yml?branch=main&label=CI&logo=github)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?logo=typescript)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?logo=node.js)
![Lit](https://img.shields.io/badge/Lit-3.3.2-324FFF?logo=lit)
![License](https://img.shields.io/badge/license-MIT-blue)
![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1-AA%20compliant-success)
![Bundle Size](https://img.shields.io/badge/bundle%20size-%3C50KB%20gzip-success)

---

## 🎯 Project Overview

HELiX is an enterprise-grade Web Component library built with **Lit 3.x** and **TypeScript**, designed specifically for healthcare organizations building public-facing content hubs on **Drupal CMS**.

### Key Features

- ✅ **Healthcare-First Design**: WCAG 2.1 AA compliant (HHS mandate May 2026), WCAG AAA targets
- ✅ **Drupal-Optimized**: Zero coupling, Drupal-friendly component APIs, complete TWIG examples
- ✅ **Enterprise-Grade**: 100% TypeScript, JSDoc documentation, CEM-driven API docs
- ✅ **Latest Technologies**: Lit 3.x, Storybook 10.x, Turborepo, Astro/Starlight
- ✅ **Dual Documentation**: Storybook (design system) + Starlight (guides & tutorials)

### Tech Stack

| Technology            | Version             | Purpose                            |
| --------------------- | ------------------- | ---------------------------------- |
| **Lit**               | 3.x                 | Web Component framework            |
| **TypeScript**        | 5.x                 | Type safety, documentation         |
| **Storybook**         | 10.x                | Component playground & docs        |
| **Astro + Starlight** | 5.x + 0.37.x        | Documentation hub                  |
| **Vite**              | 6.x                 | Library build (ES modules)         |
| **npm + Turborepo**   | npm 10.x, turbo 2.x | Monorepo management                |
| **Vitest**            | Planned             | Testing (Browser Mode)             |
| **Terrazzo**          | Planned             | Design token build tool (W3C DTCG) |

---

## 📚 Documentation

### **START HERE**: [Build Plan Index](./build-plan/index.md)

The complete build plan is organized into 6 comprehensive documents:

#### Core Architecture (Original Documents)

1. **[Architecture & System Design](./build-plan/02-architecture-and-system-design.md)** (~900 lines)
   - System architecture, monorepo strategy
   - Lit + Storybook integration (2025-2026 latest)
   - Drupal integration architecture
   - Testing strategy (Vitest 4.x)
   - 3-tier design token system (W3C DTCG)

2. **[Component Architecture & Storybook](./build-plan/03-component-architecture-storybook-integration.md)** (2,183 lines)
   - Lit 3.x patterns (Reactive Controllers, ElementInternals)
   - 40+ component library structure
   - Storybook story configuration
   - TypeScript & JSDoc strategy (100% coverage)
   - 4-level accessibility testing

3. **[Design System & Token Architecture](./build-plan/03-design-system-token-architecture.md)** (2,063 lines)
   - W3C DTCG 2025.10 compliant tokens
   - Light/dark/high-contrast modes
   - CSS architecture for Shadow DOM
   - Healthcare accessibility (WCAG AAA)
   - 4-phase implementation roadmap

#### Enhanced Documentation & Integration

4. **[Documentation Hub Architecture](./build-plan/04-documentation-hub-architecture.md)** (~1,200 lines)
   - Astro/Starlight documentation strategy
   - Storybook + Starlight integration
   - CEM-powered API documentation
   - Unified search (Pagefind)
   - Audience segmentation (builders, Drupal teams, designers)

5. **[Component Building Guide](./build-plan/05-component-building-guide.md)** (2,238 lines)
   - Drupal-friendly component patterns
   - 12 complete component specifications with TWIG examples
   - Testing checklist (40+ items)
   - Anti-patterns to avoid
   - Theming guidelines

6. **[Drupal Integration Guide](./build-plan/06-drupal-integration-guide.md)** (~2,100 lines)
   - Library installation (npm, CDN, module)
   - TWIG integration patterns
   - Complete node/field/views templates
   - JavaScript behaviors
   - Performance optimization
   - Troubleshooting guide

**Total Documentation**: 10,000+ lines backed by 44+ authoritative sources

---

## 🏗️ Project Structure

```
helix/
├── README.md                 # This file
├── build-plan/               # Complete planning documents
│   ├── index.md             # Executive summary & document index
│   ├── 02-*.md              # Architecture documents
│   ├── 03-*.md              # Component & design system architecture
│   ├── 04-*.md              # Documentation hub architecture
│   ├── 05-*.md              # Component building guide
│   └── 06-*.md              # Drupal integration guide
│
├── packages/
│   └── hx-library/              # Web Component library (@helixui/library)
│       ├── src/
│       │   ├── components/      # Lit components (hx-button, hx-card, hx-text-input)
│       │   └── styles/          # Design tokens (CSS custom properties)
│       ├── dist/                # Build output (ES module, 24KB)
│       └── custom-elements.json # Generated CEM (1051 lines)
│
├── apps/
│   ├── storybook/               # Storybook 10.x (@helixui/storybook)
│   │   └── .storybook/          # Config, theme, preview
│   └── docs/                    # Astro/Starlight documentation hub
│       ├── src/
│       │   ├── components/      # 13 custom Astro components
│       │   ├── content/docs/    # 34 Starlight content pages
│       │   └── pages/           # 5 standalone showcase pages
│       └── dist/                # Static build output (44 pages)
│
├── build-plan/                  # 6 planning documents (10K+ lines)
└── docs/                        # Original archive
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (npm ships with Node.js)
- Git

### Setup

```bash
git clone https://github.com/bookedsolidtech/helix.git
cd helix
npm install
```

### Development

```bash
# Start everything (library watch + storybook + docs)
npm run dev

# Start Storybook only (port 6006)
npm run dev:storybook

# Start documentation site only
npm run dev:docs

# Start library in watch mode
npm run dev:library
```

### Build

```bash
# Build all packages
npm run build

# Build individually
npm run build:library      # Component library (dist/index.js)
npm run build:storybook    # Storybook static site (apps/storybook/dist/)
npm run build:docs         # Documentation site (apps/docs/dist/)

# Type checking (all packages)
npm run type-check
```

### Vercel Deployment

Each app can be deployed independently with its own Vercel project:

- **Storybook**: Root directory `apps/storybook`, build command `npm run build`, output `dist`
- **Docs site**: Root directory `apps/docs`, build command `npm run build`, output `dist`

---

## 📋 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- Project scaffolding (npm workspaces + Turborepo, TypeScript)
- Design token system (Terrazzo, 3-tier tokens)

### Phase 2: Core Components (Weeks 3-6)

- Atoms (buttons, inputs, badges)
- Molecules (cards, alerts, breadcrumbs)
- Organisms (navigation, headers, hero banners)
- Templates (article, landing page, search results)

### Phase 3: Storybook Integration (Week 7)

- Storybook 10.x installation
- CEM analyzer integration
- Story creation (8 variants per component)
- Accessibility addon configuration

### Phase 4: Testing Infrastructure (Week 8)

- Vitest 4.x Browser Mode setup
- Unit/integration/E2E tests
- Chromatic visual regression
- Accessibility test automation

### Phase 5: Documentation Hub (Weeks 9-10)

- Astro/Starlight setup
- CEM-powered API page generation
- Content migration (guides, tutorials)
- Unified search (Pagefind)

### Phase 6: Drupal Integration & Polish (Weeks 11-12)

- Test Drupal site setup
- TWIG template creation
- JavaScript behaviors
- Final accessibility audit
- Version 1.0.0 release

**See**: [build-plan/index.md](./build-plan/index.md) for detailed roadmap

---

## 🎯 Healthcare Compliance

### WCAG 2.1 AA (Legally Mandated)

- HHS mandate effective **May 2026** (US healthcare)
- EAA effective June 2025 (EU)
- Color contrast: 4.5:1 (text), 3:1 (large text)
- Keyboard navigation
- Screen reader compatibility
- Form accessibility

### WCAG AAA Targets (Best Practice)

- Color contrast: 7:1 (text), 4.5:1 (large text)
- 44x44px touch targets
- Enhanced focus indicators
- High contrast mode support
- Reduced motion support

---

## 🧪 Testing Strategy

### Test Pyramid (Vitest 4.x)

- **60% Unit Tests**: Component logic, utilities (Node environment)
- **30% Integration Tests**: Component rendering, interaction (Browser Mode)
- **10% E2E Tests**: User flows, visual regression (Playwright + Chromatic)

### 4-Level Accessibility Testing

1. **Author-time**: IDE linting (ts-lit-plugin)
2. **Story-time**: Storybook addon-a11y (axe-core)
3. **CI**: Chromatic visual regression + axe tests
4. **Manual**: Quarterly screen reader testing (JAWS, NVDA)

---

## 📖 Documentation Strategy

### Storybook (Design System)

**URL**: `/storybook/`

- Interactive component playground
- Visual regression testing
- Accessibility testing (addon-a11y)
- Design token visualization

**Audience**: Designers, component builders, QA

### Starlight (Documentation Hub)

**URL**: `/` (root)

- Comprehensive guides and tutorials
- Component Building Guide (for front-end devs)
- Drupal Integration Guide (for Drupal teams)
- API reference (auto-generated from CEM)
- Token reference (auto-generated)

**Audience**: Developers, architects, tech leads

### Single Source of Truth

- **CEM** feeds Storybook autodocs + Starlight API pages
- **Storybook demos** embedded in Starlight (no duplication)
- **Token docs** generated from DTCG JSON

---

## 🎨 Design Token System

### 3-Tier Architecture (W3C DTCG Compliant)

**Tier 1: Primitives** (Private)

- Raw color palettes (OKLCH)
- Base spacing (4px grid)
- Base typography (Major Third scale)

**Tier 2: Semantic** (Public API)

- Surface, text, interactive, feedback colors
- Spacing tokens (inset/stack/inline)
- Typography composites

**Tier 3: Component** (Overrides)

- Component-specific tokens
- 3-level fallback chain

### Theme Modes

- Light mode (default)
- Dark mode
- High contrast light (WCAG AAA)
- High contrast dark (WCAG AAA)

**See**: [build-plan/03-design-system-token-architecture.md](./build-plan/03-design-system-token-architecture.md)

---

## 🔌 Drupal Integration

### Installation Methods

1. **npm package** (recommended for version control)
2. **CDN delivery** (self-hosted for healthcare production)
3. **Drupal module wrapper** (optional convenience layer)

### Integration Points

- TWIG templates (component usage)
- Drupal behaviors (event handling)
- Theme CSS (token customization)
- Field formatters (optional PHP layer)

### Example: Article Teaser

```twig
{# node--article--teaser.html.twig #}
<wc-card
  variant="default"
  elevation="raised"
  href="{{ url }}"
>
  <img slot="image" src="{{ image_url }}" alt="{{ image_alt }}">
  <span slot="heading">{{ node.label }}</span>
  {{ node.body.summary }}
</wc-card>
```

> **Note**: Build plan documents use the `chc-` prefix (Content Health Component) from the planning phase. The prototype implementation uses `wc-` as the component prefix. Final prefix will be determined before v1.0.

**See**: [build-plan/06-drupal-integration-guide.md](./build-plan/06-drupal-integration-guide.md)

---

## 🏢 Interview Preparation (Monday, Feb 17)

### Key Talking Points

1. **CEM as Single Source of Truth** - eliminates documentation drift
2. **Healthcare Compliance Leadership** - WCAG AAA targets, HHS mandate awareness
3. **Drupal-First Integration Strategy** - zero coupling, TWIG examples
4. **Enterprise-Grade Architecture** - 3-tier CSS token fallback, TypeScript strict, Storybook 10.x
5. **Dual Documentation System** - Storybook + Starlight with unified search
6. **Latest 2025-2026 Technologies** - Reactive Controllers, ElementInternals, OKLCH colors
7. **Production-Ready Testing** - 60/30/10 pyramid, visual regression, accessibility automation

### Demo Points

- "I've created a 6-document comprehensive build plan (10,000+ lines)"
- "Deep research with 44+ authoritative sources"
- "Architecture decisions documented with rationale"
- "Complete component specifications with TWIG examples"
- "Healthcare compliance understanding (HHS May 2026 mandate)"

**See**: [build-plan/index.md](./build-plan/index.md) - Interview Preparation section

---

## 📚 Resources

### Official Documentation

- [Lit 3.x](https://lit.dev)
- [Storybook 10.x](https://storybook.js.org)
- [Astro 5.x](https://astro.build)
- [Starlight](https://starlight.astro.build)
- [Drupal 10.3+](https://drupal.org)

### Specifications

- [W3C DTCG Spec 2025.10](https://tr.designtokens.org/format/)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [Shadow DOM](https://dom.spec.whatwg.org/#shadow-trees)

### Healthcare Compliance

- [HHS Accessibility Mandate (May 2026)](https://www.hhs.gov/civil-rights/for-providers/compliance-enforcement/digital-accessibility/)
- [European Accessibility Act (June 2025)](https://ec.europa.eu/social/main.jsp?catId=1202)

---

## 🤝 Contributing

Phase 0 prototype is complete. Component scaling begins after Monday's interview (Feb 17, 2026).

### Contribution Guidelines

- Follow TypeScript strict mode
- 100% JSDoc coverage required
- All components must pass WCAG 2.1 AA automated tests
- Include Storybook stories (8 variants minimum)
- Include unit tests (Vitest)
- Update TWIG examples in Component Building Guide

---

## 📄 License

MIT

---

## 📞 Contact

**Project Lead**: [@himerus](https://github.com/himerus)
**Interview Date**: Monday, February 17, 2026
**Purpose**: Tech Lead position - Healthcare Web Component Library

---

**Last Updated**: February 14, 2026
**Status**: Phase 0 Prototype Complete

---

## Project Status

- ✅ **Planning Phase**: Complete (6 comprehensive documents, 10K+ lines)
- ✅ **Phase 0 Prototype**: Complete (3 components validating architecture)
  - `hx-button` - Form association, 3 variants, 3 sizes, ElementInternals
  - `hx-card` - 5 slots, 3 variants, 3 elevations, interactive mode
  - `hx-text-input` - Full form lifecycle, validation, prefix/suffix slots
- ✅ **Storybook**: Configured with addon-a11y, autodocs, custom theme
- ✅ **Documentation Site**: 44 pages, 5 standalone showcase pages, Pagefind search
- ⏳ **Testing Infrastructure**: Vitest Browser Mode (Phase 1)
- ⏳ **Token Pipeline**: W3C DTCG via Terrazzo (Phase 1)
- ⏳ **Component Scaling**: 40+ components (Phase 2-3)
- ⏳ **Drupal Integration Testing**: SDC + TWIG (Phase 6)

**Total Planning Documentation**: 10,000+ lines across 6 documents
**Research Sources**: 44+ authoritative references
**Prototype Validation**: Architecture proven end-to-end (Lit -> CEM -> Storybook -> Docs)

---

**For complete planning details, start with**: [build-plan/index.md](./build-plan/index.md)
