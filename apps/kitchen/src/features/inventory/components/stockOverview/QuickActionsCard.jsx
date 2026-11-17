import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTruck,
  FiMinusCircle,
  FiSliders,
  FiFileText,
} from "react-icons/fi";

const ACTIONS = [
  {
    label: "Add New Item",
    sub: "Add a new inventory item",
    icon: FiPlus,
    color: "text-emerald-400",
    bg: "bg-emerald-950",
    path: "/inventory/add-item",
  },
  {
    label: "Receive Stock",
    sub: "Add incoming stock",
    icon: FiTruck,
    color: "text-blue-400",
    bg: "bg-blue-950",
    path: "/inventory/add-stock",
  },
  {
    label: "Stock Out / Usage",
    sub: "Record item usage",
    icon: FiMinusCircle,
    color: "text-orange-400",
    bg: "bg-orange-950",
    path: "/inventory/stock-out",
  },
  {
    label: "Adjust Stock",
    sub: "Manual stock adjustment",
    icon: FiSliders,
    color: "text-purple-400",
    bg: "bg-purple-950",
    path: "/inventory/stock-adjustment",
  },
  {
    label: "Create Purchase Order",
    sub: "Order from suppliers",
    icon: FiFileText,
    color: "text-yellow-400",
    bg: "bg-yellow-950",
    path: "/inventory/purchase-orders/create-purchase-order",
  },
];

const QuickActionsCard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-200">
        Quick Actions
      </h3>

      <div className="space-y-2">
        {ACTIONS.map(({ label, sub, icon: Icon, color, bg, path }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className="flex w-full items-center gap-3 rounded-lg border border-gray-800 px-3 py-2.5 text-left transition hover:bg-gray-800/50"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}
            >
              <Icon size={16} />
            </span>
            <span className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{label}</p>
              <p className="truncate text-xs text-gray-500">{sub}</p>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsCard;
