declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: { name?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export function openRazorpayCheckout(options: {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
  guestName?: string;
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss: () => void;
}) {
  if (!window.Razorpay) {
    throw new Error(
      "Payment gateway failed to load. Please refresh and try again.",
    );
  }

  const rzp = new window.Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: "The Meridian — In-Room Dining",
    description: "Food order payment",
    order_id: options.orderId,
    handler: options.onSuccess,
    prefill: { name: options.guestName },
    theme: { color: "#0f4a3c" },
    modal: { ondismiss: options.onDismiss },
  });

  rzp.open();
}

export default openRazorpayCheckout;
