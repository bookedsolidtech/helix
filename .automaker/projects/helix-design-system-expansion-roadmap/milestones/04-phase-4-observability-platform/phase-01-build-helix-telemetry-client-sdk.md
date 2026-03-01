# Phase 1: Build @helix/telemetry client SDK

**Duration**: 2+ weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Lightweight, opt-in client-side telemetry SDK that reports component usage, health metrics, and errors to the Supabase backend. Privacy-first: no PII, configurable reporting, easy opt-out.

---

## Tasks

### Files to Create/Modify
- [ ] `packages/telemetry/`

### Verification
- [ ] Opt-in only, zero data without explicit consent
- [ ] Reports: component usage counts, render times, error rates
- [ ] Configurable reporting interval and data scope
- [ ] Tree-shakable, <2KB gzipped
- [ ] Works in browser and SSR environments
- [ ] Published as @helixds/telemetry

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
