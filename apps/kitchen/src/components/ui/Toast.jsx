import { useEffect } from "react";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";

// toast: { type: "success" | "error", message } | null
const Toast = ({ toast, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div
      role="status"
      className={`fixed right-5 bottom-5 z-[70] flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-xs shadow-xl ${
        isError
          ? "border-red-500/30 bg-red-950 text-red-200"
          : "border-emerald-500/30 bg-emerald-950 text-emerald-200"
      }`}
    >
      {isError ? <FiAlertCircle size={16} className="mt-0.5 shrink-0" /> : <FiCheckCircle size={16} className="mt-0.5 shrink-0" />}
      <p className="flex-1">{toast.message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
        <FiX size={14} />
      </button>
    </div>
  );
};

export default Toast;