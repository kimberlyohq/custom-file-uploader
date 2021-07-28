import { useState, useRef, useEffect } from "react";

export const usePaused = (initialState) => {
  const [isPaused, setIsPaused] = useState(initialState);
  // mutable ref to store current callback
  const callbackRef = useRef(null);

  const setPaused = (state, callback) => {
    callbackRef.current = callback;
    setIsPaused(state);
  };

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
