(() => {
  "use strict";

  const originalFetch = window.fetch;

  function lockedFetch(...args) {
    const requestUrl = args[0];
    if (requestUrl.includes("/api/light/eventsessions/") && requestUrl.includes("/setUserInvolvementStatus")) {
      const fetchArgs = {
        ...args[1],
        body: "isFocused=true&isSoundEnabled=true&isVideoEnabled=true"
      };
      console.log("Hijacking AC request...");
      return originalFetch.apply(this, [requestUrl, fetchArgs]);
    } else {
      return originalFetch.apply(this, args);
    }
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
