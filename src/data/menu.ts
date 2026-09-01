import type { MenuCategory } from "@/types/guest-dashboard";

/** Mock in-room dining menu — replace with a menu API response. */
export const FOOD_MENU: MenuCategory[] = [
  {
    category: "Breakfast",
    items: [
      { name: "Masala Omelette", price: 320, note: "Three eggs, herb toast" },
      { name: "Buttermilk Pancakes", price: 290, note: "Maple, berries" },
      { name: "Seasonal Fruit Bowl", price: 240, note: "Chef's selection" },
    ],
  },
  {
    category: "Mains",
    items: [
      { name: "Butter Chicken", price: 620, note: "Naan, saffron rice" },
      { name: "Truffle Risotto", price: 680, note: "Parmesan, wild mushroom" },
      { name: "Grilled Sea Bass", price: 840, note: "Lemon beurre blanc" },
    ],
  },
  {
    category: "Light Bites",
    items: [
      { name: "Club Sandwich", price: 380, note: "Triple decker, fries" },
      { name: "Caesar Salad", price: 340, note: "Anchovy, sourdough crumb" },
    ],
  },
  {
    category: "Beverages",
    items: [
      { name: "Cold Pressed Juice", price: 180, note: "Orange or watermelon" },
      { name: "Masala Chai", price: 140, note: "Pot for two" },
      { name: "House Cappuccino", price: 200, note: "Single origin" },
    ],
  },
];
