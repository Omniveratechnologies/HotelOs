import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import type { CartItem, FoodItem, OrderType } from "../types";
import { CartContext, type CartContextValue } from "./useCart";

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

  useEffect(() => {
    if (hotelId && tableId) {
      api
        .getTable(hotelId, tableId)
        .then((t) => {
          if (t?.tableNumber) setTableNumber(t.tableNumber);
        })
        .catch((err) => console.error("Failed to load table details:", err));
    }
  }, [hotelId, tableId]);

  const addItem = useCallback(
    (
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
    },
    [],
  );

  const updateQuantity = useCallback(
    (foodItemId: string, quantity: number) =>
      setItems((current) =>
        quantity < 1
          ? current.filter((item) => item.foodItemId !== foodItemId)
          : current.map((item) =>
              item.foodItemId === foodItemId ? { ...item, quantity } : item,
            ),
      ),
    [],
  );

  const removeItem = useCallback(
    (foodItemId: string) =>
      setItems((current) =>
        current.filter((item) => item.foodItemId !== foodItemId),
      ),
    [],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
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
      clearCart,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    }),
    [
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
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
