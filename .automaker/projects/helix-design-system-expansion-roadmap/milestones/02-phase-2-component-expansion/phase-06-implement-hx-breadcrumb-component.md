# Phase 6: Implement hx-breadcrumb component

**Duration**: 0.5-1 week
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Build hx-breadcrumb: navigation breadcrumb trail for content hierarchy. Override breadcrumb.html.twig in Drupal. ARIA landmark with structured data support.

---

## Tasks

### Files to Create/Modify
- [ ] `packages/hx-library/src/components/hx-breadcrumb/`

### Verification
- [ ] Separator customization (slot or character)
- [ ] Max items with collapse behavior
- [ ] CSS parts: nav, list, item, separator, link
- [ ] Slots: default (breadcrumb items), separator
- [ ] ARIA: nav with aria-label=Breadcrumb, aria-current=page for last item
- [ ] Structured data (JSON-LD) support
- [ ] <5KB gzipped

---

## Deliverables

- [ ] Code implemented and working
- [ ] Tests passing
- [ ] Documentation updated

---

## Handoff Checklist

Before marking Phase 6 complete:

- [ ] All tasks complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] PR merged to main
- [ ] Team notified

**Next**: Phase 7
