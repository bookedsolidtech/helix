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
