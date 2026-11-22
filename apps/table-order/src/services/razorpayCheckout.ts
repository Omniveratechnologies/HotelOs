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
  order_id: string;
  handler: (r: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}
export function openRazorpayCheckout(options: {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
  onSuccess: (r: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss: () => void;
}) {
  if (!window.Razorpay)
    throw new Error(
      "Payment gateway failed to load. Please refresh and try again.",
    );
  const rzp = new window.Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: "Spice & Soul Restaurant",
    order_id: options.orderId,
    handler: options.onSuccess,
    theme: { color: "#1c6b52" },
    modal: { ondismiss: options.onDismiss },
  });
  rzp.open();
}
