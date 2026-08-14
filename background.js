import { loadConfig } from './managed-apps/settings.js';
import { loadHomeTabs, saveHomeTabs } from './home-tabs/session.js';
import { createQueue } from './delivery/queue.js';
import { createPerformActions } from './delivery/perform.js';
import { decide } from './routing/decide.js';
import { emptyState } from './routing/state.js';
import { workerStarted, settingsChanged, tabOpened, tabNavigated, tabClosed } from './routing/event.js';
import { liveAdapter } from './chrome/live.js';

let performActions = null;

const queue = createQueue(emptyState(), decide, (actions) => {
  return performActions(actions);
});

const actionAdapter = {
  ...liveAdapter,
  saveHomeTabs: (homeTabs) => {
    return saveHomeTabs(liveAdapter, homeTabs);
  },
};

performActions = createPerformActions(actionAdapter, queue.enqueue);

queue.enqueueAsync(async () => {
  const storedHomeTabs = await loadHomeTabs(liveAdapter);
  const liveTabs = await liveAdapter.listTabs();
  const settings = await loadConfig();
  return workerStarted(liveTabs, storedHomeTabs, settings);
});

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
