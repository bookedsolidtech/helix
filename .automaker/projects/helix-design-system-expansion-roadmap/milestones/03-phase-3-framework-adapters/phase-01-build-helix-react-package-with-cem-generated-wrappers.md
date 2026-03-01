# Phase 1: Build @helix/react package with CEM-generated wrappers

**Duration**: 2+ weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Create React wrapper components auto-generated from CEM using @lit/react. Each Helix component gets a typed React wrapper that maps attributes to props, events to callbacks, and slots to children. Published as @helixds/react.

---

## Tasks

### Files to Create/Modify
- [ ] `packages/react/`

### Verification
- [ ] CEM-to-React codegen script using @lit/react
- [ ] Typed React wrappers for all components
- [ ] Events mapped to React callback props (onHxClick, onHxChange, etc.)
- [ ] Slots mapped to React children
- [ ] TypeScript declarations generated
- [ ] Works with Next.js 15 SSR
- [ ] Published as @helixds/react

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
