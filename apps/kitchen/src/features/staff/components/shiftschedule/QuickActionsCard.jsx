import { FiClock, FiFileText, FiUserPlus, FiZap } from "react-icons/fi";

const ACTIONS = [
  {
    key: "manage",
    icon: FiClock,
    title: "Manage Shifts",
    subtitle: "Create / Edit shifts",
    tone: "text-emerald-400 bg-emerald-950",
  },
  {
    key: "auto",
    icon: FiZap,
    title: "Auto Schedule",
    subtitle: "Assign shifts automatically",
    tone: "text-blue-400 bg-blue-950",
  },
  {
    key: "bulk",
    icon: FiUserPlus,
    title: "Bulk Assign",
    subtitle: "Assign multiple staff",
    tone: "text-purple-400 bg-purple-950",
  },
  {
    key: "reports",
    icon: FiFileText,
    title: "Shift Reports",
    subtitle: "View shift-wise reports",
    tone: "text-yellow-400 bg-yellow-950",
  },
];

const QuickActionsCard = ({ onAction }) => (
  <section
    aria-label="Quick actions"
    className="rounded-lg border border-gray-800 p-4"
  >
    <h2 className="mb-3 text-sm font-semibold text-white">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-3">
      {ACTIONS.map(({ key, icon: Icon, title, subtitle, tone }) => (
        <button
          key={key}
          type="button"
          onClick={() => onAction(key)}
          className="flex items-center gap-2.5 rounded-lg border border-gray-800 bg-[#111111] px-2.5 py-3 text-left transition hover:border-gray-600 hover:bg-[#151515]"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
          >
            <Icon size={16} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs leading-tight font-semibold text-white">
              {title}
            </span>
            <span className="block text-[10px] leading-tight text-gray-500">
              {subtitle}
            </span>
          </span>
        </button>
      ))}
    </div>
  </section>
);

export default QuickActionsCard;
