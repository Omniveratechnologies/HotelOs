import { useState } from "react";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import { MdInventory } from "react-icons/md";
import { FaPlus } from "react-icons/fa6";
import SuppliersCard from "../../components/suppliers/SuppliersCard.jsx";
import SuppliersHeader from "../../components/suppliers/SuppliersHeader.jsx";
import SuppliersTable from "../../components/suppliers/SuppliersTable.jsx";
import { useNavigate } from "react-router-dom";

const Suppliers = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterValues, setFilterValues] = useState({
    category: "ALL",
    status: "ALL",
  });

  const navigate = useNavigate("");

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          icon={<MdInventory />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="Suppliers"
          subtitle="Manage your suppliers, contacts and purchase history."
          isMenuOpen={isMenuOpen}
          breadcrumb="Inventory → Suppliers"
          pageAction={
            <button
              type="button"
              onClick={() => navigate("add-suppliers")}
              className="hover:bg-white-500 flex items-center gap-2 rounded-lg border bg-emerald-400 p-2 text-sm text-black"
            >
              <FaPlus />
              Add Supplier
            </button>
          }
          showPageHeading
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
        />

        <main className="mt-3 px-4">
          <SuppliersCard />
          <SuppliersHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValues={filterValues}
            setFilterValues={setFilterValues}
          />

          <SuppliersTable searchTerm={searchTerm} filterValues={filterValues} />
        </main>
      </div>
    </div>
  );
};

export default Suppliers;
