---
title: Drupal Behaviors
description: Using Drupal Behaviors with HELIX web components
---

Drupal Behaviors provide lifecycle hooks for initializing JavaScript on page load, AJAX responses, and BigPipe streaming. HELIX components integrate cleanly with this system.

## Basic Behavior

```javascript
(function (Drupal) {
  'use strict';

  Drupal.behaviors.wcComponents = {
    attach(context) {
      // Initialize any HELIX components in the context
      const cards = context.querySelectorAll('wc-card:not([data-initialized])');
      cards.forEach((card) => {
        card.setAttribute('data-initialized', 'true');
        // Additional initialization if needed
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // Cleanup when elements are removed
        const cards = context.querySelectorAll('wc-card[data-initialized]');
        cards.forEach((card) => {
          card.removeAttribute('data-initialized');
        });
      }
    },
  };
})(Drupal);
```

## Event Handling

```javascript
Drupal.behaviors.wcEvents = {
  attach(context) {
    // Listen for HELIX custom events
    context.querySelectorAll('wc-accordion').forEach((accordion) => {
      accordion.addEventListener('wc-toggle', (e) => {
        // Track analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'accordion_toggle', {
            panel: e.detail.panel,
            open: e.detail.open,
          });
        }
      });
    });
  },
};
```

## AJAX Integration

HELIX components work with Drupal AJAX automatically because:

1. Components use standard HTML tags (no framework dependency)
2. `Drupal.behaviors.attach()` re-runs on AJAX-loaded content
3. Custom Elements upgrade automatically when added to DOM

## BigPipe Streaming

No special handling is needed. Components register via `customElements.define()` and upgrade as they enter the DOM through BigPipe streaming.

## Detailed Guide

See the [Pre-Planning: Drupal Integration Guide](/pre-planning/drupal-guide/) for advanced Behaviors patterns.
