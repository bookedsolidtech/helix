---
'@helixui/library': patch
---

Add missing formDisabledCallback to 8 form-associated components (hx-button, hx-checkbox-group, hx-date-picker, hx-file-upload, hx-icon-button, hx-rating, hx-time-picker, hx-toggle-button) so they correctly respond to fieldset[disabled] state changes via ElementInternals.
