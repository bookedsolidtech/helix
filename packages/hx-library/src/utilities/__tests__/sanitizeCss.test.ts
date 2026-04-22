import { describe, it, expect } from 'vitest';
import { sanitizeCss } from '../sanitizeCss.js';

const COMPONENT = 'test-sanitize';

describe('sanitizeCss — url() scheme enforcement', () => {
  it('accepts relative paths', () => {
    expect(sanitizeCss('.a { background: url(./img.png); }', COMPONENT)).not.toBeNull();
  });

  it('accepts data: URIs', () => {
    expect(sanitizeCss('.a { background: url(data:image/png;base64,aGk=); }', COMPONENT)).not.toBeNull();
  });

  it('accepts blob: URIs', () => {
    expect(sanitizeCss('.a { background: url(blob:https://host/abc); }', COMPONENT)).not.toBeNull();
  });

  it('accepts fragment references (#symbol)', () => {
    expect(sanitizeCss('.a { clip-path: url(#my-clip); }', COMPONENT)).not.toBeNull();
  });

  it('rejects explicit http:// URLs', () => {
    expect(sanitizeCss('.a { background: url(http://evil.example/x.png); }', COMPONENT)).toBeNull();
  });

  it('rejects explicit https:// URLs', () => {
    expect(sanitizeCss('.a { background: url(https://evil.example/x.png); }', COMPONENT)).toBeNull();
  });

  it('rejects protocol-relative URLs (//host/path)', () => {
    expect(sanitizeCss('.a { background: url(//evil.example/x.png); }', COMPONENT)).toBeNull();
  });

  it('rejects protocol-relative URLs with surrounding whitespace', () => {
    expect(sanitizeCss('.a { background: url("  //evil.example/x  "); }', COMPONENT)).toBeNull();
  });

  it('rejects protocol-relative URLs with leading tab', () => {
    expect(sanitizeCss(".a { background: url('\t//evil.example/x'); }", COMPONENT)).toBeNull();
  });

  it('rejects ftp:// URLs', () => {
    expect(sanitizeCss('.a { background: url(ftp://evil.example/x); }', COMPONENT)).toBeNull();
  });
});

describe('sanitizeCss — brace balance with strings and comments', () => {
  it('accepts double-quoted content with closing brace', () => {
    expect(sanitizeCss('.a::before { content: "}"; }', COMPONENT)).not.toBeNull();
  });

  it('accepts double-quoted content with opening brace', () => {
    expect(sanitizeCss('.a::before { content: "{"; }', COMPONENT)).not.toBeNull();
  });

  it('accepts single-quoted content with both braces', () => {
    expect(sanitizeCss(".a::before { content: '{}{}'; }", COMPONENT)).not.toBeNull();
  });

  it('accepts SVG data URI with braces inside string', () => {
    const svg =
      '.a { background: url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\"><style>g{fill:red}</style></svg>"); }';
    expect(sanitizeCss(svg, COMPONENT)).not.toBeNull();
  });

  it('accepts escaped quotes within a quoted string', () => {
    expect(sanitizeCss('.a::before { content: "\\"}\\""; }', COMPONENT)).not.toBeNull();
  });

  it('accepts block comments that contain braces', () => {
    expect(sanitizeCss('/* { brace in comment } */ .a { color: red; }', COMPONENT)).not.toBeNull();
  });

  it('still rejects an unbalanced closing brace outside strings', () => {
    expect(sanitizeCss('.a { color: red; } }', COMPONENT)).toBeNull();
  });

  it('still rejects a stray opening brace outside strings', () => {
    expect(sanitizeCss('.a { color: red;', COMPONENT)).toBeNull();
  });

  it('still rejects unbalanced close appearing before an open outside strings', () => {
    expect(sanitizeCss('} .a { color: red; }', COMPONENT)).toBeNull();
  });
});

describe('sanitizeCss — blocked patterns still enforced', () => {
  it('rejects expression(', () => {
    expect(sanitizeCss('.a { width: expression(alert(1)); }', COMPONENT)).toBeNull();
  });

  it('rejects @import', () => {
    expect(sanitizeCss('@import url("x.css"); .a { color: red; }', COMPONENT)).toBeNull();
  });

  it('rejects -moz-binding', () => {
    expect(sanitizeCss('.a { -moz-binding: url(x.xml); }', COMPONENT)).toBeNull();
  });

  it('rejects behavior:', () => {
    expect(sanitizeCss('.a { behavior: url(x.htc); }', COMPONENT)).toBeNull();
  });
});

