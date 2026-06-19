# Audit finding E2 — typed custom events: global `HTMLElementEventMap` is unsound; deferred

**Status:** Deferred (not shipped in the 3.x audit remediation). Requires a
deliberate, coordinated design change — see "Recommended approach" below.

## Original item (from `AUDIT-3x-register.md`, E2)

> 18 of ~28 event-emitting components lack `HTMLElementEventMap` augmentation —
> `detail` is `any` for `addEventListener` consumers. Add per-component
> `declare global` blocks + exported named detail types.

## Why it cannot be done as specified

`HTMLElementEventMap` is a **single global interface**. Every
`declare global { interface HTMLElementEventMap { … } }` block in the codebase is
declaration-merged into that one interface. TypeScript requires that a property
declared more than once across merged declarations have the **same type**
(TS2717: _"Subsequent property declarations must have the same type"_).

HELiX components reuse event **names** across components with **different
`detail` shapes**, so per-component global augmentations mutually conflict:

| Event name | Distinct emitters | Example conflicting details |
| --- | --- | --- |
| `hx-change` | 18 | `{ value: string }` vs `{ values: string[] }` vs `{ checked, value }` |
| `hx-input` | 8 | `{ value: string }` (color) vs number-input detail |
| `hx-select` | 7 | `{ value, label }` vs menu/list/tree select details |
| `hx-show` / `hx-hide` | 7 each | popover vs toast vs overflow-menu |
| `hx-error` | 2 | `void` (image) vs `HxFileErrorDetail` (file-upload) |

Adding the augmentations globally makes `tsc` fail (verified: 13 × TS2717 in a
trial run). The handful of existing global `HTMLElementEventMap` entries only
compile today because no second component has yet declared the same name with a
different shape — the pattern is latently fragile and does not scale.

## Recommended approach (the proper fix)

Adopt the **component-scoped event map + typed `addEventListener` overload**
pattern (as used by Shoelace / Web Awesome). It is collision-free because the
event map is per-class, not global:

```ts
export interface HelixSelectEventMap {
  'hx-change': CustomEvent<HxSelectChangeDetail>;
}

export class HelixSelect extends … {
  addEventListener<K extends keyof HelixSelectEventMap>(
    type: K,
    listener: (this: HelixSelect, ev: HelixSelectEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    super.addEventListener(type, listener, options);
  }
  // …mirror for removeEventListener
}
```

This gives consumers `el.addEventListener('hx-change', e => e.detail.value)`
typing when `el` is a typed component instance, with no global key collisions.

### Why it is deferred rather than rushed

- It touches the **class body** of ~42 components (overload signatures +
  implementation), not just a trailing `declare global` — materially higher risk
  than the additive shims that made up the rest of this cycle.
- It should be applied **uniformly** (ideally via a shared base/mixin or codegen
  from the CEM) so the pattern stays consistent and maintainable, which is a
  design decision, not a mechanical edit.
- E2 is the lowest-severity audit item (developer-experience typing). The
  consumer-facing detail **shapes** are already documented per-event in the CEM
  (`@fires`), so untyped `addEventListener` is an ergonomics gap, not a
  correctness or safety gap.

### Safe additive subset, if value is needed sooner

Exporting the named `Hx*Detail` interfaces (without any global augmentation) is
collision-free and lets consumers cast:
`(e as CustomEvent<HxSelectChangeDetail>).detail`. Many components already export
these; completing the set is a low-risk follow-up that does not block on the
overload design.

## Recommendation

Track E2 as a dedicated typed-events workstream (codegen the per-component event
maps + overloads from the CEM), not an inline shim. The global-`HTMLElementEventMap`
path in the register should be marked **superseded** by this finding.
