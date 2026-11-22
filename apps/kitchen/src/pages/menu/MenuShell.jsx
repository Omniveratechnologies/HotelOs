import { useState } from "react";
import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";

const titles = {
  manage: [
    "Manage Menu",
    "Add, edit, enable/disable and manage all menu items.",
  ],
  categories: [
    "Categories",
    "Organize your menu structure with categories and sub-categories.",
  ],
  modifiers: [
    "Add-ons / Modifiers",
    "Create and manage modifier groups and options for menu customization.",
  ],
  pricing: [
    "Pricing & Taxes",
    "Manage base pricing, GST, additional charges, discounts, and special pricing rules.",
  ],
  availability: [
    "Menu Availability",
    "Control when and where menu items are available.",
  ],
  upselling: [
    "Combinations & Upselling",
    "Create smart combinations, add-ons, and offers that grow every order.",
  ],
};

export default function MenuShell({ section, children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [title, subtitle] = titles[section] || titles.manage;

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
