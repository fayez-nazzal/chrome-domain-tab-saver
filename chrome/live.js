export const liveAdapter = {
  navigateTab: async (tabId, url) => {
    await chrome.tabs.update(tabId, { url });
  },
  focusTab: async (tabId) => {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  },
  closeTab: async (tabId) => {
    await chrome.tabs.remove(tabId);
  },
  listTabs: async () => {
    return chrome.tabs.query({});
  },
  onTabOpened: (fn) => {
    chrome.tabs.onCreated.addListener((tab) => {
      const url = tab.url || tab.pendingUrl;
      fn({ tabId: tab.id, windowId: tab.windowId, url });
    });
  },
  onTabNavigated: (fn) => {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url) {
        fn({ tabId, windowId: tab.windowId, url: changeInfo.url });
      }
    });
  },
  onTabClosed: (fn) => {
    chrome.tabs.onRemoved.addListener((tabId) => {
      fn({ tabId });
    });
  },
};
