export const STORAGE_KEY = 'domainTabSaver';

export const DEFAULT_CONFIG = {
  enabled: true,
  reuseUrl: true,
  scopePerWindow: false,
  domains: [],
};

export function sanitizeDomain(input) {
  let value = String(input).trim().toLowerCase();
  value = value.replace(/^[a-z0-9+.-]+:\/\//, '');
  value = value.replace(/^[^/]*@/, '');
  value = value.replace(/[/?#].*$/, '');
  value = value.replace(/:\d+$/, '');
  value = value.replace(/^\.+/, '');
  value = value.replace(/\.+$/, '');
  return value;
}

export function normalizeDomains(domains) {
  let list = [];
  if (Array.isArray(domains)) {
    list = domains;
  }
  const cleaned = list.map(sanitizeDomain).filter(Boolean);
  const unique = [...new Set(cleaned)];
  return unique;
}

export function isValidDomain(pattern) {
  const value = sanitizeDomain(pattern);
  let base = value;
  if (base.startsWith('*.')) {
    base = base.slice(2);
  }
  const looksLikeHost = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(base);
  return looksLikeHost;
}

export function matchesDomain(hostname, pattern) {
  const host = String(hostname).toLowerCase();
  const rule = sanitizeDomain(pattern);
  let matched = false;
  if (rule.startsWith('*.')) {
    const base = rule.slice(2);
    matched = host === base || host.endsWith(`.${base}`);
  } else {
    matched = host === rule;
  }
  return matched;
}

export function findMatchingPattern(url, patterns) {
  let matched = null;
  let hostname = '';
  try {
    const parsed = new URL(String(url));
    const isWeb = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (isWeb) {
      hostname = parsed.hostname.toLowerCase();
    }
  } catch (error) {
    hostname = '';
  }
  if (hostname) {
    const hit = patterns.find((pattern) => {
      return matchesDomain(hostname, pattern);
    });
    if (hit) {
      matched = hit;
    }
  }
  return matched;
}

export async function loadConfig() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const saved = stored[STORAGE_KEY];
  let config = { ...DEFAULT_CONFIG };
  if (saved && typeof saved === 'object') {
    config = { ...DEFAULT_CONFIG, ...saved };
  }
  config.enabled = Boolean(config.enabled);
  config.reuseUrl = Boolean(config.reuseUrl);
  config.scopePerWindow = Boolean(config.scopePerWindow);
  config.domains = normalizeDomains(config.domains);
  return config;
}

export async function saveConfig(config) {
  const payload = {
    enabled: Boolean(config.enabled),
    reuseUrl: Boolean(config.reuseUrl),
    scopePerWindow: Boolean(config.scopePerWindow),
    domains: normalizeDomains(config.domains),
  };
  await chrome.storage.sync.set({ [STORAGE_KEY]: payload });
  return payload;
}

export function parseImportedConfig(text) {
  const parsed = JSON.parse(text);
  let source = parsed;
  if (parsed && typeof parsed === 'object' && parsed[STORAGE_KEY]) {
    source = parsed[STORAGE_KEY];
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('The file does not contain a Domain Tab Saver configuration.');
  }
  const domains = normalizeDomains(source.domains);
  if (domains.length === 0) {
    throw new Error('The file does not contain any valid domain.');
  }
  const config = { ...DEFAULT_CONFIG, ...source };
  config.domains = domains;
  return config;
}
