# Phase 15: Build @helix/cli tool

**Duration**: 2+ weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Create a ShadCN-style CLI that lets developers copy individual components into their projects (BYOS path 3). Uses @clack/prompts for interactive UI. Commands: init, add, diff, update.

---

## Tasks

### Files to Create/Modify
- [ ] `packages/cli/`

### Verification
- [ ] helix init - initialize project with token config
- [ ] helix add <component> - copy component source into project
- [ ] helix diff <component> - show diff between local and upstream
- [ ] helix update <component> - update component preserving local changes
- [ ] Interactive component selector via @clack/prompts
- [ ] Respects project tsconfig and import paths
- [ ] Published as @helixds/cli

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 15 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 16
