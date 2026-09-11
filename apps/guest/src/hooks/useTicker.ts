import { useEffect, useState } from "react";

/** Forces periodic re-renders so relative timestamps stay live without refetching. */
export function useTicker(intervalMs = 30_000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
}
