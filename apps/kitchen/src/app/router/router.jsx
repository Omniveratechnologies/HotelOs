import React from "react";
import { createBrowserRouter } from "react-router-dom";
import AuthLayout from "../AuthLayout.jsx";

export function lazyPage(importer) {
  return async () => {
    const { default: Component } = await importer();
    return {
      Component,
    };
  };
}

const lazyMenu = (section, importer) => async () => {
  const [{ default: MenuShell }, { default: Component }] = await Promise.all([
    import("@/features/menu/pages/MenuShell.jsx"),
    importer(),
  ]);
  return {
    Component: (props) => (
      <MenuShell section={section}>
        <Component {...props} />
      </MenuShell>
    ),
  };
};

const lazyBilling = (section, importer) => async () => {
  const [{ default: BillingShell }, { default: Component }] = await Promise.all(
    [import("@/features/billing/pages/BillingShell.jsx"), importer()],
  );
  return {
    Component: (props) => (
      <BillingShell section={section}>
        <Component {...props} />
      </BillingShell>
    ),
  };
};

export const router = createBrowserRouter([
  {
    path: "login",
    lazy: lazyPage(() => import("@/features/auth/pages/LoginPage.jsx")),
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/",
        lazy: lazyPage(
          () => import("@/features/dashboard/pages/Dashboard.jsx"),
        ),
      },
      // Orders
      {
        path: "orders/all-orders",
        lazy: lazyPage(() => import("@/features/orders/pages/AllOrders.jsx")),
      },
      {
        path: "orders/new-orders",
        lazy: lazyPage(() => import("@/features/orders/pages/NewOrders.jsx")),
      },
      {
        path: "orders/in-progress",
        lazy: lazyPage(() => import("@/features/orders/pages/InProgress.jsx")),
      },
      {
        path: "orders/completed",
        lazy: lazyPage(() => import("@/features/orders/pages/Completed.jsx")),
      },
      {
        path: "orders/cancelled",
        lazy: lazyPage(() => import("@/features/orders/pages/Cancelled.jsx")),
      },
      // Menu & Tables
      {
        path: "add-menu",
        lazy: lazyPage(() => import("@/features/menu/pages/AddMenu.jsx")),
      },
      {
        path: "add-tables",
        lazy: lazyPage(() => import("@/features/tables/pages/AddTables.jsx")),
      },
      // Inventory
      {
        path: "inventory/add-stock",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/AddReceiveStock.jsx"),
        ),
      },
      {
        path: "inventory/stock-out",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/StockOutUsage.jsx"),
        ),
      },
      {
        path: "inventory/recipes",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/RecipeLists.jsx"),
        ),
      },
      {
        path: "inventory/recipe/add",
        lazy: lazyPage(() => import("@/features/inventory/pages/Recipe.jsx")),
      },
      {
        path: "inventory/recipe/:id/edit",
        lazy: lazyPage(() => import("@/features/inventory/pages/Recipe.jsx")),
      },
      {
        path: "inventory/low-stock-items",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/LowStockItems.jsx"),
        ),
      },
      {
        path: "inventory/add-item",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/AddInventoryItem.jsx"),
        ),
      },
      {
        path: "inventory/add-item/:id/edit",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/AddInventoryItem.jsx"),
        ),
      },
      {
        path: "inventory/suppliers",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/Suppliers.jsx"),
        ),
      },
      {
        path: "inventory/suppliers/edit-suppliers/:id",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/AddSuppliers.jsx"),
        ),
      },
      {
        path: "inventory/suppliers/add-suppliers",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/AddSuppliers.jsx"),
        ),
      },
      {
        path: "inventory/purchase-orders",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/PurchaseOrder.jsx"),
        ),
      },
      {
        path: "purchase-orders/edit/:id",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/CreatePurchaseOrder.jsx"),
        ),
      },
      {
        path: "inventory/purchase-orders/create-purchase-order",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/CreatePurchaseOrder.jsx"),
        ),
      },
      {
        path: "inventory/stock-adjustment",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/StockAdjustment.jsx"),
        ),
      },
      {
        path: "purchase-orders/:id",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/PurchaseOrderDetail.jsx"),
        ),
      },
      {
        path: "inventory/wastage",
        lazy: lazyPage(() => import("@/features/inventory/pages/Wastage.jsx")),
      },
      {
        path: "inventory/stock-overview",
        lazy: lazyPage(
          () => import("@/features/inventory/pages/StockOverview.jsx"),
        ),
      },
      // Menu Shell routes
      {
        path: "manage-menu",
        lazy: lazyMenu(
          "manage",
          () => import("@/features/menu/pages/ManageMenu.jsx"),
        ),
      },
      {
        path: "menu/manage-menu",
        lazy: lazyMenu(
          "manage",
          () => import("@/features/menu/pages/ManageMenu.jsx"),
        ),
      },
      {
        path: "menu/categories",
        lazy: lazyMenu(
          "categories",
          () => import("@/features/menu/pages/Categories.jsx"),
        ),
      },
      {
        path: "menu/add-ons",
        lazy: lazyMenu(
          "modifiers",
          () => import("@/features/menu/pages/AddOnsModifiers.jsx"),
        ),
      },
      {
        path: "menu/add-ons-modifiers",
        lazy: lazyMenu(
          "modifiers",
          () => import("@/features/menu/pages/AddOnsModifiers.jsx"),
        ),
      },
      {
        path: "menu/pricing-taxes",
        lazy: lazyMenu(
          "pricing",
          () => import("@/features/menu/pages/PricingTaxes.jsx"),
        ),
      },
      {
        path: "menu/availability",
        lazy: lazyMenu(
          "availability",
          () => import("@/features/menu/pages/MenuAvailability.jsx"),
        ),
      },
      {
        path: "menu/menu-availability",
        lazy: lazyMenu(
          "availability",
          () => import("@/features/menu/pages/MenuAvailability.jsx"),
        ),
      },
      {
        path: "menu/upselling",
        lazy: lazyMenu(
          "upselling",
          () => import("@/features/menu/pages/Upselling.jsx"),
        ),
      },
      // Billing Shell routes
      {
        path: "billing/new-bill",
        lazy: lazyBilling(
          "new",
          () => import("@/features/billing/pages/NewBill.jsx"),
        ),
      },
      {
        path: "billing/all-bills",
        lazy: lazyBilling(
          "bills",
          () => import("@/features/billing/pages/AllBills.jsx"),
        ),
      },
      {
        path: "billing/room-charges",
        lazy: lazyBilling(
          "rooms",
          () => import("@/features/billing/pages/RoomCharges.jsx"),
        ),
      },
      {
        path: "billing/payments",
        lazy: lazyBilling(
          "payments",
          () => import("@/features/billing/pages/Payments.jsx"),
        ),
      },
      {
        path: "billing/refunds",
        lazy: lazyBilling(
          "refunds",
          () => import("@/features/billing/pages/Refunds.jsx"),
        ),
      },
      {
        path: "billing/kot-history",
        lazy: lazyBilling(
          "kots",
          () => import("@/features/billing/pages/KOTHistory.jsx"),
        ),
      },
      {
        path: "billing/tax-discounts",
        lazy: lazyBilling(
          "tax",
          () => import("@/features/billing/pages/TaxDiscounts.jsx"),
        ),
      },
      {
        path: "billing/settings",
        lazy: lazyBilling(
          "settings",
          () => import("@/features/billing/pages/BillingSettings.jsx"),
        ),
      },
      // Staff Management
      {
        path: "manage-staff/dashboard",
        lazy: lazyPage(
          () => import("@/features/staff/pages/ManageStaffDashboard.jsx"),
        ),
      },
      {
        path: "manage-staff/staff-management/all-staff",
        lazy: lazyPage(() => import("@/features/staff/pages/AllStaff.jsx")),
      },
      {
        path: "manage-staff/staff-management/add-staff",
        lazy: lazyPage(() => import("@/features/staff/pages/AddStaff.jsx")),
      },
      {
        path: "manage-staff/staff-management/edit-staff/:id",
        lazy: lazyPage(() => import("@/features/staff/pages/AddStaff.jsx")),
      },
      {
        path: "manage-staff/staff-management/departments",
        lazy: lazyPage(() => import("@/features/staff/pages/Departments.jsx")),
      },
      {
        path: "manage-staff/staff-management/designations",
        lazy: lazyPage(() => import("@/features/staff/pages/Designations.jsx")),
      },
      {
        path: "manage-staff/attendance/attendance-history",
        lazy: lazyPage(
          () => import("@/features/staff/pages/AttendanceHistory.jsx"),
        ),
      },
      {
        path: "manage-staff/attendance/attendance-devices",
        lazy: lazyPage(
          () => import("@/features/staff/pages/AttendanceDevices.jsx"),
        ),
      },
      {
        path: "manage-staff/leave-management",
        lazy: lazyPage(
          () => import("@/features/staff/pages/LeaveManagement.jsx"),
        ),
      },
      {
        path: "manage-staff/shift-schedule",
        lazy: lazyPage(
          () => import("@/features/staff/pages/Shiftschedule.jsx"),
        ),
      },
      {
        path: "manage-staff/holidays",
        lazy: lazyPage(() => import("@/features/staff/pages/Holidays.jsx")),
      },
      {
        path: "manage-staff/face-recognition",
        lazy: lazyPage(() => import("@/features/staff/pages/RegisterFace.jsx")),
      },
      // Reports
      {
        path: "manage-staff/reports/daily-report",
        lazy: lazyPage(
          () => import("@/features/reports/pages/DailyAttendanceReport.jsx"),
        ),
      },
      {
        path: "manage-staff/reports/monthly-reports",
        lazy: lazyPage(
          () => import("@/features/reports/pages/MonthlyAttendanceReport.jsx"),
        ),
      },
      {
        path: "manage-staff/reports/export-reports",
        lazy: lazyPage(
          () => import("@/features/reports/pages/ExportReports.jsx"),
        ),
      },
    ],
  },
]);
