import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/ui/Navbar.jsx";
import Sidebar from "../components/Hamburger/SideBar.jsx";
import MenuForm from "../components/menu/MenuForm.jsx";

const AddMenu = ({ onClose }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");
  const navigate = useNavigate();
  const close = onClose || (() => navigate("/menu/manage-menu"));

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          title="Add Menu"
          subtitle="Add & Edit all menu items, categories, pricing and availability."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
        />

        <main className="mt-3 px-4">
          <MenuForm onCancel={close} />
        </main>
      </div>
    </div>
  );
};

export default AddMenu;
