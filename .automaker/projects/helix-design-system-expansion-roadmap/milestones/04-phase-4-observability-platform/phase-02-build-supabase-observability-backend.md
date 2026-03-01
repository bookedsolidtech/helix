# Phase 2: Build Supabase observability backend

**Duration**: 2+ weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Set up Supabase project with schema for telemetry ingestion, health snapshots, usage analytics, and error reports. Both hosted (Supabase Cloud) and self-hosted (Docker Compose) options. Includes data retention policies and automated purging.

---

## Tasks

### Files to Create/Modify
- [ ] `infra/observability/`
- [ ] `supabase/`

### Verification
- [ ] Supabase schema with RLS policies
- [ ] Telemetry ingestion API via Supabase functions
- [ ] Data retention policies (30d free, 365d paid)
- [ ] Automated purging via pg_cron
- [ ] Self-hosted Docker Compose option
- [ ] API rate limiting

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
