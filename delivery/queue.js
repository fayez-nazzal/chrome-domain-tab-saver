export function createQueue(initialState, decide, onActions) {
  let state = initialState;
  let chain = Promise.resolve();

  function runStep(getEvent) {
    chain = chain.then(async () => {
      const event = await getEvent();
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

  function enqueue(event) {
    return runStep(() => event);
  }

  function enqueueAsync(getEvent) {
    return runStep(getEvent);
  }

  function getState() {
    return state;
  }

  return { enqueue, enqueueAsync, getState };
}
