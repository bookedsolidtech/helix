# Phase 3: Complete JSDoc annotations on all 13 components

**Duration**: 2+ weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Add comprehensive JSDoc annotations to every property, event, slot, CSS part, and CSS custom property on all 13 components. These annotations drive CEM generation which feeds Storybook autodocs, Starlight docs, and framework adapter codegen.

---

## Tasks

### Files to Create/Modify
- [ ] `packages/hx-library/src/components/*/hx-*.ts`

### Verification
- [ ] Every @property decorated field has JSDoc with description and default
- [ ] Every event dispatch has @fires JSDoc tag
- [ ] Every slot has @slot JSDoc tag
- [ ] Every CSS part has @csspart JSDoc tag
- [ ] Every CSS custom property has @cssprop JSDoc tag
- [ ] CEM regeneration produces complete manifest matching public API

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 3 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 4
