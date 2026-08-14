import { loadConfig, saveConfig, findMatchingPattern } from './config.js';

const STATUS_TIMEOUT = 2000;

const elements = {
  enabled: document.getElementById('enabled'),
  host: document.getElementById('host'),
  state: document.getElementById('state'),
  addExact: document.getElementById('add-exact'),
  addWildcard: document.getElementById('add-wildcard'),
  remove: document.getElementById('remove'),
  status: document.getElementById('status'),
  openOptions: document.getElementById('open-options'),
};

let config = null;
let hostname = '';
let statusTimer = 0;

function readHostname(url) {
  let host = '';
  try {
    const parsed = new URL(String(url));
    const isWeb = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (isWeb) {
      host = parsed.hostname.toLowerCase();
    }
  } catch (error) {
    host = '';
  }
  return host;
}

function buildWildcard(host) {
  const parts = host.split('.');
  let base = host;
  if (parts.length > 2) {
    base = parts.slice(1).join('.');
  }
  return `*.${base}`;
}

function showStatus(message) {
  elements.status.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    elements.status.textContent = '';
  }, STATUS_TIMEOUT);
}

async function persist(message) {
  config = await saveConfig(config);
  render();
  showStatus(message);
}

function render() {
  elements.enabled.checked = config.enabled;
  elements.host.textContent = hostname || 'This page cannot be managed';
  const matched = findMatchingPattern(`https://${hostname}`, config.domains);
  const wildcard = buildWildcard(hostname);
  const hasHost = Boolean(hostname);
  elements.addExact.hidden = true;
  elements.addWildcard.hidden = true;
  elements.remove.hidden = true;
  if (!hasHost) {
    elements.state.textContent = 'Open a normal web page to add its domain.';
  } else if (matched) {
    elements.state.textContent = `Managed by ${matched}.`;
    elements.remove.hidden = false;
    elements.remove.textContent = `Remove ${matched}`;
    elements.remove.dataset.pattern = matched;
  } else {
    elements.state.textContent = 'Not managed yet.';
    elements.addExact.hidden = false;
    elements.addExact.textContent = `Add ${hostname}`;
    elements.addWildcard.hidden = false;
    elements.addWildcard.textContent = `Add ${wildcard}`;
  }
}

elements.enabled.addEventListener('change', () => {
  config.enabled = elements.enabled.checked;
  persist('Saved.');
});

elements.addExact.addEventListener('click', () => {
  config.domains.push(hostname);
  persist(`Added ${hostname}.`);
});

elements.addWildcard.addEventListener('click', () => {
  const wildcard = buildWildcard(hostname);
  config.domains.push(wildcard);
  persist(`Added ${wildcard}.`);
});

elements.remove.addEventListener('click', () => {
  const pattern = elements.remove.dataset.pattern;
  config.domains = config.domains.filter((domain) => {
    return domain !== pattern;
  });
  persist(`Removed ${pattern}.`);
});

elements.openOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
if (activeTab) {
  hostname = readHostname(activeTab.url);
}
config = await loadConfig();
render();
