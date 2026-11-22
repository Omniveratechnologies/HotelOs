import { createBrowserRouter, Navigate } from "react-router";
import KioskLandingPage from "@/features/check-in/pages/KioskLandingPage";
import VerifyOtpPage from "@/features/check-in/pages/VerifyOtpPage";
import SelfCheckInPage from "@/features/check-in/pages/SelfCheckInPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <KioskLandingPage />,
  },
  {
    path: "/verify-otp",
    element: <VerifyOtpPage />,
  },
  {
    path: "/check-in/:token",
    element: <SelfCheckInPage />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
