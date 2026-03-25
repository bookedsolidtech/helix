# @helixui/create

TUI-powered CLI scaffolder for HELiX enterprise web component projects.

## Usage

```bash
# Interactive mode
npm create @helixui/create

# Or via npx
npx @helixui/create

# Pre-fill project name
npx @helixui/create my-app
```

## Drupal Theme Scaffolding

Use the `--drupal` flag to scaffold a Drupal theme with HELiX SDCs instead of a JavaScript framework project.

```bash
# Interactive Drupal flow
npx @helixui/create --drupal

# Non-interactive with preset
npx @helixui/create --drupal --preset healthcare
```

### `--preset` Option

Selects the SDC set to scaffold. Valid values:

| Value | Description |
|-------|-------------|
| `standard` | Core Drupal SDCs — general-purpose baseline |
| `blog` | Standard + editorial content components |
| `healthcare` | Blog + patient-facing healthcare components |
| `intranet` | Standard + employee portal components |

Passing an invalid preset name prints an error and exits with code 1:

```
Invalid preset: "foo". Valid presets: standard, blog, healthcare, intranet
```

See [docs/drupal-presets.md](./docs/drupal-presets.md) for full documentation.

## Framework Support

When run without `--drupal`, the CLI prompts for a JavaScript framework:

| Framework | Description |
|-----------|-------------|
| `react-next` | Next.js 15 App Router |
| `react-vite` | React + Vite |
| `vue-nuxt` | Nuxt 3 |
| `vue-vite` | Vue 3 + Vite |
| `svelte-kit` | SvelteKit |
| `angular` | Angular 19 |
| `astro` | Astro |
| `vanilla` | Vanilla JS (CDN) |

## Requirements

- Node.js >= 20.0.0
- pnpm, npm, or yarn

## License

MIT
