import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GuestDashboardContext } from "./guest-dashboard-context";
import { fetchMyProfile } from "@/services/guestApi";
import { fetchFoodItems } from "@/services/foodApi";
import {
  createServiceRequest as createServiceRequestApi,
  fetchMyServiceRequests,
} from "@/services/serviceRequestApi";
import type {
  GuestInfo,
  MenuItem,
  Order,
  ServiceRequest,
  ServiceRequestType,
} from "@/types/guest-dashboard";
import { updateDND as updateDndApi } from "@/services/dndApi";
import {
  placeOrder as placeOrderApi,
  verifyPayment as verifyPaymentApi,
  fetchMyOrders,
} from "@/services/orderApi";
import { openRazorpayCheckout } from "@/services/razorpayCheckout";

type LoadState = "loading" | "success" | "error";

type Failure = { message: string; retry: (() => void) | null };

export type GuestDashboardValue = {
  guest: GuestInfo | null;
  guestState: LoadState;
  refetchGuest: () => void;
  dnd: boolean;
  dndPending: boolean;
  toggleDND: (value: boolean) => void;

  menu: MenuItem[];
  menuState: LoadState;

  orders: Order[];
  ordersState: LoadState;
  placeOrder: (
    items: { foodItemId: string; quantity: number }[],
    paymentMethod: "COD" | "ONLINE",
  ) => Promise<void>;
  refreshOrders: () => Promise<void>;

  requests: ServiceRequest[];
  requestsState: LoadState;
  sendServiceRequest: (
    type: ServiceRequestType,
    description?: string,
    items?: string[],
  ) => Promise<void>;
  refreshRequests: () => Promise<void>;

  refreshing: boolean;
  refreshAll: () => Promise<void>;

  failure: Failure | null;
  runFailureRetry: () => void;
  clearFailure: () => void;
};

