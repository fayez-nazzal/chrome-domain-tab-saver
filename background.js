import { loadConfig } from './managed-apps/settings.js';
import { createQueue } from './delivery/queue.js';
import { createPerformActions } from './delivery/perform.js';
import { decide } from './routing/decide.js';
import { emptyState } from './routing/state.js';
import { settingsChanged, tabOpened, tabNavigated, tabClosed } from './routing/event.js';
import { liveAdapter } from './chrome/live.js';

let performActions = null;

const queue = createQueue(emptyState(), decide, (actions) => {
  return performActions(actions);
});

performActions = createPerformActions(liveAdapter, queue.enqueue);

async function handleTabCandidate(makeEvent, tabId, windowId, url) {
  if (url) {
    const config = await loadConfig();
    queue.enqueue(settingsChanged(config.enabled, config.domains));
    queue.enqueue(makeEvent(tabId, windowId, url));
  }
}

liveAdapter.onTabOpened((tab) => {
  handleTabCandidate(tabOpened, tab.tabId, tab.windowId, tab.url);
});

liveAdapter.onTabNavigated((tab) => {
  handleTabCandidate(tabNavigated, tab.tabId, tab.windowId, tab.url);
});

liveAdapter.onTabClosed((tab) => {
  queue.enqueue(tabClosed(tab.tabId));
});
