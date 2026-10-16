import { useState } from "react";
import {
  FiChevronRight,
  FiChevronDown,
  FiHome,
  FiShoppingBag,
  FiMonitor,
  FiPlusCircle,
  FiGrid,
  FiPackage,
  FiUsers,
  FiCreditCard,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: <FiHome />,
  },
  {
    name: "Orders",
    icon: <FiShoppingBag />,
    submenu: [
      { name: "All Orders", path: "/orders/all-orders" },
      { name: "New Orders", path: "/orders/new-orders" },
      { name: "In Progress", path: "/orders/in-progress" },
      { name: "Completed", path: "/orders/completed" },
      { name: "Cancelled", path: "/orders/cancelled" },
    ],
  },
  {
    name: "Kitchen Display",
    path: "/kitchen-display",
    icon: <FiMonitor />,
  },
  {
    name: "Add Tables",
    path: "/add-tables",
    icon: <FiPlusCircle />,
  },
  {
    name: "Add Menu",
    path: "/add-menu",
    icon: <FiPlusCircle />,
  },
  {
    name: "Menu Management",
    icon: <FiGrid />,
    submenu: [
      { name: "Manage Menu", path: "/menu/manage-menu" },
      { name: "Categories", path: "/menu/categories" },
      { name: "Add-ons / Modifiers", path: "/menu/add-ons" },
      { name: "Pricing & Taxes", path: "/menu/pricing-taxes" },
      { name: "Menu Availability", path: "/menu/availability" },
      { name: "Combinations & Upselling", path: "/menu/upselling" },
    ],
  },
  {
    name: "Inventory",
    icon: <FiPackage />,
    submenu: [
      { name: "Stock Overview", path: "/inventory/stock-overview" },
      { name: "Add / Receive Stock", path: "/inventory/add-stock" },
      { name: "Stock Out / Usage", path: "/inventory/stock-out" },
      { name: "Recipe / Ingredients", path: "/inventory/recipe/add" },
      { name: "Recipes", path: "/inventory/recipes" },
      { name: "Low Stock Items", path: "/inventory/low-stock-items" },
      { name: "Wastage / Spoilage", path: "/inventory/wastage" },
      { name: "Suppliers", path: "/inventory/suppliers" },
      { name: "Purchase Orders", path: "/inventory/purchase-orders" },
      { name: "Stock Adjustment", path: "/inventory/stock-adjustment" },
    ],
  },
  {
    name: "Manage Staff",
    icon: <FiUsers />,
    submenu: [
      { name: "Dashboard", path: "/manage-staff/dashboard" },
      {
        name: "Staff Management",
        submenu: [
          {
            name: "All Staff",
            path: "/manage-staff/staff-management/all-staff",
          },
          {
            name: "Add Staff",
            path: "/manage-staff/staff-management/add-staff",
          },
          {
            name: "Departments",
            path: "/manage-staff/staff-management/departments",
          },
          {
            name: "Designations",
            path: "/manage-staff/staff-management/designations",
          },
        ],
      },
      {
        name: "Attendance",
        submenu: [
          {
            name: "Today's Attendance",
            path: "/manage-staff/attendance/todays-attendance",
          },
          {
            name: "Attendance History",
            path: "/manage-staff/attendance/attendance-history",
          },
          {
            name: "Attendance Devices",
            path: "/manage-staff/attendance/attendance-devices",
          },
        ],
      },
      {
        name: "Leave Management",
        path: "/manage-staff/leave-management",
      },
      {
        name: "Shift & Schedule",
        path: "/manage-staff/shift-schedule",
      },
      {
        name: "Holidays",
        path: "/manage-staff/holidays",
      },
      {
        name: "Face Recognition",
        submenu: [
          {
            name: "Register Face",
            path: "/manage-staff/face-recognition/register-face",
          },
          {
            name: "Face Records",
            path: "/manage-staff/face-recognition/face-records",
          },
        ],
      },
      {
        name: "Device & Kiosk",
        submenu: [
          {
            name: "All Devices",
            path: "/manage-staff/device-kiosk/all-devices",
          },
          {
            name: "Create Device",
            path: "/manage-staff/device-kiosk/create-device",
          },
        ],
      },
      {
        name: "Reports",
        submenu: [
          {
            name: "Daily Report",
            path: "/manage-staff/reports/daily-report",
          },
          {
            name: "Monthly Reports",
            path: "/manage-staff/reports/monthly-reports",
          },
          {
            name: "Export Reports",
            path: "/manage-staff/reports/export-reports",
          },
        ],
      },
    ],
  },
  {
    name: "Billing",
    icon: <FiCreditCard />,
    submenu: [
      { name: "New Bill", path: "/billing/new-bill" },
      { name: "All Bills", path: "/billing/all-bills" },
      { name: "Room Charges", path: "/billing/room-charges" },
      { name: "Payments", path: "/billing/payments" },
      { name: "Refunds", path: "/billing/refunds" },
      { name: "KOT History", path: "/billing/kot-history" },
      { name: "Tax & Discounts", path: "/billing/tax-discounts" },
      { name: "Billing Settings", path: "/billing/settings" },
    ],
  },
  {
    name: "Reports",
    icon: <FiBarChart2 />,
    submenu: [
      { name: "Overview", path: "/reports/overview" },
      { name: "Order Reports", path: "/reports/order" },
      { name: "Staff Reports", path: "/reports/staff" },
      { name: "Stock Reports", path: "/reports/stock" },
      { name: "Food Purchased", path: "/reports/food-purchased" },
      { name: "Sales Reports", path: "/reports/sales" },
      { name: "Profit & Loss", path: "/reports/profit-loss" },
      { name: "Waste Reports", path: "/reports/waste" },
      { name: "Custom Reports", path: "/reports/custom" },
    ],
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <FiSettings />,
  },
];

const baseItemClass =
  "flex w-full items-center rounded-lg px-3 py-3 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white";

const SideBarMenu = () => {
  const [openSubmenus, setOpenSubmenus] = useState({});

  const handleSubmenu = (key) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderMenuItem = (menuItem, parentKey = "", level = 0) => {
    const key = parentKey ? `${parentKey}/${menuItem.name}` : menuItem.name;
    const hasSubmenu =
      Array.isArray(menuItem.submenu) && menuItem.submenu.length > 0;
    const isOpen = Boolean(openSubmenus[key]);

    const label = (
      <div className="flex items-center gap-3">
        {level === 0 && menuItem.icon && (
          <span className="text-lg">{menuItem.icon}</span>
        )}
        {level > 0 && <span className="text-gray-500">•</span>}
        <span>{menuItem.name}</span>
      </div>
    );

    if (!hasSubmenu) {
      return (
        <Link
          key={key}
          to={menuItem.path}
          className={`${baseItemClass} ${level > 0 ? "text-xs" : ""}`}
        >
          {label}
        </Link>
      );
    }

    return (
      <div key={key}>
        <button
          type="button"
          onClick={() => handleSubmenu(key)}
          aria-expanded={isOpen}
          className={`${baseItemClass} justify-between ${
            level > 0 ? "text-xs" : ""
          }`}
        >
          {label}
          {isOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>

        {isOpen && (
          <div
            className={`mt-1 flex flex-col gap-1 border-l border-gray-700 pl-3 ${
              level === 0 ? "ml-9" : "ml-4"
            }`}
          >
            {menuItem.submenu.map((subItem) =>
              renderMenuItem(subItem, key, level + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="flex flex-col gap-1 p-4">
      {menuItems.map((item) => renderMenuItem(item))}
    </nav>
  );
};

export default SideBarMenu;
