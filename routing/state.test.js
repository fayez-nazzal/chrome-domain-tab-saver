import { test, expect } from 'bun:test';
import { reconcile } from './state.js';

test('reconcile drops a stored home id absent from the live tab list', () => {
  const homeTabs = { 'example.com': 1 };
  const liveTabs = [];
  const result = reconcile(homeTabs, liveTabs, ['example.com']);
  expect(result).toEqual({});
});

test('reconcile drops a stored home whose url no longer matches its rule', () => {
  const homeTabs = { 'example.com': 1 };
  const liveTabs = [{ id: 1, url: 'https://somewhere-else.com/' }];
  const result = reconcile(homeTabs, liveTabs, ['example.com']);
  expect(result).toEqual({});
});

test('reconcile keeps a stored home that is still live and still matches', () => {
  const homeTabs = { 'example.com': 1 };
  const liveTabs = [{ id: 1, url: 'https://example.com/dashboard' }];
  const result = reconcile(homeTabs, liveTabs, ['example.com']);
  expect(result).toEqual({ 'example.com': 1 });
});
