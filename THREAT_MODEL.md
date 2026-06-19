# HELiX Threat Model

This document enumerates the trust boundaries and attack surface for the
**HELiX component library and its distribution**, and records the mitigations
hardened in the current audit cycle. It is a living document: when a new trust
boundary, distribution channel, or component that handles untrusted input is
added, this file is updated as part of the change.

For Drupal-specific XSS guidance that complements this model — slot/attribute
escaping, CSP, and SRI hash generation — see
[XSS Prevention](apps/docs/src/content/docs/drupal/security-xss.md).

---

## Trust Model Overview

HELiX components render their own internal UI inside Shadow DOM (or, for a few
deliberately Light-DOM components, directly in the page). The **security
boundary is the light DOM** the consumer controls: the attribute values and slot
content passed in from the host application or CMS.

The library's baseline contract is **trust upstream sanitization**: most
components reflect string attributes and project slot content verbatim, and rely
on the consumer's templating layer (Drupal Twig auto-escaping, framework JSX
escaping, a CMS text-format pipeline) to neutralize untrusted input before it
reaches the component. The exceptions below are components that either accept raw
markup or fetch remote content, where the library performs its own sanitization.

| Layer                | Who sanitizes                                                       |
| -------------------- | ------------------------------------------------------------------ |
| Attribute values     | **Upstream** (Twig/JSX auto-escaping) — see XSS doc                 |
| Slot text content     | **Upstream** (Twig/JSX auto-escaping)                              |
| Slot HTML content     | **Upstream** by default; `hx-prose` offers an opt-in sanitizer      |
| Fetched inline SVG    | **Internal** — `hx-icon` `_sanitizeSvg` + origin allowlist          |
| PHI values            | **Internal** — `hx-phi-field` masks by default, JS-property-only    |
| CDN-delivered assets  | **Internal/config** — Subresource Integrity (SRI) on the loader     |

---

## 1. CDN Supply-Chain → Subresource Integrity (SRI)

**Boundary.** The Drupal asset loader can serve `@helixui/library` from a public
CDN (jsDelivr) instead of local `/libraries/` files. The browser fetches and
executes those scripts and stylesheets with full page privileges. The CDN, the
npm publish pipeline, and the network path between them are all outside the
consuming site's trust boundary.

**Risk.** A compromised or substituted CDN artifact (account takeover, registry
tampering, MITM on a misconfigured edge) would execute attacker-controlled
JavaScript in the context of every page that loads the library — a classic
supply-chain script-injection. Version-pinning alone does not protect against a
mutated artifact served under the same URL.

**Mitigation.** The shipped Drupal loader
(`starters/drupal/helix_module/helix_module.libraries.yml`) pins the jsDelivr
URLs to an exact version (`@3.10.0`) and attaches **Subresource Integrity**
metadata: `type: external`, `crossorigin: anonymous`, and a `sha384-…`
`integrity` hash computed against the exact published bytes of `dist/index.js`
and `dist/css/helix-tokens.css`. The browser refuses to execute or apply any
asset whose bytes do not match the hash, so a tampered CDN response fails closed
instead of running. The file documents the `openssl dgst -sha384` command used to
regenerate each hash when the pinned version is bumped. The
[XSS doc](apps/docs/src/content/docs/drupal/security-xss.md) covers the
companion CSP `script-src`/`style-src` allowlist and the import map required for
per-component CDN modules.

**Sanitization ownership:** internal (loader configuration) — the consuming site
must keep the pinned version and its hash in sync on upgrade.

---

## 2. Slot / Attribute XSS in Drupal → Twig Attribute-Name Hardening

**Boundary.** Drupal Twig templates pass two kinds of untrusted-derived data
into HELiX elements: **attribute values** (string properties) and **slot
content** (HTML projected into the light DOM). The HELiX Drupal templates also
support an **attribute passthrough** contract, where a caller-supplied
`#attributes` bag is rendered onto the host `hx-*` element.

**Risk.** Twig auto-escaping protects attribute *values* and slot *text*, but it
does **not** escape attribute *names*. A template that loops a raw passthrough
bag (`{% for key, val in attributes %}`) emits the KEY verbatim, so a
caller-controlled key such as `onmouseover=alert(1) x` injects an event-handler
attribute and executes script — an XSS that bypasses value escaping entirely.
Separately, `|raw`, render-array misuse, and `javascript:`/`data:` URLs in
URL-bearing attributes (`href`, `src`, `xlink:href`) remain classic bypasses of
auto-escaping.

