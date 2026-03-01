# Phase 12: Set up npm publishing workflow and publish beta

**Duration**: 1-1.5 weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Configure CI/CD pipeline for automated npm publishing. Publish @helix/library@0.1.0-beta.1 to npm under @helixds namespace. Set up provenance signing and package verification.

---

## Tasks

### Files to Create/Modify
- [ ] `.github/workflows/`
- [ ] `packages/hx-library/package.json`

### Verification
- [ ] npm publishing workflow in CI (triggered by changeset version PR)
- [ ] @helixds npm namespace configured
- [ ] Provenance signing enabled
- [ ] Package.json exports field correctly maps all entry points
- [ ] @helix/library@0.1.0-beta.1 published to npm

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 12 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 13
