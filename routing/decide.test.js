import { test, expect } from 'bun:test';
import { decide } from './decide.js';
import { emptyState } from './state.js';
import { tabOpened, navigationConfirmed, navigationFailed } from './event.js';
import { ActionKind } from './action.js';

function baseState() {
  return { ...emptyState(), enabled: true, rules: ['example.com'] };
}

test('no rule match produces no actions', () => {
  const state = baseState();
  const result = decide(state, tabOpened(1, 1, 'https://other.com/'));
  expect(result.actions).toEqual([]);
});

test('an empty registry adopts the tab instead of closing anything', () => {
  const state = baseState();
  const result = decide(state, tabOpened(1, 1, 'https://example.com/'));
  expect(result.state.homeTabs['example.com']).toBe(1);
  const closeActions = result.actions.filter((action) => action.kind === ActionKind.CLOSE_TAB);
  expect(closeActions.length).toBe(0);
});

test('the home tab navigating within its own scope is a no-op', () => {
  let state = baseState();
  state = decide(state, tabOpened(1, 1, 'https://example.com/')).state;
  const result = decide(state, tabOpened(1, 1, 'https://example.com/other'));
  expect(result.actions).toEqual([]);
});

test('a newcomer on a live home triggers navigate and focus, never a close', () => {
  let state = baseState();
  state = decide(state, tabOpened(1, 1, 'https://example.com/')).state;
  const result = decide(state, tabOpened(2, 1, 'https://example.com/other'));
  const kinds = result.actions.map((action) => action.kind);
  expect(kinds).toEqual([ActionKind.NAVIGATE_HOME, ActionKind.FOCUS_TAB]);
});

test('navigation confirmed closes the newcomer that was recorded in awaiting', () => {
  let state = baseState();
  state = decide(state, tabOpened(1, 1, 'https://example.com/')).state;
  state = decide(state, tabOpened(2, 1, 'https://example.com/other')).state;
  const result = decide(state, navigationConfirmed(1, 'https://example.com/other'));
  expect(result.actions).toEqual([{ kind: ActionKind.CLOSE_TAB, tabId: 2 }]);
});

test('navigation failed leaves both tabs alive with no close', () => {
  let state = baseState();
  state = decide(state, tabOpened(1, 1, 'https://example.com/')).state;
  state = decide(state, tabOpened(2, 1, 'https://example.com/other')).state;
  const result = decide(state, navigationFailed(1, 'network error'));
  expect(result.actions).toEqual([]);
  expect(result.state.awaiting[1]).toBeUndefined();
});

test('a CLOSE_TAB action never targets a tab recorded as a home', () => {
  let state = baseState();
  state = decide(state, tabOpened(1, 1, 'https://example.com/')).state;
  state = decide(state, tabOpened(2, 1, 'https://example.com/other')).state;
  const result = decide(state, navigationConfirmed(1, 'https://example.com/other'));
  const homeTabIds = Object.values(result.state.homeTabs);
  for (const action of result.actions) {
    if (action.kind === ActionKind.CLOSE_TAB) {
      expect(homeTabIds.includes(action.tabId)).toBe(false);
    }
  }
});

test('CLOSE_TAB is never emitted directly from a TAB_OPENED event', () => {
  let state = baseState();
  state = decide(state, tabOpened(1, 1, 'https://example.com/')).state;
  const result = decide(state, tabOpened(2, 1, 'https://example.com/other'));
  const closeActions = result.actions.filter((action) => action.kind === ActionKind.CLOSE_TAB);
  expect(closeActions.length).toBe(0);
});

test('two newcomers on one home tab in one burst both get closed', () => {
  let state = baseState();
  state = decide(state, tabOpened(1, 1, 'https://example.com/')).state;
  state = decide(state, tabOpened(2, 1, 'https://example.com/second')).state;
  state = decide(state, tabOpened(3, 1, 'https://example.com/third')).state;
  const first = decide(state, navigationConfirmed(1, 'https://example.com/second'));
  const second = decide(first.state, navigationConfirmed(1, 'https://example.com/third'));
  const closedTabIds = [...first.actions, ...second.actions].map((action) => action.tabId);
  expect(closedTabIds).toEqual([2, 3]);
  expect(second.state.awaiting[1]).toBeUndefined();
});
