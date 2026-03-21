---
tags: [patterns]
summary: patterns implementation decisions and patterns
relevantTo: [patterns]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 84
  referenced: 40
  successfulFeatures: 40
---
# patterns

#### [Pattern] PLACEHOLDER comments are embedded inline in the template to guide agents on exactly what to replace, rather than relying on separate instructions or README (2026-03-10)
- **Problem solved:** 73 LAUNCH READY agent tickets will each independently fill in this template for different components — consistency requires self-documenting structure
- **Why this works:** Agents operating autonomously across 73 tickets will not reliably read external documentation. Inline PLACEHOLDER comments make the required substitutions machine-readable and colocated with the content
- **Trade-offs:** Template file is more verbose but self-sufficient. The inline comments must themselves be valid MDX or they introduce parse errors

#### [Pattern] Twig templates for web components should document a no-behavior-required pattern with an explicit Drupal.behaviors stub showing how programmatic control would work if needed (2026-03-13)
- **Problem solved:** Shadow DOM components manage their own state; Drupal's progressive enhancement pattern via behaviors is the standard integration point but is unnecessary for self-contained components
- **Why this works:** Documents the intentional architectural decision that the component is self-contained, prevents developers from unnecessarily attaching behaviors, and provides a copy-paste starting point for the rare advanced case
- **Trade-offs:** Template becomes longer and more educational but prevents misuse and reduces support burden