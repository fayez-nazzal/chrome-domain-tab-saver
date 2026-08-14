import { normalizeDomains } from './rule.js';

export const STORAGE_KEY = 'domainTabSaver';

export const DEFAULT_CONFIG = {
  enabled: true,
  domains: [],
};

export async function loadConfig() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const saved = stored[STORAGE_KEY];
  let config = { ...DEFAULT_CONFIG };
  if (saved && typeof saved === 'object') {
    config = { ...DEFAULT_CONFIG, ...saved };
  }
  config.enabled = Boolean(config.enabled);
  config.domains = normalizeDomains(config.domains);
  return config;
}

export async function saveConfig(config) {
  const payload = {
    enabled: Boolean(config.enabled),
    domains: normalizeDomains(config.domains),
  };
  await chrome.storage.sync.set({ [STORAGE_KEY]: payload });
  return payload;
}
