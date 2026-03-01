# Phase 1: Migrate tokens to W3C DTCG format via Style Dictionary 4.x

**Duration**: 2+ weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Migrate token source from flat JSON to W3C Design Token Community Group format. Set up Style Dictionary 4.x build pipeline to generate CSS custom properties and Lit tagged templates from DTCG source tokens. Three-tier cascade: primitive → semantic (--hx-color-primary) → component (--hx-button-bg).

---

## Tasks

### Files to Create/Modify
- [ ] `packages/hx-library/src/styles/`
- [ ] `packages/hx-library/tokens/`

### Verification
- [ ] Token source files converted to W3C DTCG JSON format
- [ ] Style Dictionary 4.x config generates CSS custom properties
- [ ] Lit tagged template literals generated for shadow DOM consumption
- [ ] Three-tier token cascade (primitive → semantic → component) documented
- [ ] All existing --hx-* tokens preserved with no breaking changes

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 1 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 2
