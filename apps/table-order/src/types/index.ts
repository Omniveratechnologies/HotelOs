export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
export type PaymentMode = "PAY_NOW" | "COD" | "PAY_LATER";
export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";
export type ServiceRequestType =
  | "CALL_WAITER"
  | "REQUEST_BILL"
  | "REQUEST_WATER"
  | "REQUEST_CUTLERY"
  | "FEEDBACK"
  | "OTHER";

export interface TableDetails {
  id: string;
  tableNumber: string;
  section?: string;
  seats?: number;
}

export interface FoodAddon {
  name: string;
  price: number;
}

export interface FoodItem {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  addons?: FoodAddon[];
  isVeg?: boolean;
  isVegetarian?: boolean;
  isJain?: boolean;
  dietaryType?: string;
  foodType?: string;
  type?: string;
}

export interface CartItem {
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addons?: FoodAddon[];
  specialInstructions?: string;
}

export interface CreateOrderInput {
  hotelId: string;
  tableId: string;
  items: Array<{
    foodItemId: string;
    quantity: number;
    addons: unknown[];
    specialInstructions?: string;
  }>;
  orderType: OrderType;
  couponCode?: string;
  notes?: string;
  paymentMode: PaymentMode;
}

export interface RazorpayData {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  gst: number;
  serviceCharge?: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  razorpay?: RazorpayData;
}

export interface PaymentVerificationInput {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ServiceRequestInput {
  hotelId: string;
  tableId: string;
  type: ServiceRequestType;
  description?: string;
}
