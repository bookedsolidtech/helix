---
title: SLA Templates for Healthcare
description: Service level agreement templates for healthcare customers using HELIX enterprise support
---

This page provides SLA templates and guidance tailored to healthcare organizations. These templates reflect the constraints of HIPAA, HITECH, and healthcare industry expectations for software infrastructure.

## Template A — Standard Healthcare Enterprise SLA

This template is appropriate for most healthcare organizations deploying HELIX as UI infrastructure for internal or patient-facing applications.

---

### Service Level Agreement — HELIX Enterprise (Healthcare)

**Effective Date:** [DATE]
**Customer:** [ORGANIZATION NAME]
**Provider:** WC-2026 Technologies

#### 1. Scope

This SLA applies to the HELIX component library (`@wc-2026/library`) and associated tooling as deployed and consumed by Customer in their production environments.

#### 2. Availability of Support Services

WC-2026 will provide support services during the following windows:

| Support Window | Hours |
| --- | --- |
| Standard business hours | Monday–Friday, 9:00 AM–6:00 PM ET, excluding US federal holidays |
| P1 emergency coverage | 24 hours/day, 7 days/week, 365 days/year |

#### 3. Response Time Commitments

| Priority | Definition | Initial Response | Resolution Target |
| --- | --- | --- | --- |
| P1 — Critical | Patient-facing system unavailable due to HELIX defect | 1 hour | 4 hours or workaround |
| P2 — High | Material functionality broken; clinical workflow impaired | 4 business hours | 2 business days |
| P3 — Medium | Non-critical defect with available workaround | 1 business day | 10 business days |
| P4 — Low | Enhancement request, documentation, general question | 2 business days | Roadmap-based |

**Note:** Resolution targets represent time to a working fix or documented workaround. Root cause analysis and permanent fixes for complex issues may require additional time.

#### 4. Exclusions

Response time commitments do not apply to issues caused by:

- Customer modifications to HELIX source code
- Third-party libraries outside the HELIX dependency tree
- Customer infrastructure, hosting, or network issues
- HELIX versions more than two major versions behind current stable

#### 5. Escalation

Customer may escalate any open ticket to P1 classification by contacting the dedicated account engineer directly via the emergency contact number. WC-2026 reserves the right to reclassify issues based on actual impact assessment.

#### 6. Maintenance Windows

WC-2026 will provide minimum 5 business days notice before planned maintenance affecting HELIX CDN endpoints or npm package availability. Emergency patches may be deployed without advance notice; notification will be sent within 1 hour of deployment.

#### 7. Security Disclosures

WC-2026 will notify Customer within 24 hours of confirming a security vulnerability in HELIX that affects Patient Health Information (PHI) adjacent interfaces. Notification will include:

- Vulnerability description and CVSS score
- Affected versions
- Recommended remediation action
- Expected patch timeline

---

## Template B — High-Assurance Clinical SLA

For organizations deploying HELIX in contexts where UI defects could directly affect clinical decision-making (order entry, medication administration, clinical documentation).

This template includes tighter response windows and requires co-signing by Customer's CISO or CTO.

---

### Service Level Agreement — HELIX High-Assurance Clinical

**Effective Date:** [DATE]
**Customer:** [ORGANIZATION NAME]
**Provider:** WC-2026 Technologies
**Customer Approver:** [CISO / CTO NAME AND TITLE]

#### 1. Scope

This SLA applies to HELIX deployments in high-assurance clinical contexts as defined in Exhibit A attached to this agreement.

#### 2. Response Time Commitments

| Priority | Definition | Initial Response | Resolution Target |
| --- | --- | --- | --- |
| P0 — Safety-Critical | UI defect creates direct patient safety risk | 30 minutes (24/7) | Immediate workaround; patch within 24 hours |
| P1 — Critical | Clinical workflow system unavailable | 1 hour (24/7) | 4 hours |
| P2 — High | Major clinical feature impaired | 2 business hours | 1 business day |
| P3 — Medium | Defect with clinical workaround available | 4 business hours | 5 business days |

#### 3. Change Management

All HELIX patch and minor releases affecting Customer's production environment require:

- 48-hour advance notification
- Shared release notes and migration guide
- Customer approval before deployment to production CDN endpoints used by Customer

Major version upgrades require 30-day advance notice and a joint upgrade planning session.

#### 4. Audit and Compliance

WC-2026 will provide on request:

- SOC 2 Type II attestation report
- Penetration test executive summary (annual)
- Dependency vulnerability scan results
- WCAG 2.1 AA audit report for each minor version

---

## SLA Customization

These templates are starting points. Common customizations for healthcare customers include:

- **State-specific regulations** — Some states impose additional notification requirements beyond HIPAA
- **EHR integration clauses** — If HELIX components are embedded within Epic, Cerner, or other EHR contexts
- **Business Associate Agreement (BAA)** — Required if HELIX tooling processes or has access to PHI; contact legal to determine applicability
- **Insurance requirements** — Some organizations require cyber liability insurance certificates from vendors

Contact [enterprise@wc-2026.dev](mailto:enterprise@wc-2026.dev) to negotiate custom SLA terms. Legal review is recommended before executing any SLA.
