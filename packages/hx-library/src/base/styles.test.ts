import { describe, it, expect } from 'vitest';
import { css } from 'lit';
import { mergeTokenStyles } from './styles.js';

describe('mergeTokenStyles', () => {
  it('merges two single styles into a two-element array', () => {
    const base = css`:host { color: red; }`;
    const tokens = css`:host { --hx-color-primary: blue; }`;
    const result = mergeTokenStyles(base, tokens);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(base);
    expect(result[1]).toBe(tokens);
  });

  it('merges array + single into a flat array', () => {
    const a = css`:host {}`;
    const b = css`button {}`;
    const tokens = css`:host { --hx-test: 1; }`;
    const result = mergeTokenStyles([a, b], tokens);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(a);
    expect(result[1]).toBe(b);
    expect(result[2]).toBe(tokens);
  });

  it('merges single + array into a flat array', () => {
    const base = css`:host {}`;
    const t1 = css`:host { --a: 1; }`;
    const t2 = css`:host { --b: 2; }`;
    const result = mergeTokenStyles(base, [t1, t2]);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(base);
    expect(result[1]).toBe(t1);
    expect(result[2]).toBe(t2);
  });

  it('merges two arrays into a flat array', () => {
    const a = css`:host {}`;
    const b = css`button {}`;
    const t1 = css`:host { --a: 1; }`;
    const t2 = css`:host { --b: 2; }`;
    const result = mergeTokenStyles([a, b], [t1, t2]);
    expect(result).toHaveLength(4);
    expect(result[0]).toBe(a);
    expect(result[1]).toBe(b);
    expect(result[2]).toBe(t1);
    expect(result[3]).toBe(t2);
  });

  it('preserves style object identity (no cloning)', () => {
    const base = css`:host {}`;
    const tokens = css`:host { --hx-x: 1; }`;
    const result = mergeTokenStyles(base, tokens);
    expect(result[0]).toBe(base);
    expect(result[1]).toBe(tokens);
  });
});
