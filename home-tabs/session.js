const SESSION_KEY = 'domainTabSaverHomeTabs';

export async function loadHomeTabs(adapter) {
  const stored = await adapter.readSession(SESSION_KEY);
  let registry = {};
  if (stored && typeof stored === 'object') {
    registry = stored;
  }
  return registry;
}

export async function saveHomeTabs(adapter, registry) {
  await adapter.writeSession(SESSION_KEY, registry);
}
