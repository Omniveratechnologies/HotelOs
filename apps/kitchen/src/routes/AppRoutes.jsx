import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import AllOrders from "../pages/orders/AllOrders";
import NewOrders from "../pages/orders/NewOrders";
import InProgress from "../pages/orders/InProgress";
import Completed from "../pages/orders/Completed";
import Cancelled from "../pages/orders/Cancelled";
import AddMenu from "../pages/AddMenu";
import AddReceiveStock from "../pages/inventory/AddReceiveStock";
import StockOutUsage from "../pages/inventory/StockOutUsage";
import LowStockItems from "../pages/inventory/LowStockItems";
import Suppliers from "../pages/inventory/Suppliers";
import AddSuppliers from "../pages/inventory/AddSuppliers";
import PurchaseOrder from "../pages/inventory/PurchaseOrder";
import CreatePurchaseOrder from "../pages/inventory/CreatePurchaseOrder";
import PurchaseOrderDetail from "../pages/inventory/PurchaseOrderDetail";
import StockAdjustment from "../pages/inventory/StockAdjustment";
import Wastage from "../pages/inventory/Wastage";
import StockOverview from "../pages/inventory/StockOverview";
import AddInventoryItem from "../pages/inventory/AddInventoryItem";
import Recipe from "../pages/inventory/Recipe";
import RecipesLists from "../pages/inventory/RecipeLists";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/orders/all-orders" element={<AllOrders />} />
      <Route path="/orders/new-orders" element={<NewOrders />} />
      <Route path="/orders/in-progress" element={<InProgress />} />
      <Route path="/orders/completed" element={<Completed />} />
      <Route path="/orders/cancelled" element={<Cancelled />} />
      <Route path="/add-menu" element={<AddMenu />} />
      <Route path="/inventory/add-stock" element={<AddReceiveStock />} />
      <Route path="/inventory/stock-out" element={<StockOutUsage />} />
      <Route path="/inventory/recipes" element={<RecipesLists />} />
      <Route path="/inventory/recipe/add" element={<Recipe />} />
      <Route path="/inventory/recipe/:id/edit" element={<Recipe />} />
      <Route path="/inventory/low-stock-items" element={<LowStockItems />} />
      <Route path="/inventory/add-item" element={<AddInventoryItem />} />
      <Route
        path="/inventory/add-item/:id/edit"
        element={<AddInventoryItem />}
      />
      <Route path="/inventory/suppliers" element={<Suppliers />} />
      <Route
        path="/inventory/suppliers/edit-suppliers/:id"
        element={<AddSuppliers />}
      />
      <Route
        path="/inventory/suppliers/add-suppliers"
        element={<AddSuppliers />}
      />
      <Route path="/inventory/purchase-orders" element={<PurchaseOrder />} />
      <Route
        path="/purchase-orders/edit/:id"
        element={<CreatePurchaseOrder />}
      />
      <Route
        path="/inventory/purchase-orders/create-purchase-order"
        element={<CreatePurchaseOrder />}
      />
      <Route path="/inventory/stock-adjustment" element={<StockAdjustment />} />
      <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
      <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
      <Route path="/inventory/wastage" element={<Wastage />} />
      <Route path="/inventory/stock-overview" element={<StockOverview />} />
    </Routes>
  );
};

export default AppRoutes;
