import { useEffect, useState } from "react";

/** Client-only ticking clock (avoids SSR hydration mismatch on the date/time). */
export function useRoomClock(intervalMs = 30_000) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