**Mitigation.** The audited theme integration
(`starters/drupal/helix_module/helix_module.theme.inc`) normalizes the
passthrough `#attributes` bag into a Drupal `\Drupal\Core\Template\Attribute`
object before render, and the templates print `{{ attributes }}` instead of
looping raw keys. The `Attribute` object routes through Drupal's attribute
sanitizer, which validates and escapes attribute **names as well as values**,
closing the key-injection vector while preserving the legitimate
attribute-passthrough contract. Slot-content and URL-scheme guidance
(`UrlHelper::isValid`, per-item `|escape`, `check_markup()`, avoiding `|raw` on
untrusted input) is documented in detail in
[XSS Prevention](apps/docs/src/content/docs/drupal/security-xss.md).

**Sanitization ownership:** shared. The library hardens the passthrough render
path; the consumer still owns escaping of the *values* and slot content it feeds
in (per the XSS doc).

---

## 3. Inline-SVG Injection in `hx-icon` → `_sanitizeSvg` + Post-Mutator Re-Sanitize

**Boundary.** In inline mode (`src`, or a registry library that declares
`spriteSheet: false`), `hx-icon` fetches a standalone SVG document over the
network and embeds its markup into the DOM via `unsafeHTML`. The fetched bytes
are untrusted: SVG is an XML/HTML hybrid that can carry executable content.

**Risk.** A malicious or compromised SVG could embed `<script>`,
`<foreignObject>` (arbitrary HTML/JS), SMIL animation elements
(`<animate>`/`<set>` can drive event handlers or mutate attributes to defeat a
naïve filter), `on*` event-handler attributes, `style` blocks (CSS injection via
`url(javascript:)`, `expression()`, external references), or
`javascript:`/`data:` URLs in `href`/`xlink:href`. Fetching from an arbitrary
cross-origin host also widens the exfiltration/SSRF-ish surface.

**Mitigation.** Two layers:

- **Origin allowlist (`_isAllowedOrigin`).** Only same-origin and relative URLs
  are fetched by default; cross-origin fetches are blocked unless their origin is
  explicitly listed in the `allowed-origins` attribute. Unparseable URLs fail
  closed.
- **`_sanitizeSvg`.** The fetched markup is parsed with `DOMParser`
  (`image/svg+xml`); parse errors and non-SVG roots return empty. It then
  **removes** dangerous elements (`script`, `foreignObject`, `style`, and the
  SMIL set `animate`/`animateTransform`/`animateMotion`/`set`), strips all `on*`
  event-handler attributes and `style` attributes, and removes
  `javascript:`/`data:` URIs from URL-bearing attributes
  (`href`/`xlink:href`/`src`/`action`/`formaction`). It also strips conflicting
  ARIA off the root and injects `focusable="false"`. Only the sanitized
  `outerHTML` reaches `unsafeHTML`.
- **Post-mutator re-sanitize.** Registry libraries may supply a `mutator` to
  tweak the rendered SVG (e.g. stroke width). Sanitization **always runs first**;
  the mutator only ever sees already-sanitized markup, which is then re-parsed
  and re-serialized. A throwing mutator falls back to the un-mutated sanitized
  markup, so the mutator cannot reintroduce unsafe content.

**Sanitization ownership:** internal. `hx-icon` sanitizes fetched SVG itself.

> Note: sprite mode (`<use href>`) does not embed markup and is not subject to
> this path, but the referenced sprite sheet must still be a trusted resource.

---

## 4. Light-DOM CMS HTML in `hx-prose` → Opt-In Sanitizer

**Boundary.** `hx-prose` is a **Light DOM** typography wrapper for rich text —
CKEditor/CMS output, Markdown-rendered HTML, or other structured body copy. Its
slotted markup is rendered verbatim into the page (no Shadow DOM encapsulation).

**Risk.** If the slotted HTML originates from an untrusted or
insufficiently-filtered source, any script-bearing markup it contains executes in
the page context — the same XSS class as a raw `|raw` in Twig. Because the
component renders in Light DOM, there is no encapsulation boundary to contain it.

**Mitigation.** `hx-prose` documents and preserves a **trust-upstream default**:
with no opt-in, it performs **no** sanitization (`sanitize = false`), assuming
the CMS/Markdown pipeline already sanitized the markup — this keeps the historical
behavior non-breaking. When the source is not fully trusted, the consumer opts
in:

- **`sanitize` (boolean attribute).** Enables a conservative built-in allowlist
  that strips `<script>`/`<style>`/`<iframe>`/`<object>`/`<embed>`/
  `<foreignObject>`, `on*` event-handler attributes, and `javascript:`/`data:`
  URLs in `href`/`src`. A `MutationObserver` re-sanitizes content injected after
  connect (CMS hydration, client-side renders), with a re-entrancy guard so the
  rewrite does not loop.
