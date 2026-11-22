import { useState } from "react";
import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";

const titles = {
  new: ["New Bill", "Create a bill, manage walk-in orders and room charges."],
  bills: ["All Bills", "View and manage every generated bill."],
  rooms: [
    "Room Charges",
    "Manage restaurant and room service charges for hotel guests.",
  ],
  payments: [
    "Payments",
    "Track collections, reconcile payments and manage transactions.",
  ],
  refunds: ["Refunds", "Manage refund requests and approval history."],
  kots: ["KOT History", "Track kitchen tickets, preparation time and status."],
  tax: [
    "Tax & Discounts",
    "Configure GST, discounts, coupons and service charges.",
  ],
  settings: [
    "Billing Settings",
    "Configure invoice, payment, tax and receipt preferences.",
  ],
};
export default function BillingShell({ section, children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [title, subtitle] = titles[section] || titles.bills;
  return (
    <div className="relative h-screen overflow-hidden bg-[#07131f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ${isMenuOpen ? "translate-x-64" : "translate-x-0"}`}
      >
        <div className="px-4 lg:px-6">
          <Navbar
            title={title}
            subtitle={subtitle}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
