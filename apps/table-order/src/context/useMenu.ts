import { createContext, useContext } from "react";
import type { FoodItem } from "../types";

export interface MenuDataValue {
  menu: FoodItem[];
  ready: boolean;
}

export const MenuDataContext = createContext<MenuDataValue>({
  menu: [],
  ready: false,
});

export function useMenu() {
  return useContext(MenuDataContext).menu;
}

export function useMenuContext() {
  return useContext(MenuDataContext);
}
