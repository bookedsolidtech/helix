---
'@helixui/tokens': patch
'@helixui/library': patch
---

3.2.2 staging→main codex r2 — explicit migration documentation for direct readers of the deprecated `--hx-color-border-on-dark-{default,subtle}` token names. No runtime behavior change; this is a documentation-and-rationale closeout for codex r2's medium api-design finding.

**Background.** 3.2.2 renamed two tokens that shipped as public API in 3.2.0/3.2.1:

- `--hx-color-border-on-dark-default` → `--hx-color-surface-on-dark-overlay-default`
- `--hx-color-border-on-dark-subtle` → `--hx-color-surface-on-dark-overlay-subtle`

The reason: both values use 30%/10% alpha, which cannot satisfy the WCAG 1.4.11 3:1 contrast floor required of borders against either neutral-900 (2.07:1) or neutral-0 (1.30:1). They were never functioning as borders; they were always translucent fills. The rename relocates them under the correct semantic family (`surface.on-dark-overlay-*`) where the contrast contract does not apply.

**The codex r2 finding.** The deprecated names are no longer emitted at `:root` in `dist/tokens.css`. Component-internal usage continues to work via a both-name fallback chain at every consume site (`var(--hx-color-border-on-dark-{name}, var(--hx-color-surface-on-dark-overlay-{name}, …))`) and `dark-mode-resolution.test.ts` pins overrides on both the deprecated and canonical names. But downstream code that reads the deprecated names DIRECTLY — outside an hx-\* component — will get an empty value:

```css
/* Downstream Drupal/app stylesheet (NOT inside an hx-* component shadow root) */
.my-custom-overlay {
  /* 3.2.0 / 3.2.1: resolves to var(--hx-overlay-white-30) */
  /* 3.2.2:         resolves to empty */
  background-color: var(--hx-color-border-on-dark-default);
}
```

```js
// 3.2.0 / 3.2.1: returns "rgba(255, 255, 255, 0.3)" (or similar)
// 3.2.2:         returns ""
getComputedStyle(document.documentElement).getPropertyValue(
  '--hx-color-border-on-dark-default',
);
```

**Why we did not emit the deprecated names at :root as aliases.** A `:root { --hx-color-border-on-dark-default: var(--hx-color-surface-on-dark-overlay-default); }` declaration would resolve the inner `var()` at `:root`'s computed-value time (CSS Custom Properties §3). The result inherits down to descendants as an opaque computed value — host-scoped overrides on the canonical name (`:host { --hx-color-surface-on-dark-overlay-default: red; }`) would be silently shadowed at every consume site, because the var() chain reads the deprecated name first and finds it set (with the frozen :root value) rather than falling through. That is a worse outcome than the direct-reader break: it silently breaks an actively-used override path, instead of explicitly breaking an undocumented one. The dark-mode-resolution.test.ts canonical-override test (line 219-227) would fail under any :root-alias variant.

**Migration for direct readers.** If your downstream code reads `--hx-color-border-on-dark-{default,subtle}` directly (not via an hx-\* component), update to the canonical names:

```diff
- background-color: var(--hx-color-border-on-dark-default);
+ background-color: var(--hx-color-surface-on-dark-overlay-default);
```

Both names continue to be honored when set as consumer overrides on hx-\* components (via the both-name fallback chain at the consume site). The deprecated names are scheduled for hard removal in 4.0.0; until then, component-internal usage is safe in either direction.

**No runtime change in this changeset.** The deprecation rationale at `tokens.json:218` was strengthened to call out the direct-reader trade-off explicitly. No CSS, no test, no component logic moved.
