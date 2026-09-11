import { useOutletContext } from "react-router";

/**
 * Mobile hamburger button that opens the sidebar drawer.
 * @param {Object} props
 * @param {string} [props.label="Open menu"] - Accessible label for the button (`aria-label`).
 */
export function SidebarToggle({ label = "Open menu" }) {
  const { toggleSidebar } = useOutletContext() || {};

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={label}
      className="text-brand-900"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
