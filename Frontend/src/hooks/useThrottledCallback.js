import { useRef, useCallback, useEffect } from "react";

// Leading + trailing throttle. Always calls the LATEST callback, so socket
// handlers never work with stale filters/state.
const useThrottledCallback = (callback, delay = 1500) => {
  const cbRef = useRef(callback);
  const lastRun = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args) => {
      const remaining = delay - (Date.now() - lastRun.current);
      if (remaining <= 0) {
        clearTimeout(timer.current);
        timer.current = null;
        lastRun.current = Date.now();
        cbRef.current(...args);
      } else if (!timer.current) {
        timer.current = setTimeout(() => {
          timer.current = null;
          lastRun.current = Date.now();
          cbRef.current(...args);
        }, remaining);
      }
    },
    [delay],
  );
};

export default useThrottledCallback;
