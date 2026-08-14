import { ActionKind } from '../routing/action.js';
import { navigationConfirmed } from '../routing/event.js';

export function createPerformActions(adapter, enqueue) {
  async function performActions(actions) {
    for (const action of actions) {
      if (action.kind === ActionKind.NAVIGATE_HOME) {
        await adapter.navigateTab(action.tabId, action.url);
        enqueue(navigationConfirmed(action.tabId, action.url));
      } else if (action.kind === ActionKind.FOCUS_TAB) {
        await adapter.focusTab(action.tabId);
      } else if (action.kind === ActionKind.CLOSE_TAB) {
        await adapter.closeTab(action.tabId);
      }
    }
  }
  return performActions;
}
