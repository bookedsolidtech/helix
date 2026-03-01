# Phase 2: Update all 13 components to consume DTCG-generated tokens

**Duration**: 1-1.5 weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Update CSS custom properties in all 13 component style files to use the new DTCG-generated token variables. Ensure three-tier fallback pattern: var(--hx-COMPONENT-PROP, var(--hx-SEMANTIC-TOKEN, HARDCODED-FALLBACK)).

---

## Tasks

### Files to Create/Modify
- [ ] `packages/hx-library/src/components/*/hx-*.styles.ts`

### Verification
- [ ] All 13 component .styles.ts files updated
- [ ] Three-tier fallback pattern used consistently
- [ ] No hardcoded color, spacing, or typography values remain
- [ ] Visual regression: components render identically before and after

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 2 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 3
