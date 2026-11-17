import { FiBarChart2, FiMonitor, FiSmile, FiUserPlus } from "react-icons/fi";

const ACTIONS = [
  ["addStaff", "Add Staff", FiUserPlus, "bg-emerald-950 text-emerald-400"],
  ["registerFace", "Register Face", FiSmile, "bg-blue-950 text-blue-400"],
  ["createDevice", "Create Device", FiMonitor, "bg-purple-950 text-purple-400"],
  ["viewReports", "View Reports", FiBarChart2, "bg-orange-950 text-orange-400"],
];
const QuickActionsCard = ({ onGo }) => (
  <section
    aria-label="Quick actions"
    className="rounded-lg border border-gray-800 p-4"
  >
    <h2 className="mb-3 text-sm font-semibold text-white">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-2.5">
      {ACTIONS.map(([key, label, Icon, tone]) => (
        <button
          key={key}
          type="button"
          onClick={() => onGo(key)}
          className="flex items-center gap-2 rounded-lg border border-gray-800 bg-[#111] px-3 py-3 text-left text-[11px] font-medium text-gray-200 transition hover:bg-[#1a1a1a]"
        >
          <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
          >
            <Icon size={15} />
          </span>
          {label}
        </button>
      ))}
    </div>
  </section>
);

export default QuickActionsCard;