describe('sanitizeCss — CSS escape bypass defense (url() validator)', () => {
  // Each of these cases encodes a forbidden scheme or protocol-relative form
  // using CSS escapes. The browser's CSS parser will decode the escape AFTER
  // our validator runs, so we must decode before scheme-checking to prevent
  // external-resource loads from slipping past the allow-list.

  it('rejects hex-escaped colon in scheme (http\\3a//evil.example/x)', () => {
    // `\3a` decodes to `:` — attacker-encoded `http:`
    expect(
      sanitizeCss('.a { background: url(http\\3a//evil.example/x); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects hex-escaped protocol-relative slashes (\\2f \\2f evil.example/x)', () => {
    // Per the CSS spec, each hex escape greedily reads up to 6 hex digits.
    // A naive `\2f\2fevil` actually decodes to `/˾vil` (second escape eats
    // the `e`). The realistic encoded-// exploit uses whitespace terminators
    // or 6-digit padding — both of which MUST still be rejected.
    expect(
      sanitizeCss('.a { background: url(\\2f \\2f evil.example/x); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects 6-digit hex-escaped protocol-relative slashes (\\00002f\\00002fevil.example/x)', () => {
    // Padding each escape to 6 digits forces termination cleanly: this form
    // decodes to `//evil.example/x` and must be rejected.
    expect(
      sanitizeCss('.a { background: url(\\00002f\\00002fevil.example/x); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects fully hex-escaped http: scheme (\\68\\74\\74\\70\\3a//evil.example/x)', () => {
    // `\68\74\74\70\3a` decodes character-by-character to `http:`
    expect(
      sanitizeCss(
        '.a { background: url(\\68\\74\\74\\70\\3a//evil.example/x); }',
        COMPONENT,
      ),
    ).toBeNull();
  });

  it('rejects hex-escaped http: with whitespace terminator (\\68 \\74 \\74 \\70 \\3a //...)', () => {
    // Each escape consumes a single trailing whitespace per the CSS spec.
    expect(
      sanitizeCss(
        '.a { background: url(\\68 \\74 \\74 \\70 \\3a //evil.example/x); }',
        COMPONENT,
      ),
    ).toBeNull();
  });

  it('rejects backslash-newline continuation smuggling a scheme (http\\<LF>:xyz)', () => {
    // CSS line-continuation decodes to empty string, so `http\<LF>:xyz`
    // reconstructs as `http:xyz` at parse time.
    expect(
      sanitizeCss('.a { background: url(http\\\n://evil.example/x); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects CRLF line-continuation smuggling a scheme (http\\<CRLF>:...)', () => {
    expect(
      sanitizeCss('.a { background: url(http\\\r\n://evil.example/x); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects quoted url() that hex-escapes the colon', () => {
    // Quoted form must decode the same way — the attacker-controlled payload
    // lives inside the quotes.
    expect(
      sanitizeCss('.a { background: url("http\\3a//evil.example/x"); }', COMPONENT),
    ).toBeNull();
  });

  it('decodes 6-digit hex escape correctly (\\000041 → A) and still passes scheme check', () => {
    // `\000041` decodes to `A`, producing the safe relative path `Apath.png`.
    // This confirms the 6-digit max is honored without tripping the scheme
    // regex on any residual hex digits.
    expect(
      sanitizeCss('.a { background: url(\\000041path.png); }', COMPONENT),
    ).not.toBeNull();
  });

  it('still accepts positive control: data:image/png base64', () => {
    expect(
      sanitizeCss(
        '.a { background: url(data:image/png;base64,iVBORw0KGgo=); }',
        COMPONENT,
      ),
    ).not.toBeNull();
  });

  it('still accepts positive control: relative path', () => {
    expect(sanitizeCss('.a { background: url(/rel/path.png); }', COMPONENT)).not.toBeNull();
  });

  it('still accepts positive control: fragment reference', () => {
    expect(sanitizeCss('.a { clip-path: url(#filter); }', COMPONENT)).not.toBeNull();
  });

  it('accepts url() with only line-continuation escapes (decodes to empty)', () => {
    // `\<LF>` alone decodes to empty string, which the validator treats as a
    // harmless empty url(). The CSS is structurally intact so it should pass.
    expect(sanitizeCss('.a { background: url(\\\n); }', COMPONENT)).not.toBeNull();
  });
});

describe('sanitizeCss — CSS escape bypass defense (ident-token smuggling)', () => {
  // Per CSS Syntax Level 3 §4.3.3 (at-keyword-token) and §4.3.4 (url-token),
  // the tokenizer decodes ident escapes before comparing against rule and
  // function names. So `@\69mport` tokenizes as `@import` and `u\72l(...)`
  // tokenizes as `url(...)` — both would bypass regex checks that match only
  // the literal bytes. These cases pin down the decode-before-check defense.

  it('rejects escaped url function name (u\\72l) pointing to external scheme', () => {
    expect(
      sanitizeCss('.a { background: u\\72l(http://evil.example/x); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects escaped url function name with 6-digit hex (u\\000072l) pointing to external scheme', () => {
    expect(
      sanitizeCss('.a { background: u\\000072l(https://evil.example/x); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects fully escaped url function name (\\75\\72\\6c)', () => {
    // `\75\72\6c` decodes to `url`.
    expect(
      sanitizeCss('.a { background: \\75\\72\\6c(http://evil.example/x); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects escaped @import keyword (@\\69mport)', () => {
    expect(
      sanitizeCss('@\\69mport "http://evil.example/x.css";', COMPONENT),
    ).toBeNull();
  });

  it('rejects fully escaped @import keyword (@\\69\\6d\\70\\6f\\72\\74)', () => {
    // `\69\6d\70\6f\72\74` decodes to `import`.
    expect(
      sanitizeCss('@\\69\\6d\\70\\6f\\72\\74 "http://evil.example/x.css";', COMPONENT),
    ).toBeNull();
  });

  it('rejects escaped @import keyword with whitespace terminators', () => {
    // Each hex escape consumes a single optional whitespace per §4.3.7.
    expect(
      sanitizeCss('@\\69 mport "http://evil.example/x.css";', COMPONENT),
    ).toBeNull();
  });

  it('rejects escaped expression function name (expres\\73ion())', () => {
    // `\73` decodes to `s`, reconstructing `expression()`.
    expect(sanitizeCss('.a { width: expres\\73ion(alert(1)); }', COMPONENT)).toBeNull();
  });

  it('rejects escaped -moz-binding property (-moz-bindin\\67)', () => {
    expect(
      sanitizeCss('.a { -moz-bindin\\67: url(evil.xml#xbl); }', COMPONENT),
    ).toBeNull();
  });

  it('rejects escaped behavior property (behavio\\72)', () => {
    expect(sanitizeCss('.a { behavio\\72: url(evil.htc); }', COMPONENT)).toBeNull();
  });

  it('still accepts legitimate url() with unrelated escapes in surrounding CSS', () => {
    // Harmless identity-escape inside a selector; url() payload is safe.
    expect(
      sanitizeCss('.\\:hover-safe { background: url(/safe.png); }', COMPONENT),
    ).not.toBeNull();
  });
});

describe('sanitizeCss — decode asymmetry guardrails', () => {
  // These tests pin down the documented asymmetry between brace-balance
  // (raw input) and the token-level checks (decoded input). They guard
  // against regressions in either direction if either pass is re-engineered.

  it('accepts CSS with hex-escaped braces inside strings (raw-balance handles strings)', () => {
    // `\7b` and `\7d` are `{` and `}`. Inside a string, the browser does
    // NOT treat these as block delimiters — it decodes them into the
    // string's value. Raw brace-balance must stay at zero here because
    // the string scanner skips over the escapes.
    expect(
      sanitizeCss('.a { content: "\\7b inner \\7d"; color: red; }', COMPONENT),
    ).not.toBeNull();
  });

  it('rejects the documented decode false-positive: hex-escaped @import inside a string', () => {
    // `content: "\40 import notes"` decodes to `content: "@import notes"`.
    // Documented in the sanitizeCss JSDoc as an intentional false positive:
    // the security gain from catching escape-encoded idents at at-rule
    // positions outweighs the cost of rejecting the escape-in-string form.
    expect(
      sanitizeCss('.a::before { content: "\\40 import notes"; }', COMPONENT),
    ).toBeNull();
  });
});
