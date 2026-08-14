import { test, expect } from 'bun:test';
import { createFakeChrome } from '../chrome/fake.js';
import { liveAdapter } from '../chrome/live.js';
import { createQueue } from './queue.js';
import { createPerformActions } from './perform.js';
import { decide } from '../routing/decide.js';
import { emptyState } from '../routing/state.js';
import { tabOpened } from '../routing/event.js';

function setUpBurst() {
  const fake = createFakeChrome();
  globalThis.chrome = fake.chrome;

  let performActions = null;
  const initialState = { ...emptyState(), enabled: true, rules: ['example.com'] };
  const queue = createQueue(initialState, decide, (actions) => {
    return performActions(actions);
  });
  performActions = createPerformActions(liveAdapter, queue.enqueue);

  const home = fake.openTab({ url: 'https://example.com/home' });
  const newcomer = fake.openTab({ url: 'https://example.com/other' });

  return { fake, queue, home, newcomer };
}

async function drain() {
  await new Promise((resolve) => {
    setTimeout(resolve, 20);
  });
}

test('a failed close leaves both tabs alive', async () => {
  const { fake, queue, home, newcomer } = setUpBurst();
  await queue.enqueue(tabOpened(home.id, 1, 'https://example.com/home'));
  fake.forceCloseTabError(new Error('remove blocked'));

  queue.enqueue(tabOpened(newcomer.id, 1, 'https://example.com/other'));
  await drain();

  expect(fake.getTab(home.id)).toBeDefined();
  expect(fake.getTab(newcomer.id)).toBeDefined();
});

test('a failed navigate emits no close and leaves the home tab on its original url', async () => {
  const { fake, queue, home, newcomer } = setUpBurst();
  await queue.enqueue(tabOpened(home.id, 1, 'https://example.com/home'));
  fake.forceNavigateTabError(new Error('update blocked'));

  queue.enqueue(tabOpened(newcomer.id, 1, 'https://example.com/other'));
  await drain();

  expect(fake.getTab(home.id).url).toBe('https://example.com/home');
  expect(fake.getTab(newcomer.id)).toBeDefined();
});
