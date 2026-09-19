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
  FiTruck,
  FiSettings,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const SidebarMenu = () => {
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const handleSubmenu = (name) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

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
      ],
    },

    {
      name: "Inventory",
      icon: <FiPackage />,
      submenu: [
        { name: "Stock Overview", path: "/inventory/stock-overview" },
        { name: "Add / Receive Stock", path: "/inventory/add-stock" },
        { name: "Stock Out / Usage", path: "/inventory/stock-out" },
        { name: "Low Stock Items", path: "/inventory/low-stock-items" },
        { name: "Wastage / Spoilage", path: "/inventory/wastage" },
        { name: "Suppliers", path: "/inventory/suppliers" },
        { name: "Categories", path: "/inventory/categories" },
        { name: "Purchase Orders", path: "/inventory/purchase-orders" },
      ],
    },

    {
      name: "Manage Staff",
      icon: <FiUsers />,
      submenu: [
        { name: "All Staff", path: "/manage-staff/all-staff" },
        { name: "Attendance", path: "/manage-staff/attendance" },
        { name: "Shifts & Schedule", path: "/manage-staff/shifts-schedule" },
        {
          name: "Roles & Permissions",
          path: "/manage-staff/roles-permissions",
        },
        { name: "Performance", path: "/manage-staff/performance" },
        { name: "Leave Requests", path: "/manage-staff/leave-requests" },
        { name: "Payroll", path: "/manage-staff/payroll" },
        {
          name: "Training & Certifications",
          path: "/manage-staff/training-certifications",
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
        { name: "Billing Settings", path: "/billing/setting" },
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
      name: "Suppliers",
      icon: <FiTruck />,
      submenu: [
        { name: "All Suppliers", path: "/suppliers" },
        { name: "Supplies History", path: "/suppliers/history" },
        { name: "Purchase Order", path: "/suppliers/purchase-order" },
        { name: "Pending Deliveries", path: "/suppliers/pending-deliveries" },
        { name: "Payments", path: "/suppliers/payments" },
        { name: "Supplier Performance", path: "/suppliers/performance" },
      ],
    },

    {
      name: "Settings",
      path: "/settings",
      icon: <FiSettings />,
    },
  ];

  return (
    <div className="flex flex-col gap-1 p-4">
      {menuItems.map((item) => (
        <div key={item.name}>
          {!item.submenu ? (
            <Link
              to={item.path}
              onClick={() => console.log("Dashboard clicked")}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-300 transition hover:bg-emerald-900 hover:text-white"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ) : (
            <>
              <button
                onClick={() => handleSubmenu(item.name)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm text-gray-300 transition hover:bg-emerald-900 hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </div>

                {openSubmenu === item.name ? (
                  <FiChevronDown size={16} />
                ) : (
                  <FiChevronRight size={16} />
                )}
              </button>

              {openSubmenu === item.name && (
                <div className="mt-1 ml-9 flex flex-col gap-1 border-l border-gray-700 pl-3">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.path}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-400 transition hover:bg-emerald-950 hover:text-white"
                    >
                      <span className="text-gray-500">•</span>
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default SidebarMenu;
