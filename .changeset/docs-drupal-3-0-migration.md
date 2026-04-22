---
'@helixui/library': patch
---

Add Drupal 3.0.0 migration content to `docs/UPGRADING-TO-3.md` and its Starlight mirror. The 3.0.0 release ships breaking changes in `@helixui/drupal-starter` (SDC template renames, attribute changes, dialog/picker semantic shifts) and `@helixui/drupal-behaviors` (consolidated FormMixin event surface, accessible-label writes). Consumers of the Drupal packages now have a first-class migration path instead of having to reverse-engineer the changesets.
