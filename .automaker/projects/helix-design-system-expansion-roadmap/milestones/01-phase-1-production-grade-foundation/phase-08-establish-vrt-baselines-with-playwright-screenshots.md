# Phase 8: Establish VRT baselines with Playwright screenshots

**Duration**: 1-1.5 weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Set up Visual Regression Testing using Playwright to capture baseline screenshots of all 13 components across all themes (default, dark, high-contrast, etc.). Configure CI to run VRT on every PR.

---

## Tasks

### Files to Create/Modify
- [ ] `packages/hx-library/playwright.config.ts`
- [ ] `packages/hx-library/tests/vrt/`

### Verification
- [ ] Playwright VRT configured in CI pipeline
- [ ] Baseline screenshots captured for all 13 components
- [ ] Screenshots in all available themes
- [ ] Screenshots in multiple viewport sizes (mobile, tablet, desktop)
- [ ] CI fails on visual regressions beyond threshold

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 8 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 9
