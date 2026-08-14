import { findMatchingRule } from '../managed-apps/rule.js';
import { scopeKeyFor } from '../managed-apps/scope-key.js';
import { EventKind } from './event.js';
import { navigateHome, focusTab, closeTab, persistHomeTabs } from './action.js';
import { reconcile } from './state.js';

function dropTabId(map, tabId) {
  const next = {};
  for (const key of Object.keys(map)) {
    if (map[key] !== tabId) {
      next[key] = map[key];
    }
  }
  return next;
}

function decideForTab(state, tabId, url) {
  let result = { state, actions: [] };
  const pattern = state.enabled ? findMatchingRule(url, state.rules) : null;
  if (pattern) {
    const scopeKey = scopeKeyFor(url);
    const homeTabId = state.homeTabs[scopeKey];
    if (homeTabId === undefined) {
      result = adoptAsHome(state, scopeKey, tabId);
    } else if (homeTabId === tabId) {
      result = { state, actions: [] };
    } else {
      result = navigateExistingHome(state, homeTabId, scopeKey, tabId, url);
    }
  }
  return result;
}

function adoptAsHome(state, scopeKey, tabId) {
  const homeTabs = { ...state.homeTabs, [scopeKey]: tabId };
  const nextState = { ...state, homeTabs };
  return { state: nextState, actions: [persistHomeTabs(homeTabs)] };
}

function appendAwaiting(awaiting, homeTabId, entry) {
  let pending = awaiting[homeTabId];
  if (pending === undefined) {
    pending = [];
  }
  return { ...awaiting, [homeTabId]: [...pending, entry] };
}

function shiftAwaiting(awaiting, homeTabId) {
  const pending = awaiting[homeTabId];
  const next = { ...awaiting };
  let entry = undefined;
  if (pending !== undefined && pending.length > 0) {
    entry = pending[0];
    const rest = pending.slice(1);
    if (rest.length > 0) {
      next[homeTabId] = rest;
    } else {
      delete next[homeTabId];
    }
  }
  return { awaiting: next, entry };
}

function navigateExistingHome(state, homeTabId, scopeKey, newcomerTabId, url) {
  const awaiting = appendAwaiting(state.awaiting, homeTabId, { newcomerTabId, scopeKey });
  const nextState = { ...state, awaiting };
  const actions = [navigateHome(homeTabId, url), focusTab(homeTabId)];
  return { state: nextState, actions };
}

function handleWorkerStarted(state, event) {
  const rules = event.settings.domains;
  const homeTabs = reconcile(event.storedHomeTabs, event.liveTabs, rules);
  const nextState = {
    ...state,
    enabled: event.settings.enabled,
    rules,
    homeTabs,
  };
  return { state: nextState, actions: [] };
}

function handleSettingsChanged(state, event) {
  const nextState = { ...state, enabled: event.enabled, rules: event.rules };
  return { state: nextState, actions: [] };
}

function handleTabClosed(state, event) {
  const homeTabs = dropTabId(state.homeTabs, event.tabId);
  const awaiting = { ...state.awaiting };
  delete awaiting[event.tabId];
  const nextState = { ...state, homeTabs, awaiting };
  return { state: nextState, actions: [] };
}

function handleNavigationConfirmed(state, event) {
  let result = { state, actions: [] };
  const shifted = shiftAwaiting(state.awaiting, event.tabId);
  if (shifted.entry !== undefined) {
    const nextState = { ...state, awaiting: shifted.awaiting };
    result = { state: nextState, actions: [closeTab(shifted.entry.newcomerTabId)] };
  }
  return result;
}

function handleNavigationFailed(state, event) {
  const shifted = shiftAwaiting(state.awaiting, event.tabId);
  const nextState = { ...state, awaiting: shifted.awaiting };
  return { state: nextState, actions: [] };
}

export function decide(state, event) {
  let result = { state, actions: [] };
  if (event.kind === EventKind.WORKER_STARTED) {
    result = handleWorkerStarted(state, event);
  } else if (event.kind === EventKind.SETTINGS_CHANGED) {
    result = handleSettingsChanged(state, event);
  } else if (event.kind === EventKind.TAB_OPENED) {
    result = decideForTab(state, event.tabId, event.url);
  } else if (event.kind === EventKind.TAB_NAVIGATED) {
    result = decideForTab(state, event.tabId, event.url);
  } else if (event.kind === EventKind.TAB_CLOSED) {
    result = handleTabClosed(state, event);
  } else if (event.kind === EventKind.NAVIGATION_CONFIRMED) {
    result = handleNavigationConfirmed(state, event);
  } else if (event.kind === EventKind.NAVIGATION_FAILED) {
    result = handleNavigationFailed(state, event);
  }
  return result;
}
