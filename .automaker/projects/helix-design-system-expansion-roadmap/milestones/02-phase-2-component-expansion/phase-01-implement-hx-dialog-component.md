# Phase 1: Implement hx-dialog component

**Duration**: 2+ weeks
**Owner**: TBD
**Dependencies**: None
**Parallel Work**: Can run alongside other phases (if applicable)

---

## Overview

Build hx-dialog: modal/non-modal dialog with focus trap, backdrop, animations. Required for confirmations, forms, media previews. Uses native <dialog> element internally. Trigger via Drupal behavior; composed: true events cross Shadow DOM.

---

## Tasks

### Files to Create/Modify
- [ ] `packages/hx-library/src/components/hx-dialog/`

### Verification
- [ ] Modal and non-modal modes
- [ ] Focus trap (tab cycling within dialog)
- [ ] Click-outside-to-close (configurable)
- [ ] Escape key closes
- [ ] CSS parts: dialog, backdrop, header, body, footer
- [ ] Slots: default, header, footer
- [ ] Events: hx-open, hx-close, hx-cancel
- [ ] ARIA: role=dialog, aria-modal, aria-labelledby
- [ ] <5KB gzipped

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
