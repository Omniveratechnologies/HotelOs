import { FiChevronLeft } from "react-icons/fi";
import { GiChefToque } from "react-icons/gi";
import SidebarMenu from "./SideBarMenu";

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
  return (
    <aside
  className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-black text-white shadow-xl transition-transform duration-300 ease-in-out ${
    isMenuOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
     
      <div className="flex h-20 items-center justify-between border-b border-gray-800 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg">
            <GiChefToque size={24} />
          </div>

          <div>
            <h1 className="text-lg font-bold">FoodHub</h1>
            <p className="text-xs text-gray-400">
              Kitchen Management
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsMenuOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-800 text-gray-300 transition hover:text-white"
        >
          <FiChevronLeft size={18} />
        </button>
      </div>

    
      <SidebarMenu />
    </aside>
  );
};

export default Sidebar;