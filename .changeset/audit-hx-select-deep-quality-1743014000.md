---
'@helixui/library': patch
---

audit(hx-select): deep quality audit — tokens, cem, stories

- applied 3-tier css token cascade (`--_` private properties) to all style rules for correct override isolation
- eliminated hardcoded pixel values on chevron indicator by replacing with `--_chevron-size` token
- added `--hx-select-chevron-size` cssprop to cem jsdoc
- fixed `keyboardnavigation` storybook play test to assert `role="combobox"` trigger focus (not hidden native select)
- added `parameters.actions.handles: ['hx-change']` to meta for event logging in storybook actions panel
- fixed `withoptgroups` story to use actual `<optgroup>` elements (was listing flat options without group markup)
- added `withdisabledoptions` story demonstrating partially-disabled listbox
