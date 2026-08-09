import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mockServer } from "@/data/mock-api";
import { DND_DEBOUNCE_MS } from "@/constants/service-flows";

type FailureHandler = (message: string) => void;

/** Do Not Disturb with an optimistic toggle and a debounced server sync. */
export function useDND(onFailure: FailureHandler) {
  const [dnd, setDnd] = useState(false);
  const [dndPending, setDndPending] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    },
    [],
  );

  const toggleDND = useCallback(
    (value: boolean) => {
      setDnd(value);
      setDndPending(true);
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        mockServer({ dnd: value }, 500)
          .then(() => {
            toast.success(value ? "Do Not Disturb is on" : "Do Not Disturb is off", {
              description: "Housekeeping and reception have been notified.",
            });
          })
          .catch(() => {
            onFailure("Couldn't update Do Not Disturb. Room status unchanged — please retry.");
            setDnd((current) => !current);
          })
          .finally(() => setDndPending(false));
      }, DND_DEBOUNCE_MS);
    },
    [onFailure],
  );

  return { dnd, dndPending, toggleDND };
}
