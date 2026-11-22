export const POS_DASHBOARD_IDS = [
  "sales",
  "products",
  "customers",
  "orders",
  "upselling",
  "staff",
];

export const POS_DASHBOARDS = {
  sales: {
    title: "Sales",
    icon: "ShoppingCart",
    subtitle:
      "Track your restaurant sales, analyze trends and optimize performance with AI-powered insights.",
    metrics: [
      { label: "Total Sales", icon: "IndianRupee" },
      { label: "Total Orders", icon: "ClipboardList" },
      { label: "Average Order Value", icon: "Users" },
      { label: "Total Items Sold", icon: "Package" },
      { label: "Dine-in Sales", icon: "ConciergeBell" },
      { label: "Online/Delivery Sales", icon: "Truck" },
    ],
  },
  products: {
    title: "Products",
    icon: "Package",
    subtitle:
      "Track product performance, identify best sellers and optimize your menu with AI-powered insights.",
    metrics: [
      { label: "Total Products", icon: "Package" },
      { label: "Items Sold", icon: "ShoppingCart" },
      { label: "Top Selling Product", icon: "Tag" },
      { label: "Product Revenue", icon: "IndianRupee" },
      { label: "Avg Item Price", icon: "Percent" },
      { label: "Low Performing Items", icon: "TrendingDown" },
    ],
  },
  customers: {
    title: "Customers",
    icon: "Users",
    subtitle:
      "Understand your customers, track their behavior and build loyalty with AI-powered insights.",
    metrics: [
      { label: "Total Customers", icon: "Users" },
      { label: "New Customers", icon: "UserPlus" },
      { label: "Returning Customers", icon: "Repeat" },
      { label: "Avg Spend per Customer", icon: "IndianRupee" },
      { label: "Customer Retention Rate", icon: "Star" },
    ],
  },
  orders: {
    title: "Orders",
    icon: "ClipboardList",
    subtitle:
      "Track and analyze your order patterns, understand order operations and optimize with AI-powered insights.",
    metrics: [
      { label: "Total Orders", icon: "ClipboardList" },
      { label: "Avg Order Time", icon: "Clock" },
      { label: "Avg Order Value", icon: "IndianRupee" },
      { label: "Dine-in Orders", icon: "ConciergeBell" },
      { label: "Online/Delivery Orders", icon: "Truck" },
      { label: "Takeaway Orders", icon: "ShoppingBag" },
    ],
  },
  upselling: {
    title: "Upselling",
    icon: "Zap",
    subtitle:
      "Discover upselling opportunities, boost average order value and maximize revenue with AI-powered insights.",
    metrics: [
      { label: "Upsell Revenue", icon: "IndianRupee" },
      { label: "Upsell Conversion Rate", icon: "Percent" },
      { label: "Avg Order Value (With Upsell)", icon: "Users" },
      { label: "Upsell Orders", icon: "Gift" },
      { label: "Revenue Lift from Upsell", icon: "TrendingUp" },
    ],
  },
  staff: {
    title: "Staff Performance",
    icon: "UserCog",
    subtitle:
      "Track staff productivity, sales performance and service efficiency with AI-powered insights.",
    metrics: [
      { label: "Total Staff", icon: "Users" },
      { label: "Total Sales by Staff", icon: "IndianRupee" },
      { label: "Total Orders Handled", icon: "ClipboardList" },
      { label: "Avg Service Time", icon: "Clock" },
      { label: "Customer Rating", icon: "Star" },
    ],
  },
};

export function assertKnownPosDashboard(id) {
  if (!POS_DASHBOARD_IDS.includes(id)) {
    const e = new Error(`Unknown POS dashboard "${id}".`);
    e.status = 404;
    throw e;
  }
}
