import { describe, it, expect, beforeEach } from 'vitest';
import { createIdCounter, resetIdCounter } from './id-counter.js';

describe('createIdCounter', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('generates IDs starting at 0', () => {
    const next = createIdCounter('hx-test');
    expect(next()).toBe('hx-test-0');
  });

  it('generates monotonically increasing IDs', () => {
    const next = createIdCounter('hx-test');
    expect(next()).toBe('hx-test-0');
    expect(next()).toBe('hx-test-1');
    expect(next()).toBe('hx-test-2');
  });

  it('maintains independent counters per namespace', () => {
    const nextA = createIdCounter('hx-a');
    const nextB = createIdCounter('hx-b');
    expect(nextA()).toBe('hx-a-0');
    expect(nextB()).toBe('hx-b-0');
    expect(nextA()).toBe('hx-a-1');
    expect(nextB()).toBe('hx-b-1');
  });

  it('multiple createIdCounter calls for same namespace share the counter', () => {
    const first = createIdCounter('hx-shared');
    const second = createIdCounter('hx-shared');
    expect(first()).toBe('hx-shared-0');
    expect(second()).toBe('hx-shared-1');
  });

  it('resets a specific namespace', () => {
    const next = createIdCounter('hx-test');
    next();
    next();
    resetIdCounter('hx-test');
    expect(next()).toBe('hx-test-0');
  });

  it('does not reset other namespaces when resetting a specific one', () => {
    const nextA = createIdCounter('hx-a');
    const nextB = createIdCounter('hx-b');
    nextA();
    nextA();
    nextB();
    resetIdCounter('hx-a');
    expect(nextA()).toBe('hx-a-0');
    expect(nextB()).toBe('hx-b-1');
  });

  it('resets all namespaces when called without argument', () => {
    const nextA = createIdCounter('hx-a');
    const nextB = createIdCounter('hx-b');
    nextA();
    nextB();
    resetIdCounter();
    expect(nextA()).toBe('hx-a-0');
    expect(nextB()).toBe('hx-b-0');
  });
});
