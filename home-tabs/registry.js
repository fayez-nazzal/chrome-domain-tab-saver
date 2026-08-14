export function adopt(registry, scopeKey, tabId) {
  return { ...registry, [scopeKey]: tabId };
}

export function forget(registry, scopeKey) {
  const next = { ...registry };
  delete next[scopeKey];
  return next;
}

export function lookup(registry, scopeKey) {
  return registry[scopeKey];
}

export function prune(registry, liveTabIds) {
  const liveSet = new Set(liveTabIds);
  const next = {};
  for (const scopeKey of Object.keys(registry)) {
    const tabId = registry[scopeKey];
    if (liveSet.has(tabId)) {
      next[scopeKey] = tabId;
    }
  }
  return next;
}
