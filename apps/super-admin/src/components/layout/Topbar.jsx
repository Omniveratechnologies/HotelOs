import { Menu } from "lucide-react";

export default function Topbar({ title, subtitle, onMenuClick, actions }) {
  return (
    <header className="border-line bg-canvas/90 sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-5 py-4 backdrop-blur lg:px-8 lg:py-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="border-line text-ink-body rounded-lg border bg-white p-2 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="font-display text-ink-body text-xl font-bold lg:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-ink-muted mt-0.5 text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </header>
  );
}
