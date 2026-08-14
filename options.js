import { loadConfig, saveConfig } from './managed-apps/settings.js';
import { sanitizeDomain, isValidDomain } from './managed-apps/rule.js';

const STATUS_TIMEOUT = 2500;

const elements = {
  form: document.getElementById('add-form'),
  input: document.getElementById('domain-input'),
  list: document.getElementById('domain-list'),
  enabled: document.getElementById('enabled'),
  status: document.getElementById('status'),
};

let config = null;
let editingIndex = -1;
let statusTimer = 0;

function showStatus(message, isError) {
  elements.status.textContent = message;
  elements.status.classList.toggle('error', Boolean(isError));
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    elements.status.textContent = '';
  }, STATUS_TIMEOUT);
}

async function persist(message) {
  config = await saveConfig(config);
  render();
  showStatus(message, false);
}

function createButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = className;
  button.addEventListener('click', onClick);
  return button;
}

function buildEditingItem(domain, index) {
  const item = document.createElement('li');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = domain;
  input.spellcheck = false;
  const save = createButton('Save', 'primary', () => {
    commitEdit(index, input.value);
  });
  const cancel = createButton('Cancel', 'link', () => {
    editingIndex = -1;
    render();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      commitEdit(index, input.value);
    }
    if (event.key === 'Escape') {
      editingIndex = -1;
      render();
    }
  });
  item.append(input, save, cancel);
  return item;
}

function buildReadOnlyItem(domain, index) {
  const item = document.createElement('li');
  const label = document.createElement('span');
  label.className = 'pattern';
  label.textContent = domain;
  const edit = createButton('Edit', 'link', () => {
    editingIndex = index;
    render();
  });
  const remove = createButton('Remove', 'danger', () => {
    config.domains.splice(index, 1);
    editingIndex = -1;
    persist(`Removed ${domain}.`);
  });
  item.append(label, edit, remove);
  return item;
}

function render() {
  elements.enabled.checked = config.enabled;
  const items = config.domains.map((domain, index) => {
    let item = null;
    if (index === editingIndex) {
      item = buildEditingItem(domain, index);
    } else {
      item = buildReadOnlyItem(domain, index);
    }
    return item;
  });
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No domains yet. Add one above.';
    items.push(empty);
  }
  elements.list.replaceChildren(...items);
  const editingInput = elements.list.querySelector('input[type="text"]');
  if (editingInput) {
    editingInput.focus();
  }
}

function commitEdit(index, rawValue) {
  const domain = sanitizeDomain(rawValue);
  const valid = isValidDomain(domain);
  const duplicateIndex = config.domains.indexOf(domain);
  if (!valid) {
    showStatus(`${rawValue} is not a valid domain.`, true);
  } else if (duplicateIndex !== -1 && duplicateIndex !== index) {
    showStatus(`${domain} is already in the list.`, true);
  } else {
    config.domains[index] = domain;
    editingIndex = -1;
    persist(`Saved ${domain}.`);
  }
}

function addDomain(rawValue) {
  const domain = sanitizeDomain(rawValue);
  const valid = isValidDomain(domain);
  const isDuplicate = config.domains.includes(domain);
  if (!valid) {
    showStatus(`${rawValue} is not a valid domain.`, true);
  } else if (isDuplicate) {
    showStatus(`${domain} is already in the list.`, true);
  } else {
    config.domains.push(domain);
    elements.input.value = '';
    persist(`Added ${domain}.`);
  }
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  addDomain(elements.input.value);
});

elements.enabled.addEventListener('change', () => {
  config.enabled = elements.enabled.checked;
  persist('Saved.');
});

config = await loadConfig();
render();
