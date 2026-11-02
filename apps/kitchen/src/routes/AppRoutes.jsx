import { Routes, Route } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import Dashboard from "../pages/Dashboard";
import AllOrders from "../pages/orders/AllOrders";
import NewOrders from "../pages/orders/NewOrders";
import InProgress from "../pages/orders/InProgress";
import Completed from "../pages/orders/Completed";
import Cancelled from "../pages/orders/Cancelled";
import AddMenu from "../pages/AddMenu";
import AddTables from "../pages/AddTables";
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
import ManageMenu from "../pages/menu/ManageMenu";
import Categories from "../pages/menu/Categories";
import AddOnsModifiers from "../pages/menu/AddOnsModifiers";
import PricingTaxes from "../pages/menu/PricingTaxes";
import MenuAvailability from "../pages/menu/MenuAvailability";
import MenuShell from "../pages/menu/MenuShell";
import Upselling from "../pages/menu/Upselling.jsx";
import BillingShell from "../pages/billing/BillingShell.jsx";
import AttendanceHistory from "../pages/attendance/AttendanceHistory.jsx";
import {
  NewBill,
  AllBills,
  RoomCharges,
  Payments,
  Refunds,
  KOTHistory,
  TaxDiscounts,
  BillingSettings,
} from "../pages/billing/index.js";

const menuPage = (section, Page) => (
  <MenuShell section={section}>
    <Page />
  </MenuShell>
);

const billingPage = (section, Page) => (
  <BillingShell section={section}>
    <Page />
  </BillingShell>
);
import AllStaff from "../pages/staffManagement/AllStaff";
import AddStaff from "../pages/staffManagement/AddStaff";
import Departments from "../pages/staffManagement/Departments";
import Designations from "../pages/staffManagement/Designations";
import AttendanceDevices from "../pages/attendance/AttendanceDevices.jsx";
import LeaveManagement from "../pages/LeaveManagement.jsx";
import ShiftSchedule from "../pages/Shiftschedule.jsx";
import Holidays from "../pages/Holidays.jsx";
import DailyAttendanceReport from "../pages/reports/DailyAttendanceReport.jsx"
import MonthlyAttendanceReport from "../pages/reports/MonthlyAttendanceReport.jsx";
import ExportReports from "../pages/reports/ExportReports.jsx";
import ManageStaffDashboard from "../pages/ManageStaffDashboard.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders/all-orders" element={<AllOrders />} />
        <Route path="/orders/new-orders" element={<NewOrders />} />
        <Route path="/orders/in-progress" element={<InProgress />} />
        <Route path="/orders/completed" element={<Completed />} />
        <Route path="/orders/cancelled" element={<Cancelled />} />
        <Route path="/add-menu" element={<AddMenu />} />
        <Route path="/add-tables" element={<AddTables />} />

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
        <Route
          path="/inventory/stock-adjustment"
          element={<StockAdjustment />}
        />
        <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
        <Route path="/inventory/wastage" element={<Wastage />} />
        <Route path="/inventory/stock-overview" element={<StockOverview />} />

        <Route path="/manage-menu" element={menuPage("manage", ManageMenu)} />
        <Route
          path="/menu/manage-menu"
          element={menuPage("manage", ManageMenu)}
        />
        <Route
          path="/menu/categories"
          element={menuPage("categories", Categories)}
        />
        <Route
          path="/menu/add-ons"
          element={menuPage("modifiers", AddOnsModifiers)}
        />
        <Route
          path="/menu/add-ons-modifiers"
          element={menuPage("modifiers", AddOnsModifiers)}
        />
        <Route
          path="/menu/pricing-taxes"
          element={menuPage("pricing", PricingTaxes)}
        />
        <Route
          path="/menu/availability"
          element={menuPage("availability", MenuAvailability)}
        />
        <Route
          path="/menu/menu-availability"
          element={menuPage("availability", MenuAvailability)}
        />
        <Route
          path="/menu/upselling"
          element={menuPage("upselling", Upselling)}
        />

        <Route path="/billing/new-bill" element={billingPage("new", NewBill)} />
        <Route
          path="/billing/all-bills"
          element={billingPage("bills", AllBills)}
        />
        <Route
          path="/billing/room-charges"
          element={billingPage("rooms", RoomCharges)}
        />
        <Route
          path="/billing/payments"
          element={billingPage("payments", Payments)}
        />
        <Route
          path="/billing/refunds"
          element={billingPage("refunds", Refunds)}
        />
        <Route
          path="/billing/kot-history"
          element={billingPage("kots", KOTHistory)}
        />
        <Route
          path="/billing/tax-discounts"
          element={billingPage("tax", TaxDiscounts)}
        />
        <Route
          path="/billing/settings"
          element={billingPage("settings", BillingSettings)}
        />
      </Route>
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

      <Route
        path="/manage-staff/dashboard"
        element={<ManageStaffDashboard />}
      />
      <Route
        path="/manage-staff/staff-management/all-staff"
        element={<AllStaff />}
      />
      <Route
        path="/manage-staff/staff-management/add-staff"
        element={<AddStaff />}
      />
      <Route
        path="/manage-staff/staff-management/edit-staff/:id"
        element={<AddStaff />}
      />
      <Route
        path="/manage-staff/staff-management/departments"
        element={<Departments />}
      />
      <Route
        path="/manage-staff/staff-management/designations"
        element={<Designations />}
      />
      <Route
        path="/manage-staff/attendance/attendance-history"
        element={<AttendanceHistory />}
      />
      <Route
        path="/manage-staff/attendance/attendance-devices"
        element={<AttendanceDevices />}
      />

      <Route
        path="/manage-staff/leave-management"
        element={<LeaveManagement />}
      />
      <Route
        path="/manage-staff/shift-schedule"
        element={<ShiftSchedule />}
      />

      <Route
        path="/manage-staff/holidays"
        element={<Holidays />}
      />
      <Route
        path="/manage-staff/reports/daily-report"
        element={<DailyAttendanceReport />}
      />
      <Route
        path="/manage-staff/reports/monthly-reports"
        element={<MonthlyAttendanceReport />}
      />
      <Route
        path="/manage-staff/reports/export-reports"
        element={<ExportReports />}
      />
    </Routes>
  );
};

export default AppRoutes;
