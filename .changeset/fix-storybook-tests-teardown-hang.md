---
'@helixui/library': patch
---

fix storybook tests: eliminate teardown hang and two deterministic story failures

- `apps/storybook/scripts/test-shards.mjs` runs one vitest process per story file, giving each test a fresh Chromium and avoiding cumulative page state that crashes the browser ("Browser connection was closed while running tests"). CI timeout lowered from 45m to 15m — the full suite of 84 story files completes in ~6–7m locally; CI sees ~7 min including cold vite/playwright warmup. This is an isolation strategy, not a root-cause fix for the underlying Vitest/Playwright page-reuse leak, which is tracked upstream.
- `hx-link` Default story no longer navigates the vitest-browser test page to `https://example.com` when invoking `anchor.click()` — a one-shot `preventDefault` listener on the shadow-DOM anchor keeps the synchronous `hx-click` dispatch path intact while suppressing the browser's default follow-the-link behavior.
- `hx-tag` Removable Interactive story focuses the shadow-DOM remove button directly and asserts focus on the host (matching how Shadow DOM exposes `document.activeElement`), plus checks `shadowRoot.activeElement` equals the button. Previous assertion relied on a `userEvent.tab()` round-trip that was non-deterministic from Storybook's canvas. Keyboard reachability (tabindex, not disabled) is asserted explicitly to guard against regressions.
