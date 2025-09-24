(() => {
  "use strict";

  const fetch = window.fetch;

  function lockedFetch(...args) {

    try {
      const requestUrl = args[0];
      if (requestUrl.includes("/eventsessions/") && requestUrl.includes("/attentionControlCheckpoints")) {
        return fetch.apply(this, {
          ...args,
          body: {
            isFocused: true,
            isSoundEnabled: true,
            isVideoEnabled: true
          }
        });
      }
    } catch (e) { }

    return fetch.apply(this, args);
  }

  Object.freeze(lockedFetch);
  Object.freeze(lockedFetch.prototype);

  Object.defineProperty(window, "fetch", {
    configurable: false,
    enumerable: true,
    set: (_) => { },
    get: () => lockedFetch
  });
})();
