export function createFakeChrome() {
  const tabs = new Map();
  const listeners = { onCreated: [], onUpdated: [], onRemoved: [] };
  const syncStorage = {};
  const forced = { navigateTab: null, closeTab: null };
  let nextTabId = 1;

  function addTab(tab) {
    let id = tab.id;
    if (id === undefined) {
      id = nextTabId;
      nextTabId = nextTabId + 1;
    }
    let windowId = tab.windowId;
    if (windowId === undefined) {
      windowId = 1;
    }
    const stored = { id, url: tab.url, windowId, active: false };
    tabs.set(id, stored);
    return stored;
  }

  const chrome = {
    tabs: {
      query: async () => {
        return [...tabs.values()];
      },
      get: async (tabId) => {
        return tabs.get(tabId);
      },
      update: async (tabId, updateInfo) => {
        if (forced.navigateTab && updateInfo.url) {
          throw forced.navigateTab;
        }
        const tab = tabs.get(tabId);
        if (tab) {
          Object.assign(tab, updateInfo);
        }
        return tab;
      },
      remove: async (tabId) => {
        if (forced.closeTab) {
          throw forced.closeTab;
        }
        tabs.delete(tabId);
        for (const fn of listeners.onRemoved) {
          fn(tabId, {});
        }
      },
      onCreated: {
        addListener: (fn) => {
          listeners.onCreated.push(fn);
        },
      },
      onUpdated: {
        addListener: (fn) => {
          listeners.onUpdated.push(fn);
        },
      },
      onRemoved: {
        addListener: (fn) => {
          listeners.onRemoved.push(fn);
        },
      },
    },
    windows: {
      update: async (windowId, updateInfo) => {
        return { id: windowId, ...updateInfo };
      },
    },
    storage: {
      sync: {
        get: async (key) => {
          const result = {};
          result[key] = syncStorage[key];
          return result;
        },
        set: async (items) => {
          Object.assign(syncStorage, items);
        },
      },
    },
  };

  const fake = {
    chrome,
    openTab: (tab) => {
      const stored = addTab(tab);
      for (const fn of listeners.onCreated) {
        fn({ ...stored });
      }
      return stored;
    },
    listTabIds: () => {
      return [...tabs.keys()];
    },
    getTab: (tabId) => {
      return tabs.get(tabId);
    },
    setSyncStorage: (key, value) => {
      syncStorage[key] = value;
    },
    forceNavigateTabError: (error) => {
      forced.navigateTab = error;
    },
    forceCloseTabError: (error) => {
      forced.closeTab = error;
    },
  };

  return fake;
}
