// @flow

import { useState, useRef, useEffect, useCallback } from "react";

type usePausedProps = {
  initialState?: boolean,
};

type UsePausedReturnValue = [usePausedProps, (state: usePausedProps) => any];

export const usePaused = (
  initialState: usePausedProps
): UsePausedReturnValue => {
  const [isPaused, setIsPaused] = useState(initialState);
  // mutable ref to store current callback
  const callbackRef = useRef(null);

  const setPaused = useCallback((state: usePausedProps, callback) => {
    callbackRef.current = callback;
    setIsPaused(state);
  }, []);

  useEffect(() => {
    if (callbackRef.current) {
      // invoke the callback with the latest state
      callbackRef.current(isPaused);
      // reset callback
      callbackRef.current = null;
    }
  }, [isPaused]);

  return [isPaused, setPaused];
};
