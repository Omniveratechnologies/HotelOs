import { createContext, useContext } from "react";
import type { Order } from "../types";

export interface OrdersContextType {
  orders: Order[];
  activeOrders: Order[];
  latestOrder: Order | null;
  loading: boolean;
  addSessionOrder: (order: Order) => void;
  refreshOrders: () => Promise<void>;
}

export const OrdersContext = createContext<OrdersContextType | null>(null);

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return ctx;
}
