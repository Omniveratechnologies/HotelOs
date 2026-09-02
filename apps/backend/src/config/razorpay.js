import Razorpay from "razorpay";
import "dotenv/config";

// Lazily build the Razorpay client only when credentials are present. Without
// them the rest of the backend still boots (e.g. COD-only orders); ONLINE
// payment creation reports a clear error instead of crashing startup.
let razorpay = null;

export function getRazorpay() {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      const error = new Error(
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      );
      error.code = "RAZORPAY_NOT_CONFIGURED";
      throw error;
    }

    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpay;
}

export default getRazorpay;
