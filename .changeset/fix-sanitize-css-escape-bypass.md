---
'@helixui/library': patch
---

Fix CSS escape bypass in `sanitizeCss`. The validator now decodes CSS escape sequences (hex, line-continuation, identity) across the full stylesheet before applying `BLOCKED_PATTERNS` and `URL_PATTERN` checks, and `isUrlSafe()` continues to decode its payload defensively.

This closes three classes of encoded bypass:

- Encoded url() payloads: `url(http\3a//evil.example/x)`, `url(\68\74\74\70\3a//evil.example/x)`, `url(http\<LF>://evil.example/x)`.
- Encoded `url` function name: `u\72l(http://evil.example/x)`, `\75\72\6c(...)` — per CSS Syntax Level 3 §4.3.4 the tokenizer decodes ident escapes, so these tokenize identically to `url(...)` in the browser.
- Encoded at-keywords: `@\69mport "..."`, `@\69\6d\70\6f\72\74 "..."`, `expres\73ion(...)`, `-moz-bindin\67:`, `behavio\72:` — per §4.3.3 at-keyword and §4.3.5 ident tokenizers decode escapes before rule/property name resolution.

Regex-only defenses matched literal bytes while the browser decodes escapes at parse time. Decoding first forces the validator to see what the browser will ultimately tokenize.