export function GuestDashboardProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [guestState, setGuestState] = useState<LoadState>("loading");

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuState, setMenuState] = useState<LoadState>("loading");

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersState, setOrdersState] = useState<LoadState>("loading");

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [requestsState, setRequestsState] = useState<LoadState>("loading");

  const [refreshing, setRefreshing] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [dndPending, setDndPending] = useState(false);
  const dndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearFailure = useCallback(() => setFailure(null), []);
  const reportFailure = useCallback(
    (message: string, retry: (() => void) | null = null) =>
      setFailure({ message, retry }),
    [],
  );

  const toggleDND = useCallback(
    (value: boolean) => {
      setGuest((current) =>
        current ? { ...current, dndEnabled: value } : current,
      );
      setDndPending(true);
      if (dndTimer.current) clearTimeout(dndTimer.current);
      dndTimer.current = setTimeout(() => {
        updateDndApi(value)
          .catch(() => {
            reportFailure("Couldn't update Do Not Disturb. Please retry.");
            setGuest((current) =>
              current ? { ...current, dndEnabled: !value } : current,
            );
          })
          .finally(() => setDndPending(false));
      }, 500);
    },
    [reportFailure],
  );

  useEffect(
    () => () => {
      if (dndTimer.current) clearTimeout(dndTimer.current);
    },
    [],
  );

  const loadGuest = useCallback(async () => {
    setGuestState("loading");
    try {
      const result = await fetchMyProfile();
      setGuest(result);
      setGuestState("success");
    } catch {
      setGuestState("error");
    }
  }, []);

  const loadMenu = useCallback(async () => {
    setMenuState("loading");
    try {
      const result = await fetchFoodItems();
      setMenu(result);
      setMenuState("success");
    } catch {
      setMenuState("error");
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersState("loading");
    try {
      const result = await fetchMyOrders();
      setOrders(result);
      setOrdersState("success");
    } catch {
      setOrdersState("error");
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestsState("loading");
    try {
      const result = await fetchMyServiceRequests();
      setRequests(result);
      setRequestsState("success");
    } catch {
      setRequestsState("error");
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- intentionally trigger the initial async data fetch on mount, which sets loading state synchronously
    loadGuest();
    loadMenu();
    loadOrders();
    loadRequests();
  }, [loadGuest, loadMenu, loadOrders, loadRequests]);

  const placeOrder = useCallback(
    async (
      items: { foodItemId: string; quantity: number }[],
      paymentMethod: "COD" | "ONLINE",
    ) => {
      try {
        const result = await placeOrderApi(items, paymentMethod);

        if (paymentMethod === "COD" || !result.razorpay) {
          await loadOrders();
          return;
        }

        // ONLINE: open Razorpay checkout, then verify on success.
        await new Promise<void>((resolve, reject) => {
          openRazorpayCheckout({
            keyId: result.razorpay!.keyId,
            amount: result.razorpay!.amount,
            currency: result.razorpay!.currency,
            orderId: result.razorpay!.orderId,
            guestName: guest?.name,
            onSuccess: async (response) => {
              try {
                await verifyPaymentApi({
                  orderId: result.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                await loadOrders();
                resolve();
              } catch (err) {
                reject(
                  err instanceof Error
                    ? err
                    : new Error("Payment verification failed"),
                );
              }
            },
            onDismiss: () => {
              reject(new Error("Payment was cancelled"));
            },
          });
        });
      } catch (err) {
        reportFailure(
          err instanceof Error ? err.message : "Failed to place order",
          // oxlint-disable-next-line react/immutability -- recursive self-reference so the failed attempt can be retried
          () => placeOrder(items, paymentMethod),
        );
        throw err;
      }
    },
    // oxlint-disable-next-line react/memo-dependencies -- `guest` is not read directly; only its changing identity should invalidate this memo
    [loadOrders, reportFailure, guest],
  );

  const sendServiceRequest = useCallback(
    async (
      type: ServiceRequestType,
      description?: string,
      items?: string[],
    ) => {
      try {
        await createServiceRequestApi(type, description, items);
        await loadRequests();
      } catch (err) {
        reportFailure(
          err instanceof Error ? err.message : "Failed to send request",
          // oxlint-disable-next-line react/immutability -- recursive self-reference so the failed attempt can be retried
          () => sendServiceRequest(type, description, items),
        );
        throw err;
      }
    },
    // oxlint-disable-next-line react/memo-dependencies -- all referenced helpers are stable useCallback functions with [] deps
    [loadRequests, reportFailure],
  );

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadGuest(),
        loadMenu(),
        loadOrders(),
        loadRequests(),
      ]);
    } finally {
      setRefreshing(false);
    }
    // oxlint-disable-next-line react/memo-dependencies -- all four loaders are stable useCallback functions whose identities never change
  }, [loadGuest, loadMenu, loadOrders, loadRequests]);

  const runFailureRetry = useCallback(() => {
    const retry = failure?.retry;
    setFailure(null);
    retry?.();
  }, [failure]);

  const value = useMemo<GuestDashboardValue>(
    () => ({
      guest,
      guestState,
      refetchGuest: loadGuest,
      dnd: guest?.dndEnabled ?? false,
      dndPending,
      toggleDND,
      menu,
      menuState,
      orders,
      ordersState,
      placeOrder,
      refreshOrders: loadOrders,
      requests,
      requestsState,
      sendServiceRequest,
      refreshRequests: loadRequests,
      refreshing,
      refreshAll,
      failure,
      runFailureRetry,
      clearFailure,
    }),
    [
      guest,
      guestState,
      loadGuest,
      dndPending,
      toggleDND,
      menu,
      menuState,
      orders,
      ordersState,
      placeOrder,
      loadOrders,
      requests,
      requestsState,
      sendServiceRequest,
      loadRequests,
      refreshing,
      refreshAll,
      failure,
      runFailureRetry,
      clearFailure,
    ],
  );

  return (
    <GuestDashboardContext.Provider value={value}>
      {children}
    </GuestDashboardContext.Provider>
  );
}
