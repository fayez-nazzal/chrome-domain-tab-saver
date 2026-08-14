export function createQueue(initialState, decide, onActions) {
  let state = initialState;
  let chain = Promise.resolve();

  function enqueue(event) {
    chain = chain.then(async () => {
      const result = decide(state, event);
      state = result.state;
      if (onActions) {
        try {
          await onActions(result.actions, event);
        } catch (error) {
          console.warn('Domain Tab Saver could not perform actions.', error);
        }
      }
    });
    return chain;
  }

  function getState() {
    return state;
  }

  return { enqueue, getState };
}
