---
'@helixui/library': patch
---

3.2.2 codex round-7 remediation — repoint inverse-surface borders to border-on-dark-strong

Cleanup of one medium-severity concern surfaced by codex round-7 on the staging→main candidate. Rolls into the same 3.2.2 patch — no token changes, no API change.

Codex flagged that the new `dark.color.border.strong` override (`neutral-500 → neutral-400`) added in 3.2.2 — correct for the dominant case (form-control borders on dark surface.default, which gains 6.27:1 headroom) — regressed two components that bind `border.strong` against `surface.inverse`. In dark mode, `surface.inverse` flips to the light `neutral-100` (#EBEEE9), where `neutral-400` (#8E9C98) lands at 2.44:1, failing WCAG 1.4.11's 3:1 UI floor.

Fix path (a) — architecturally aligned with the new dark-override layer:

- `hx-side-nav` — container, header, and footer divider borders (lines 32, 50, 77) repointed from `--hx-color-border-strong` to `--hx-color-border-on-dark-strong`. The host already binds `surface-inverse` for bg, so this is the correct family. Dark-mode dark-override resolves to overlay-black-50 = 3.84:1 on light surface.inverse (passes).
- `hx-code-snippet` — copy button border (line 83) and expand button top border (line 128) repointed identically. Both sit on the always-dark block-snippet surface (`surface-inverse`).

Inline cold-start fallback updated to `rgba(255, 255, 255, 0.7)` (overlay-white-70, the light-mode resolved value of `border.on-dark-strong`).
