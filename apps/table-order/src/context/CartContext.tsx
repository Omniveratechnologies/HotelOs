import { createContext, useContext, useState, type ReactNode } from "react";
import type { CartItem, FoodItem, OrderType } from "../types";

interface CartContextValue {
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
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  hotelId,
  tableId,
  children,
}: {
  hotelId: string;
  tableId: string;
  children: ReactNode;
}) {
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [tableNumber, setTableNumber] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const addItem = (
    foodItem: FoodItem,
    quantity = 1,
    specialInstructions = "",
    addons: Array<{ name: string; price: number }> = [],
  ) => {
    const foodItemId = foodItem.id ?? foodItem._id ?? "";
    setItems((current) => {
      const existing = current.find(
        (item) =>
          item.foodItemId === foodItemId &&
          item.specialInstructions === specialInstructions &&
          JSON.stringify(item.addons ?? []) === JSON.stringify(addons),
      );
      if (existing)
        return current.map((item) =>
          item === existing
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      return [
        ...current,
        {
          foodItemId,
          name: foodItem.name,
          price: foodItem.price,
          quantity,
          image: foodItem.image,
          addons,
          specialInstructions,
        },
      ];
    });
  };
  const updateQuantity = (foodItemId: string, quantity: number) =>
    setItems((current) =>
      quantity < 1
        ? current.filter((item) => item.foodItemId !== foodItemId)
        : current.map((item) =>
            item.foodItemId === foodItemId ? { ...item, quantity } : item,
          ),
    );
  const removeItem = (foodItemId: string) =>
    setItems((current) =>
      current.filter((item) => item.foodItemId !== foodItemId),
    );
  return (
    <CartContext.Provider
      value={{
        hotelId,
        tableId,
        tableNumber,
        setTableNumber,
        orderType,
        setOrderType,
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart: () => setItems([]),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        ),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
