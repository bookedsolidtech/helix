---
'@helixui/library': patch
---

Fix TypeScript type safety findings for hx-progress-bar, hx-prose, hx-select, hx-side-nav, and hx-skeleton. Adds indeterminate boolean property to hx-progress-bar, corrects WcProse type import in hx-prose tests, adds full formStateRestoreCallback signature and size runtime guard to hx-select, removes dead \_bodyEl query and renames WcSideNav/WcNavItem type aliases to HxSideNav/HxNavItem in hx-side-nav, and adds paragraph variant plus unknown variant test to hx-skeleton.
