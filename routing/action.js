export const ActionKind = {
  NAVIGATE_HOME: 'NAVIGATE_HOME',
  FOCUS_TAB: 'FOCUS_TAB',
  CLOSE_TAB: 'CLOSE_TAB',
  PERSIST_HOME_TABS: 'PERSIST_HOME_TABS',
};

export function navigateHome(tabId, url) {
  return { kind: ActionKind.NAVIGATE_HOME, tabId, url };
}

export function focusTab(tabId) {
  return { kind: ActionKind.FOCUS_TAB, tabId };
}

export function closeTab(tabId) {
  return { kind: ActionKind.CLOSE_TAB, tabId };
}

export function persistHomeTabs(homeTabs) {
  return { kind: ActionKind.PERSIST_HOME_TABS, homeTabs };
}
