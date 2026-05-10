import { useCallback, useRef, useState } from "react";

export interface StopwatchState {
  elapsed: number;
  isRunning: boolean;
  start: () => void;
  stop: () => number;
  reset: () => void;
  toggle: () => number | null;
}

export function useStopwatch(): StopwatchState {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimeRef.current = performance.now();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const now = performance.now();
      const newElapsed = now - (startTimeRef.current ?? now);
      elapsedRef.current = newElapsed;
      setElapsed(newElapsed);
    }, 16);
  }, []);

  const stop = useCallback((): number => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    const finalElapsed = elapsedRef.current;
    return finalElapsed;
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
    elapsedRef.current = 0;
    setIsRunning(false);
    setElapsed(0);
  }, []);

  const toggle = useCallback((): number | null => {
    if (isRunning) {
      return stop();
    } else {
      start();
      return null;
    }
  }, [isRunning, start, stop]);

  return { elapsed, isRunning, start, stop, reset, toggle };
}

export function formatHangtime(ms: number): string {
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
}
