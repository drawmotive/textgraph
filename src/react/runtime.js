import { initializeTextGraph } from '../platform/browser.js';

/** A provider owns one lazy runtime; retaining it has no I/O during React render. */
export function createRuntimeResource(options) {
  let users = 0;
  let pending;
  return {
    retain() {
      users++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        users--;
        // StrictMode replays effects synchronously. Defer final release so that
        // replay reuses the same .NET module graph instead of starting another.
        queueMicrotask(() => {
          if (users !== 0 || !pending) return;
          const retiring = pending;
          pending = undefined;
          // Startup may finish after unmount. Dispose that instance as well;
          // there is no mounted view to receive startup or cleanup errors.
          void retiring.then(runtime => runtime.dispose()).catch(() => undefined);
        });
      };
    },
    get() {
      if (!pending) {
        const attempt = initializeTextGraph(options);
        pending = attempt;
        // A later input change may retry a failed startup.
        void attempt.catch(() => { if (pending === attempt) pending = undefined; });
      }
      return pending;
    },
  };
}
