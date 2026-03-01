# Phase 5: Add axe-core accessibility tests to all components

**Duration**: 1-1.5 weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Add automated accessibility tests using axe-core to every component test file. Use the existing test-utils checkA11y helper. Test in multiple states: default, disabled, error, focused, with content, empty.

---

## Tasks

### Files to Create/Modify
- [ ] `packages/hx-library/src/components/*/hx-*.test.ts`

### Verification
- [ ] Every component test file includes axe-core checks
- [ ] Tests cover default, disabled, error, and focused states
- [ ] Zero axe-core violations across all components
- [ ] Tests verify ARIA attributes are correctly applied

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 5 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 6
