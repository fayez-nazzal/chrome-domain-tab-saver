export const EventKind = {
  WORKER_STARTED: 'WORKER_STARTED',
  TAB_OPENED: 'TAB_OPENED',
  TAB_NAVIGATED: 'TAB_NAVIGATED',
  TAB_CLOSED: 'TAB_CLOSED',
  NAVIGATION_CONFIRMED: 'NAVIGATION_CONFIRMED',
  NAVIGATION_FAILED: 'NAVIGATION_FAILED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
};

export function workerStarted(liveTabs, storedHomeTabs, settings) {
  return { kind: EventKind.WORKER_STARTED, liveTabs, storedHomeTabs, settings };
}

export function tabOpened(tabId, windowId, url) {
  return { kind: EventKind.TAB_OPENED, tabId, windowId, url };
}

export function tabNavigated(tabId, windowId, url) {
  return { kind: EventKind.TAB_NAVIGATED, tabId, windowId, url };
}

export function tabClosed(tabId) {
  return { kind: EventKind.TAB_CLOSED, tabId };
}

export function navigationConfirmed(tabId, url) {
  return { kind: EventKind.NAVIGATION_CONFIRMED, tabId, url };
}

export function navigationFailed(tabId, reason) {
  return { kind: EventKind.NAVIGATION_FAILED, tabId, reason };
}

export function settingsChanged(enabled, rules) {
  return { kind: EventKind.SETTINGS_CHANGED, enabled, rules };
}
