# Phase 13: Build Drupal SDC auto-generation from CEM

**Duration**: 2+ weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Create a build step that generates Drupal Single Directory Component (SDC) definitions from the Custom Elements Manifest. Each component gets a .component.yml with props, slots, and schema auto-mapped from CEM data.

---

## Tasks

### Files to Create/Modify
- [ ] `scripts/cem-to-sdc.ts`
- [ ] `packages/hx-library/drupal/`

### Verification
- [ ] CEM-to-SDC generator build step
- [ ] Generated .component.yml for each component
- [ ] Props mapped from CEM attributes with correct types
- [ ] Slots mapped from CEM slots
- [ ] Schema validation for generated files
- [ ] CI step validates generated SDCs match CEM

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 13 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 14
