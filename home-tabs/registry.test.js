import { test, expect } from 'bun:test';
import { adopt, forget, lookup, prune } from './registry.js';

test('adopt records a scope key against a tab id', () => {
  const registry = adopt({}, 'example.com', 1);
  expect(lookup(registry, 'example.com')).toBe(1);
});

test('forget removes a scope key', () => {
  const registry = adopt({}, 'example.com', 1);
  const next = forget(registry, 'example.com');
  expect(lookup(next, 'example.com')).toBeUndefined();
});

test('prune drops any tab id absent from the live tab list', () => {
  const registry = { 'example.com': 1, 'other.com': 2 };
  const next = prune(registry, [1]);
  expect(next).toEqual({ 'example.com': 1 });
});
