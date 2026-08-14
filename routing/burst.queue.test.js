import { test, expect } from 'bun:test';
import { createQueue } from '../delivery/queue.js';
import { decide } from './decide.js';
import { emptyState } from './state.js';
import { tabOpened, navigationConfirmed } from './event.js';
import { ActionKind } from './action.js';

function shuffled(list, seed) {
  const copy = [...list];
  let state = seed;
  for (let index = copy.length - 1; index > 0; index = index - 1) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const swapIndex = state % (index + 1);
    const value = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = value;
  }
  return copy;
}

async function runBurst(order) {
  const initialState = { ...emptyState(), enabled: true, rules: ['example.com'] };
  const closedTabIds = [];

  async function onActions(actions) {
    for (const action of actions) {
      if (action.kind === ActionKind.CLOSE_TAB) {
        closedTabIds.push(action.tabId);
      }
      if (action.kind === ActionKind.NAVIGATE_HOME) {
        queue.enqueue(navigationConfirmed(action.tabId, action.url));
      }
    }
  }

  const queue = createQueue(initialState, decide, onActions);
  for (const tabId of order) {
    await queue.enqueue(tabOpened(tabId, 1, 'https://example.com/'));
  }
  await queue.enqueue(tabOpened(-1, 1, 'https://noop.invalid/'));

  return { state: queue.getState(), closedTabIds };
}

test('twenty TAB_OPENED on one managed host with no home present leaves exactly one', async () => {
  const tabIds = Array.from({ length: 20 }, (unused, index) => index + 1);

  for (let seed = 1; seed <= 5; seed = seed + 1) {
    const order = shuffled(tabIds, seed);
    const { state, closedTabIds } = await runBurst(order);
    const remaining = tabIds.filter((tabId) => !closedTabIds.includes(tabId));

    expect(remaining.length).not.toBe(0);
    expect(remaining.length).toBe(1);
    expect(Object.keys(state.homeTabs).length).toBe(1);
    expect(closedTabIds.length).toBe(19);
  }
});
