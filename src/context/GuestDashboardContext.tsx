import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useDND } from "@/hooks/useDND";
import { useOrders } from "@/hooks/useOrders";
import { findRoom } from "@/data/rooms";
import type { GuestInfo, Room, ServiceRequest } from "@/types/guest-dashboard";

type Failure = { message: string; retry: (() => void) | null };

type GuestDashboardValue = {
  room: Room;
  guest: GuestInfo;
  requests: ServiceRequest[];
  dnd: boolean;
  dndPending: boolean;
  toggleDND: (value: boolean) => void;
  pendingKind: ReturnType<typeof useOrders>["pendingKind"];
  submitError: string | null;
  clearSubmitError: () => void;
  refreshing: boolean;
  refreshed: boolean;
  hasPendingUpdate: boolean;
  placeOrder: ReturnType<typeof useOrders>["placeOrder"];
  sendAmenityRequest: ReturnType<typeof useOrders>["sendAmenityRequest"];
  sendServiceRequest: ReturnType<typeof useOrders>["sendServiceRequest"];
  refreshStatus: () => Promise<void>;
  failure: Failure | null;
  runFailureRetry: () => void;
};

const GuestDashboardContext = createContext<GuestDashboardValue | null>(null);

/**
 * Single source of truth for the Guest Dashboard.
 * All server interactions funnel through the action functions below
 * (`placeOrder`, `sendAmenityRequest`, `sendServiceRequest`, `toggleDND`,
 * `refreshStatus`) — swap their mock calls for real API calls to go live.
 */
export function GuestDashboardProvider({
  roomNumber,
  children,
}: {
  /** Comes from the QR code query param (`?room=204`). */
  roomNumber?: string | undefined;
  children: ReactNode;
}) {
  const [failure, setFailure] = useState<Failure | null>(null);

  const clearFailure = useCallback(() => setFailure(null), []);
  const reportFailure = useCallback(
    (message: string, retry: (() => void) | null = null) => setFailure({ message, retry }),
    [],
  );
  const reportOrderFailure = useCallback(
    (message: string, retry: () => void) => reportFailure(message, retry),
    [reportFailure],
  );
  const reportDndFailure = useCallback(
    (message: string) => reportFailure(message),
    [reportFailure],
  );

  const orders = useOrders({ onFailure: reportOrderFailure, clearFailure });
  const { dnd, dndPending, toggleDND } = useDND(reportDndFailure);

  const room = useMemo(() => findRoom(roomNumber), [roomNumber]);
  const guest = useMemo<GuestInfo>(() => ({ name: room.guestName, tier: room.tier }), [room]);

  const runFailureRetry = useCallback(() => {
    const retry = failure?.retry;
    setFailure(null);
    retry?.();
  }, [failure]);

  const value = useMemo<GuestDashboardValue>(
    () => ({
      room,
      guest,
      dnd,
      dndPending,
      toggleDND,
      failure,
      runFailureRetry,
      ...orders,
    }),
    [room, guest, dnd, dndPending, toggleDND, failure, runFailureRetry, orders],
  );

  return <GuestDashboardContext.Provider value={value}>{children}</GuestDashboardContext.Provider>;
}

export function useGuestDashboard() {
  const context = useContext(GuestDashboardContext);
  if (!context) {
    throw new Error("useGuestDashboard must be used inside a GuestDashboardProvider");
  }
  return context;
}
