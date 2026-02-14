---
title: Drupal Integration Overview
description: How WC-2026 web components integrate with Drupal CMS
---

WC-2026 components are designed for **zero-coupling** Drupal integration. The library works with Drupal 10/11 without requiring custom modules or PHP changes.

## Integration Architecture

```
┌─────────────────────────────────────────┐
│              Drupal CMS                 │
│  Content types, fields, views, blocks   │
├─────────────────────────────────────────┤
│            TWIG Templates               │
│  Render content using WC-2026 tags      │
├─────────────────────────────────────────┤
│         Drupal Behaviors                │
│  Initialize components, handle events   │
├─────────────────────────────────────────┤
│            WC-2026 Library              │
│  CDN or npm distribution, auto-upgrade  │
└─────────────────────────────────────────┘
```

## Integration Methods

| Method | Best For | Setup Time |
|--------|----------|------------|
| **CDN** | Quick prototyping, small sites | Minutes |
| **npm** | Custom themes, full control | Hours |
| **Module** | Enterprise, multi-site | Days |

## Key Benefits

1. **No PHP code changes** - Components work via HTML/TWIG
2. **No custom modules** - Standard TWIG template overrides
3. **Progressive enhancement** - Content remains accessible without JS
4. **Drupal Behaviors** - Full lifecycle integration
5. **Zero coupling** - Library updates don't break Drupal

## Detailed Guide

For the complete Drupal integration specification (98,000+ words), see the [Pre-Planning: Drupal Integration Guide](/pre-planning/drupal-guide/).

## Next Steps

- [Installation](/drupal-integration/installation/) - Add WC-2026 to your Drupal site
- [TWIG Patterns](/drupal-integration/twig/) - Template examples
- [Behaviors](/drupal-integration/behaviors/) - JavaScript integration
