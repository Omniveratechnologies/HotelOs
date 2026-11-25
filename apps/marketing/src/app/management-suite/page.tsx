import type { Metadata } from "next";
import ManagementSuiteContent from "./_components/ManagementSuiteContent";

export const metadata: Metadata = {
  title: "HotelOS Management Suite - Unified Software & Hardware Ecosystem",
  description:
    "A complete ecosystem of software and hardware for hotels and restaurants — designed to work seamlessly together.",
};

export default function ManagementSuitePage() {
  return <ManagementSuiteContent />;
}
