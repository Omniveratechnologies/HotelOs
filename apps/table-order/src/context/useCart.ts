import { createContext, useContext } from "react";
import type { CartItem, FoodItem, OrderType } from "../types";

export interface CartContextValue {
  hotelId: string;
  tableId: string;
  tableNumber: string;
  setTableNumber: (v: string) => void;
  orderType: OrderType;
  setOrderType: (value: OrderType) => void;
  items: CartItem[];
  addItem: (
    item: FoodItem,
    quantity?: number,
    specialInstructions?: string,
    addons?: Array<{ name: string; price: number }>,
  ) => void;
  updateQuantity: (foodItemId: string, quantity: number) => void;
  removeItem: (foodItemId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
