import { findMatchingRule } from '../managed-apps/rule.js';
import { prune } from '../home-tabs/registry.js';

export function emptyState() {
  return {
    enabled: true,
    rules: [],
    homeTabs: {},
    awaiting: {},
  };
}

export function reconcile(homeTabs, liveTabs, rules) {
  const liveTabById = new Map(liveTabs.map((tab) => [tab.id, tab]));
  const liveTabIds = liveTabs.map((tab) => tab.id);
  const pruned = prune(homeTabs, liveTabIds);
  const reconciled = {};
  for (const scopeKey of Object.keys(pruned)) {
    const tabId = pruned[scopeKey];
    const tab = liveTabById.get(tabId);
    const stillMatches = Boolean(findMatchingRule(tab.url, rules));
    if (stillMatches) {
      reconciled[scopeKey] = tabId;
    }
  }
  return reconciled;
}
