import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { mockServer } from "@/data/mock-api";
import { SERVICE_LABEL, REFRESH_CONFIRM_MS } from "@/constants/service-flows";
import { createRequestId } from "@/utils/format";
import { initialStatus, isTerminal, nextStatus } from "@/utils/status";
import type {
  PaymentMethod,
  RequestItem,
  ServiceKind,
  ServiceRequest,
} from "@/types/guest-dashboard";

type FailureHandlers = {
  /** Surfaces a dashboard-level banner with an optional retry action. */
  onFailure: (message: string, retry: () => void) => void;
  clearFailure: () => void;
};

/**
 * Owns the guest's orders and requests.
 * Each exported action is the seam where a real API call replaces `mockServer`.
 */
export function useOrders({ onFailure, clearFailure }: FailureHandlers) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [pendingKind, setPendingKind] = useState<ServiceKind | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const createRequest = useCallback(
    async (
      kind: ServiceKind,
      items: RequestItem[],
      extra?: { total?: number; payment?: PaymentMethod },
    ): Promise<boolean> => {
      setPendingKind(kind);
      setSubmitError(null);
      clearFailure();
      try {
        await mockServer(true);
        const request: ServiceRequest = {
          id: createRequestId(),
          kind,
          items,
          total: extra?.total,
          payment: extra?.payment,
          status: initialStatus(kind),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setRequests((current) => [request, ...current]);
        toast.success(
          kind === "food" ? "Order placed — tracking it for you" : `${SERVICE_LABEL[kind]} sent`,
          { description: `Status: ${request.status}. Track it under My Orders & Requests.` },
        );
        return true;
      } catch {
        const message = "Service temporarily unreachable";
        setSubmitError(message);
        onFailure(
          `${message}. Nothing was charged or dispatched — you can retry or dial 0 for staff.`,
          () => {
            void createRequest(kind, items, extra);
          },
        );
        return false;
      } finally {
        setPendingKind(null);
      }
    },
    [onFailure, clearFailure],
  );

  const placeOrder = useCallback(
    (items: RequestItem[], total: number, payment: PaymentMethod) =>
      createRequest("food", items, { total, payment }),
    [createRequest],
  );

  const sendAmenityRequest = useCallback(
    (items: RequestItem[]) => createRequest("amenities", items),
    [createRequest],
  );

  const sendServiceRequest = useCallback(
    (kind: ServiceKind, items: RequestItem[]) => createRequest(kind, items),
    [createRequest],
  );

  const refreshStatus = useCallback(async () => {
    setRefreshing(true);
    clearFailure();
    const started = Date.now();
    try {
      await mockServer(true, 800);
      // Keep the spinner visible for a minimum beat so the change reads clearly.
      const wait = Math.max(0, 800 - (Date.now() - started));
      await new Promise((resolve) => setTimeout(resolve, wait));
      setRequests((current) =>
        current.map((request) => {
          const advanced = nextStatus(request.kind, request.status);
          return advanced
            ? { ...request, status: advanced, updatedAt: Date.now(), failed: undefined }
            : request;
        }),
      );
      setRefreshed(true);
      setTimeout(() => setRefreshed(false), REFRESH_CONFIRM_MS);
      toast.success("Status refreshed");
    } catch {
      onFailure(
        "Couldn't reach the server. Showing your last known statuses — pull again shortly.",
        () => {
          void refreshStatus();
        },
      );
    } finally {
      setRefreshing(false);
    }
  }, [onFailure, clearFailure]);

  const hasPendingUpdate = useMemo(
    () => requests.some((request) => !isTerminal(request.kind, request.status)),
    [requests],
  );

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  return {
    requests,
    pendingKind,
    submitError,
    clearSubmitError,
    refreshing,
    refreshed,
    hasPendingUpdate,
    placeOrder,
    sendAmenityRequest,
    sendServiceRequest,
    refreshStatus,
  };
}
