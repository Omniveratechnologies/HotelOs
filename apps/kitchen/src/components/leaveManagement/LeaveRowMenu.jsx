import { useEffect } from "react";

const LeaveRowMenu = ({ menu, onClose, onApprove, onReject, onCancel }) => {
  useEffect(() => {
    if (!menu) return undefined;
    window.addEventListener("click", onClose);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("click", onClose);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const { leave } = menu;
  const items = [];

  if (leave.status === "PENDING") {
    items.push({ label: "Approve", onClick: () => onApprove(leave) });
    items.push({ label: "Reject", onClick: () => onReject(leave) });
  }
  if (["PENDING", "APPROVED"].includes(leave.status)) {
    items.push({
      label: "Cancel request",
      danger: true,
      onClick: () => onCancel(leave),
    });
  }

  return (
    <div
      className="fixed z-[65] w-44 overflow-hidden rounded-lg border border-gray-700 bg-[#151515] py-1 shadow-xl"
      style={{ top: menu.top, left: menu.left }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className={`block w-full px-4 py-2 text-left text-xs transition hover:bg-[#1f1f1f] ${
            item.danger ? "text-red-400" : "text-gray-200"
          }`}
        >
          {item.label}
        </button>
      ))}
      {items.length === 0 && (
        <p className="px-4 py-2 text-xs text-gray-500">No actions available</p>
      )}
    </div>
  );
};

export default LeaveRowMenu;
