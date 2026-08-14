import { test, expect } from 'bun:test';
import { createFakeChrome } from '../chrome/fake.js';

test('two tabs opened together on one managed host leave one tab, not zero', async () => {
  const fake = createFakeChrome();
  globalThis.chrome = fake.chrome;
  fake.setSyncStorage('domainTabSaver', {
    enabled: true,
    reuseUrl: true,
    scopePerWindow: false,
    domains: ['example.com'],
  });

  await import('../background.js');

  fake.openTab({ url: 'https://example.com/a', windowId: 1 });
  fake.openTab({ url: 'https://example.com/b', windowId: 1 });

  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });

  const remaining = fake.listTabIds().length;
  expect(remaining).toBe(1);
});
