# wc-2026 Component Roadmap: From 3 to 10

> Saved from principal-engineer analysis session, 2026-02-14.
> NOTE: This system is a content/blog site, not a clinical data portal. All component categories matter — navigation, content organization, imagery, feedback, forms. Priorities should be recalibrated with this context.

## Current State (3 components)

- **`wc-button`** — Action primitive. Form-associated via ElementInternals. Variants (primary/secondary/ghost), sizes (sm/md/lg).
- **`wc-card`** — Content container. Slot-heavy (image, heading, body, footer, actions). Interactive mode.
- **`wc-text-input`** — Form control. Full form association, label, error, help text, prefix/suffix slots.

## Proposed Next 7 (needs recalibration for blog/content context)

| # | Component | Category | Size | Rationale |
|---|-----------|----------|------|-----------|
| 1 | `wc-checkbox` | Form Control | S | Boolean form pattern. Consent, preferences, filters. |
| 2 | `wc-select` | Form Control | L | Controlled vocabularies. Slotted native `<option>` for Drupal compat. |
| 3 | `wc-radio-group` + `wc-radio` | Form Control | M | Single-selection from visible options. Ships as pair. |
| 4 | `wc-alert` | Feedback | S | System messages, validation summaries, status communication. |
| 5 | `wc-textarea` + FormFieldMixin | Form Control | S | Long-form content entry. Triggers shared mixin extraction. |
| 6 | `wc-badge` | Feedback | S | Notification counts, status indicators, tags. |
| 7 | `wc-switch` | Form Control | S | Setting toggles. `role="switch"` distinct from checkbox. |

## Architecture Decisions

1. **`wc-select`** uses slotted native `<option>` — no separate `wc-option`. Works in Twig.
2. **FormFieldMixin** extracted at position 5 (textarea) when 5 form controls share patterns.
3. **Shared `form-field.styles.ts`** for common field CSS classes.
4. **Event contract**: all form controls emit `wc-change`, detail typed per component.

## Deliberately Deferred

- `wc-button-group` — Cosmetic, not functional. Range 11-15.
- `wc-breadcrumb` — Drupal handles natively. CSS custom properties suffice.
- `wc-avatar` — Nice-to-have for dashboards.
- `wc-image` — Native `<img>` works everywhere.
- `wc-tooltip` — A11y complexity. Build right in 11-15.
- `wc-dialog`/`wc-drawer` — Build on native `<dialog>`. Range 11-15.

## Web Awesome Reference Catalog

**Actions:** Button, Button Group, Copy Button, Dropdown, Dropdown Item, QR Code
**Feedback:** Badge, Callout, Progress Bar, Progress Ring, Skeleton, Spinner, Tag, Tooltip
**Form Controls:** Checkbox, Color Picker, Combobox, File Input, Input, Number Input, Option, Radio, Radio Group, Rating, Select, Slider, Switch, Textarea
**Imagery:** Animated Image, Avatar, Carousel, Carousel Item, Comparison, Icon, Zoomable Frame
**Navigation:** Breadcrumb, Breadcrumb Item, Tab, Tab Group, Tab Panel, Tree, Tree Item
**Organization:** Card, Details, Dialog, Divider, Drawer, Page, Scroller, Split Panel
**Utilities:** Animation, Format Bytes, Format Date, Format Number, Include, Popover, Popup, Relative Time