- **`sanitizer` (function property).** When provided alongside `sanitize`, this
  function fully owns the policy and the built-in allowlist is bypassed — wire in
  a hardened library (e.g. `el.sanitizer = (html) => DOMPurify.sanitize(html)`).

**Sanitization ownership:** upstream by default; internal when opted in. The
default is intentionally "trust upstream" — consumers feeding untrusted content
**must** enable `sanitize` (or supply a `sanitizer`), or sanitize before the
markup reaches the slot.

---

## 5. PHI Exposure in `hx-phi-field` → JS-Property-Only + Strict Defaults

**Boundary.** `hx-phi-field` renders masked Protected Health Information (PHI):
SSN, MRN, date of birth, insurance number. The PHI value, the DOM source, the
browser cache, the clipboard, and audit-event listeners are all boundaries where
PHI must not leak.

**Risk.** Under HIPAA, PHI must not be exposed in the rendered DOM source,
serialized HTML (SSR/caches), browser autofill, the clipboard beyond its
intended use, or in audit telemetry. Setting PHI as an HTML attribute would
expose it in the DOM tree and HTML source before JavaScript initializes; leaking
the raw value into dispatched events would expose it to any listener up the
(composed) event path.

**Mitigation.** Multiple layers:

- **JS-property-only data (`@property({ attribute: false }) data`).** PHI is
  accepted only via the `data` JS property, never an HTML attribute, so it never
  appears in serialized markup. As a defense-in-depth recovery, if the `data`
  attribute is mistakenly present at connect (e.g. SSR), the component **rescues**
  the value into the JS property and **immediately removes the attribute** from
  the DOM, and emits a `devWarn`.
- **Masked by default.** The field renders masked (`_masked = true`); the raw
  value is only placed in the DOM when the user explicitly reveals it.
  `autocomplete="off"` is forced on the host to suppress browser autofill.
- **Audit events carry no PHI.** `hx-phi-access` is dispatched
  `composed: true` so application-level audit listeners receive it, but the
  payload is audit metadata only (`fieldId`, `action`, `timestamp`, `fieldType`)
  — the raw `data` value is deliberately excluded. This separation is an
  enforced security invariant; wrappers must not re-add PHI to event details.
- **Clipboard + visibility hygiene.** Copy/paste are blocked while masked; a
  copied value is auto-cleared after `clipboard-timeout`, with pre-emptive
  clearing on `visibilitychange` (tab hidden / lid close) to survive throttled
  timers, and an accurate `clipboard-clear` vs `clipboard-clear-failed` audit
  signal. An inactivity `auto-hide` re-masks revealed PHI so it does not linger
  if a clinician walks away.

**Sanitization ownership:** internal. The consumer's responsibility is to set
PHI via the JS property, scope `hx-phi-access` listeners appropriately in
multi-tenant/micro-frontend layouts, and never extend the event detail with PHI.

---

## Summary: Internal vs Upstream Sanitization

| Component / surface         | Sanitizes internally?            | Notes                                                            |
| --------------------------- | -------------------------------- | --------------------------------------------------------------- |
| Most components (attrs/slot) | No                               | Trust upstream (Twig/JSX auto-escaping); see XSS doc            |
| Drupal attribute passthrough | Yes (Attribute object, names)    | `helix_module.theme.inc`; values still escaped upstream        |
| `hx-icon` (inline `src`)     | Yes (`_sanitizeSvg` + allowlist) | Sprite mode references a trusted sheet, no markup embedded      |
| `hx-prose`                   | Opt-in only (`sanitize`)         | Default trusts upstream; enable `sanitize`/`sanitizer` for UGC  |
| `hx-phi-field`               | Yes (mask + JS-only + no-PHI evt) | HIPAA: never set PHI via attribute; scope audit listeners       |
| CDN asset delivery           | Config (SRI hash)                | `helix_module.libraries.yml`; keep version+hash in sync         |

---

## Maintaining This Model

Update this file whenever a change:

- adds a new component that accepts raw HTML, fetches remote content, or handles
  sensitive data;
- adds or changes a distribution channel (new CDN, new loader, new package);
- changes how the Drupal integration renders attributes or slot content; or
- adds, weakens, or removes any of the mitigations above.

A change that alters a trust boundary or removes a defense should not ship
without a corresponding amendment here and a note in the changelog.

## Related

- [SECURITY.md](SECURITY.md) — coordinated vulnerability disclosure policy
- [XSS Prevention](apps/docs/src/content/docs/drupal/security-xss.md) — Drupal
  slot/attribute escaping, CSP, and SRI hash generation
