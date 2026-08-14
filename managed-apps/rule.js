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

export function findMatchingRule(url, patterns) {
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
