import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SESSION_STORAGE_KEYS } from "@hotelos/utils";
import { api } from "../services/api";
import type { Order } from "../types";

export interface OrdersContextType {
  orders: Order[];
  activeOrders: Order[];
  latestOrder: Order | null;
  loading: boolean;
  addSessionOrder: (order: Order) => void;
  refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

const ACTIVE_STATUSES = new Set([
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
]);

export function OrdersProvider({
  hotelId,
  tableId,
  children,
}: {
  hotelId: string;
  tableId: string;
  children: ReactNode;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const storageKey = useMemo(
    () =>
      typeof SESSION_STORAGE_KEYS.ORDERS === "function"
        ? SESSION_STORAGE_KEYS.ORDERS(hotelId, tableId)
        : `hotelos_session_orders_${hotelId}_${tableId}`,
    [hotelId, tableId],
  );

  // Helper to persist order IDs in storage
  const persistOrderIds = useCallback(
    (orderList: Order[]) => {
      try {
        const ids = orderList.map((o) => o.id);
        const json = JSON.stringify(ids);
        window.localStorage.setItem(storageKey, json);
        window.sessionStorage.setItem(storageKey, json);
        if (orderList[0]?.id) {
          window.sessionStorage.setItem(
            `table-order:last-order:${hotelId}:${tableId}`,
            orderList[0].id,
          );
        }
      } catch {
        // ignore storage quota errors
      }
    },
    [storageKey, hotelId, tableId],
  );

  // Fetch or re-sync session orders from server
  const refreshOrders = useCallback(async () => {
    if (!hotelId) return;
    try {
      // 1. Try to fetch orders from backend session orders endpoint
      const serverOrders = await api.getSessionOrders();
      if (Array.isArray(serverOrders) && serverOrders.length > 0) {
        setOrders(serverOrders);
        persistOrderIds(serverOrders);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback: If getSessionOrders fails, fetch individual orders known from storage
    }

    // 2. Fallback to reading saved order IDs from storage
    try {
      const raw =
        window.localStorage.getItem(storageKey) ||
        window.sessionStorage.getItem(storageKey);
      const lastId = window.sessionStorage.getItem(
        `table-order:last-order:${hotelId}:${tableId}`,
      );

      const savedIds: string[] = raw ? JSON.parse(raw) : [];
      if (lastId && !savedIds.includes(lastId)) {
        savedIds.unshift(lastId);
      }

      if (savedIds.length > 0) {
        const fetched = await Promise.all(
          savedIds.slice(0, 15).map(async (id) => {
            try {
              return await api.getOrder(id);
            } catch {
              return null;
            }
          }),
        );
        const valid = fetched.filter((o): o is Order => Boolean(o));
        if (valid.length > 0) {
          setOrders(valid);
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, [hotelId, tableId, storageKey, persistOrderIds]);

  // Initial load
  useEffect(() => {
    let active = true;
    refreshOrders().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refreshOrders]);

  // Periodic polling for status changes (e.g. kitchen progresses order)
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshOrders().catch(() => {});
      }
    }, 6000);

    return () => window.clearInterval(interval);
  }, [refreshOrders]);

  const addSessionOrder = useCallback(
    (newOrder: Order) => {
      setOrders((prev) => {
        const filtered = prev.filter((o) => o.id !== newOrder.id);
        const updated = [newOrder, ...filtered];
        persistOrderIds(updated);
        return updated;
      });
    },
    [persistOrderIds],
  );

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.has(o.status)),
    [orders],
  );

  const latestOrder = useMemo(
    () => (orders.length > 0 ? orders[0] : null),
    [orders],
  );

  return (
    <OrdersContext.Provider
      value={{
        orders,
        activeOrders,
        latestOrder,
        loading,
        addSessionOrder,
        refreshOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return ctx;
}
