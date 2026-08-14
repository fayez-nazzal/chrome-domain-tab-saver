export function createQueue(initialState, decide, onActions) {
  let state = initialState;
  let chain = Promise.resolve();

  function enqueue(event) {
    chain = chain.then(async () => {
      const result = decide(state, event);
      state = result.state;
      if (onActions) {
        await onActions(result.actions, event);
      }
    });
    return chain;
  }

  function getState() {
    return state;
  }

  return { enqueue, getState };
}
