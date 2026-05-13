---
title: Integration Architecture Decisions
description: Architecture Decision Records for the HELiX web component system covering composition, delivery, attribute safety, and rendering strategy.
sidebar:
  order: 0
  label: ADRs Overview
---

This section documents the four foundational architecture decisions that shape how HELiX components are composed, delivered, named, and rendered inside Drupal and other enterprise consumers. Each ADR captures the problem it solves, the alternatives considered, and the recommended pattern.

## The four decisions

| ADR | Topic | Question answered |
| --- | --- | --- |
| [Slots vs Props](/architecture/adrs/slots-vs-props/) | Composition | Does the component or Drupal control rendering? |
| [Component Loading](/architecture/adrs/component-loading/) | Delivery | One bundle, per-component files, or smart groups? |
| [Attribute Naming](/architecture/adrs/attribute-naming/) | HTML safety | Which attribute names collide with the web platform? |
| [Light DOM](/architecture/adrs/light-dom/) | Rendering | When should a component skip Shadow DOM? |

## How these decisions relate

The decisions are independent but composable. A single component embodies all four:

- **Composition** determines who provides the inner markup (`hx-card` uses slots for every content region; `hx-button` uses properties for state/appearance and slots for label / prefix / suffix content).
- **Delivery** determines how the component's JavaScript reaches the page (`attach_library('helix/hx-card')`).
- **Attribute safety** determines which HELiX-specific attributes are `hx-` prefixed to avoid Drupal Twig / CKEditor collisions, vs. which native HTML attributes (`href`, `src`, `action`, `method`, `for`) are preserved unprefixed.
- **Rendering** determines whether the component creates a shadow boundary (`hx-card` does, `hx-prose` does not).

Read in order, the ADRs build a complete picture of how HELiX integrates with Drupal without giving up the accessibility and encapsulation guarantees of Shadow DOM.
