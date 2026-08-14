import { loadConfig, findMatchingPattern } from './config.js';

const programmaticUpdates = new Set();
const inFlightTabs = new Set();

function pickKeeper(tabs) {
  const sorted = [...tabs].sort((left, right) => {
    return left.id - right.id;
  });
  return sorted[0];
}

async function collectSiblings(tab, pattern) {
  const allTabs = await chrome.tabs.query({});
  const siblings = allTabs.filter((candidate) => {
    let keep = candidate.id !== tab.id;
    if (keep) {
      keep = Boolean(findMatchingPattern(candidate.url, [pattern]));
    }
    return keep;
  });
  return siblings;
}

async function foldIntoKeeper(keeper, tab) {
  if (tab.url && keeper.url !== tab.url) {
    programmaticUpdates.add(keeper.id);
    await chrome.tabs.update(keeper.id, { url: tab.url });
  }
  await chrome.tabs.update(keeper.id, { active: true });
  await chrome.windows.update(keeper.windowId, { focused: true });
  await chrome.tabs.remove(tab.id);
}

async function handleCandidateTab(tab) {
  const wasProgrammatic = programmaticUpdates.delete(tab.id);
  const isBusy = inFlightTabs.has(tab.id);
  if (!wasProgrammatic && !isBusy && tab.url) {
    inFlightTabs.add(tab.id);
    try {
      const config = await loadConfig();
      if (config.enabled) {
        const pattern = findMatchingPattern(tab.url, config.domains);
        if (pattern) {
          const siblings = await collectSiblings(tab, pattern);
          const keeper = pickKeeper(siblings);
          if (keeper) {
            await foldIntoKeeper(keeper, tab);
          }
        }
      }
    } catch (error) {
      console.warn('Domain Tab Saver could not handle the tab.', error);
    } finally {
      inFlightTabs.delete(tab.id);
    }
  }
}

chrome.tabs.onCreated.addListener((tab) => {
  const url = tab.url || tab.pendingUrl;
  handleCandidateTab({ ...tab, url });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleCandidateTab({ ...tab, url: changeInfo.url });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  programmaticUpdates.delete(tabId);
  inFlightTabs.delete(tabId);
});
