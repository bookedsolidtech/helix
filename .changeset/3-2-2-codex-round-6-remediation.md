---
'@helixui/library': patch
---

3.2.2 codex round-6 remediation — residual focus-ring drift + override-path light sister + on-dark inline-fallback contract

Cleanup of four low-severity concerns surfaced by codex deep review on the staging→main candidate after round-5 landed. Rolls into the same 3.2.2 patch — no new tokens, no API change.

- `hx-carousel` — 3 focus-ring fallback chains (nav-btn, play-pause-btn, pagination-item outlines) still resolved to `primary-500` on cold-start. Aligned to canonical `var(--hx-focus-ring-color, #0f7078)`.
- `hx-select` — focused-option outline carried a dead `var(--_focus-ring-color, var(--hx-color-primary-500))` tail. `--_focus-ring-color` is unconditionally defined on `:host` (line 24) so the tail is unreachable; dropped to `var(--_focus-ring-color)`.
- `dark-mode-resolution.test.ts` — added a light-mode sister assertion to the bg-inverted-rest override-path test, proving the `--hx-color-action-primary-bg-inverted-rest` consumer override is mode-agnostic (not just a dark-mode contract).
- `hx-button` — added an inline-fallback contract comment at the head of the inverted-mode block documenting that the literal `rgba(255, 255, 255, 0.X)` arms on `--hx-color-border-on-dark-*` are a light-mode-only last resort. At runtime, `<hx-theme>` injects `dark.color.border.on-dark-*` as overlay-black-* so dark-mode inverted buttons stay visible on the now-light surface.inverse. Future relocation outside an `<hx-theme>` host should switch to mode-aware tokens.
