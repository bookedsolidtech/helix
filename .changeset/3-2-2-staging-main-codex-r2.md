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

**Why we did not emit the deprecated names at `:root` as aliases.** Two `:root`-alias variants were considered. Both fail at the same consume-site read order, for the same reason — and both would silently break the documented host-scoped canonical-override path.

**Variant A — `var()` alias:**

```css
:root {
  --hx-color-border-on-dark-default: var(--hx-color-surface-on-dark-overlay-default);
}
```

The inner `var()` resolves at `:root`'s computed-value time (CSS Custom Properties §3) and inherits down to every descendant as an opaque resolved value. Host-scoped overrides on the canonical name (`:host { --hx-color-surface-on-dark-overlay-default: red; }`) are not consulted, because the deprecated name is already set on the host (via inheritance from `:root`) at the moment the consume site reads `var(--hx-color-border-on-dark-default, var(--hx-color-surface-on-dark-overlay-default, …))`.

**Variant B — concrete-value alias (light + dark):**

```css
:root { --hx-color-border-on-dark-default: rgba(255, 255, 255, 0.30); }
.dark { --hx-color-border-on-dark-default: rgba(255, 255, 255, 0.30); /* or dark-mode value */ }
```

No inner `var()` to substitute — but inheritance still delivers a non-empty value to every descendant. Same failure mode: the consume site reads the deprecated name first, finds it set (via inheritance), and never falls through to the canonical override on the host. Variant B has additional cost: a literal value at `:root` breaks the primitive chain. A consumer who overrides `--hx-overlay-white-30` at `:root` would see that change reflected in the canonical token but NOT in the deprecated alias, silently desynchronizing the two names.

**Both variants would fail the canonical-override test** at `dark-mode-resolution.test.ts:219-227` (which mounts `<hx-button variant="tertiary" inverted>` with a host-style override on `--hx-color-surface-on-dark-overlay-subtle` and asserts that paint resolves to the override). The test exists precisely to pin this contract.

The chosen design — no `:root` emission, both-name fallback at consume sites — breaks an undocumented direct-reader path explicitly, rather than breaking a documented host-override path silently.

**Migration for direct readers.** If your downstream code reads `--hx-color-border-on-dark-{default,subtle}` directly (not via an hx-\* component), update to the canonical names:

```diff
- background-color: var(--hx-color-border-on-dark-default);
+ background-color: var(--hx-color-surface-on-dark-overlay-default);
```

Both names continue to be honored when set as consumer overrides on hx-\* components (via the both-name fallback chain at the consume site). The deprecated names are scheduled for hard removal in 4.0.0; until then, component-internal usage is safe in either direction.

**No runtime change in this changeset.** The deprecation rationale at `tokens.json:218` was strengthened to call out the direct-reader trade-off and enumerate both rejected alias variants. No CSS, no test, no component logic moved.
