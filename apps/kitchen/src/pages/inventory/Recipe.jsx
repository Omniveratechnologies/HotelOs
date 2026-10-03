import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdFastfood } from "react-icons/md";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import API_BASE_URL from "../../config/api.js";

import MenuItemStatusCard from "../../components/recipe/MenuItemsStatusCard.jsx";
import CostSummaryCard from "../../components/recipe/CostSummaryCard.jsx";
import ProfitabilityAnalysisCard from "../../components/recipe/ProfitabilityAnalysisCard.jsx";
import {
  duplicateRecipe,
  saveRecipe,
  fetchRecipe,
  fetchInventoryItems,
} from "../../utils/recipeUtils.js";
import LinkedOrdersTab from "../../components/recipe/LinkedOrderTab.jsx";
import UsageHistoryTab from "../../components/recipe/UsageHistoryTab.jsx";
import CostProfitabilityTab from "../../components/recipe/CostProfitabilityTab.jsx";
import RecipeTable from "../../components/recipe/RecipeTable.jsx";
import RecipeForm from "../../components/recipe/RecipeForm.jsx";
import RecipeHeader from "../../components/recipe/RecipeHeader.jsx";
import RecipeModal from "../../components/recipe/RecipeModal.jsx";

const TABS = [
  { value: "details", label: "Recipe Details" },
  { value: "cost", label: "Cost & Profitability" },
  { value: "usage", label: "Usage History" },
  { value: "orders", label: "Linked Orders" },
];

const emptyForm = {
  menuItemName: "",
  category: "",
  servingSize: 1,
  servingUnit: "plate",
  preparationTime: "",
  preparationTimeUnit: "minutes",
  cuisineType: "",
  difficultyLevel: "Medium",
  sellingPrice: "",
  description: "",
  imageUrl: "",
  isActive: true,
  ingredients: [],
  packagingCost: 0,
  preparationOverhead: 0,
};

const Recipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    fetchInventoryItems(API_BASE_URL)
      .then(setInventoryItems)
      .catch((err) => console.error("Failed to load inventory items:", err));

    if (isEditing) {
      fetchRecipe(API_BASE_URL, id)
        .then((recipe) => setForm({ ...emptyForm, ...recipe }))
        .catch((err) => console.error("Failed to load recipe:", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const inventoryItemOptions = inventoryItems.map((item) => ({
    value: item._id,
    label: item.name,
  }));

  const inventoryItemsById = inventoryItems.reduce((acc, item) => {
    acc[item._id] = item;
    return acc;
  }, {});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (file) => {
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: localUrl }));
  };

  const handleIngredientsChange = (ingredients) => {
    setForm((prev) => ({ ...prev, ingredients }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRecipe(API_BASE_URL, isEditing ? id : null, form);
      alert("Recipe saved successfully.");
      navigate("/inventory/recipes");
    } catch (error) {
      console.error("Save recipe error:", error);
      alert(error.message || "Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!isEditing) {
      alert("Save this recipe first before duplicating it.");
      return;
    }
    try {
      const duplicated = await duplicateRecipe(API_BASE_URL, id);
      navigate(`/inventory/recipe/${duplicated._id}/edit`);
    } catch (error) {
      console.error("Duplicate recipe error:", error);
      alert(error.message || "Failed to duplicate recipe.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f] text-white">
        Loading...
      </div>
    );
  }

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
          title={
            <span className="flex items-center gap-3">
              {form.menuItemName || "New Recipe"}
              <StatusBadge status={form.isActive ? "RECEIVED" : "CANCELLED"} />
            </span>
          }
          subtitle="Manage ingredients, quantities and cost for this menu item."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          breadcrumb="Inventory → Recipes / Ingredients → New Recipe"
          showPageHeading
          pageAction={
            <RecipeHeader
              onDuplicate={handleDuplicate}
              onPreview={() => setShowPreview(true)}
              onSave={handleSave}
              saving={saving}
            />
          }
        />

        <main className="space-y-4 px-4 py-4">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "details" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
              <div className="min-w-0 space-y-5">
                <RecipeForm
                  form={form}
                  onChange={handleChange}
                  onImageSelect={handleImageSelect}
                />
                <RecipeTable
                  ingredients={form.ingredients}
                  inventoryItemOptions={inventoryItemOptions}
                  inventoryItemsById={inventoryItemsById}
                  onChange={handleIngredientsChange}
                />
              </div>

              <div className="space-y-5">
                <MenuItemStatusCard form={form} onChange={handleChange} />
                <CostSummaryCard form={form} onChange={handleChange} />
                <ProfitabilityAnalysisCard form={form} />
              </div>
            </div>
          )}

          {activeTab === "cost" && (
            <CostProfitabilityTab form={form} onChange={handleChange} />
          )}

          {activeTab === "usage" && <UsageHistoryTab recipeId={id} />}

          {activeTab === "orders" && <LinkedOrdersTab recipeId={id} />}
        </main>
      </div>

      {showPreview && (
        <RecipeModal recipe={form} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
};

export default Recipe;
