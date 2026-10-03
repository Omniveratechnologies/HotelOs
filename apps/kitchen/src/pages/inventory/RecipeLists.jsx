import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdFastfood } from "react-icons/md";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import Table from "../../components/ui/Table.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import EditButton from "../../components/ui/button/EditButton.jsx";
import DeleteButton from "../../components/ui/button/DeleteButton.jsx";
import SearchBar from "../../components/ui/SearchBar.jsx";
import { MdInventory } from "react-icons/md";
import API_BASE_URL from "../../config/api.js";
import { duplicateRecipe } from "../../utils/recipeUtils.js";
import { FiCopy } from "react-icons/fi";

const RecipesLists = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/inventory/recipes`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setRecipes(data.data || []);
    } catch (err) {
      console.error("Failed to load recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.menuItemName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/recipes/${row._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await fetchRecipes();
    } catch (err) {
      console.error("Delete recipe error:", err);
      alert(err.message || "Failed to delete recipe.");
    }
  };

  const handleDuplicate = async (row) => {
    try {
      const duplicated = await duplicateRecipe(API_BASE_URL, row._id);
      await fetchRecipes();
      navigate(`/inventory/recipe/${duplicated._id}/edit`);
    } catch (err) {
      console.error("Duplicate recipe error:", err);
      alert(err.message || "Failed to duplicate recipe.");
    }
  };

  const filtered = recipes.filter((r) =>
    r.menuItemName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    {
      key: "menuItemName",
      label: "Menu Item",
      render: (row) => (
        <div className="flex items-center gap-2 text-left">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt=""
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-gray-800" />
          )}
          <span className="font-medium text-white">{row.menuItemName}</span>
        </div>
      ),
    },
    { key: "category", label: "Category" },
    {
      key: "sellingPrice",
      label: "Price (₹)",
      render: (row) => `₹${row.sellingPrice}`,
    },
    {
      key: "foodCostPercentage",
      label: "Food Cost %",
      render: (row) => `${row.foodCostPercentage}%`,
    },
    {
      key: "profitMarginPercentage",
      label: "Profit Margin %",
      render: (row) => `${row.profitMarginPercentage}%`,
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.isActive ? "RECEIVED" : "CANCELLED"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <EditButton
            onClick={() => navigate(`/inventory/recipe/${row._id}/edit`)}
          />
          <button
            type="button"
            onClick={() => handleDuplicate(row)}
            title="Duplicate"
            className="rounded-md p-2 text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300"
          >
            <FiCopy size={15} />
          </button>
          <DeleteButton onClick={() => handleDelete(row)} />
        </div>
      ),
    },
  ];

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          icon={<MdFastfood />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="Recipes"
          subtitle="View recipes, ingredients, and cost."
          breadcrumb="Inventory → Recipes"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <button
              type="button"
              onClick={() => navigate("/inventory/recipe/add")}
              className="hover:bg-white-400 flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition"
            >
              <FiPlus size={15} />
              Add Recipe
            </button>
          }
        />

        <main className="px-4 py-4">
          <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                All Recipes
              </h2>
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Search recipes..."
              />
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Loading...
              </p>
            ) : (
              <Table
                columns={columns}
                data={filtered}
                onRowClick={(row) =>
                  navigate(`/inventory/recipe/${row._id}/edit`)
                }
                emptyMessage="No recipes yet. Click 'Add Recipe' to create your first one."
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RecipesLists;
