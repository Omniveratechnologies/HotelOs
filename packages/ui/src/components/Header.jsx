import { cn } from "@hotelos/utils";
import { SidebarToggle } from "./Sidebar";

/**
 * A header component for displaying a title and description.
 * @param {Object} props - The props for the Header component.
 * @param {string} props.pageTitle - The title to display in the header.
 * @param {string} [props.pageDescription] - An optional description to display below the title.
 * @param {boolean} [props.hideSidebarToggle=false] - Whether to hide the sidebar toggle button.
 * @param {React.ReactNode} [props.children] - Optional children to render in the header.
 * @param {string} [props.className] - Optional additional class names for the header container.
 * @param {string} [props.headerClassName] - Optional additional class names for the header element.
 */
export function Header({
  pageTitle,
  pageDescription,
  hideSidebarToggle = false,
  children,
  className,
  headerClassName,
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-100 bg-white/95 px-6 backdrop-blur-sm lg:px-10",
        headerClassName,
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        {!hideSidebarToggle && <SidebarToggle />}

        <div className="min-w-0">
          <h1 className="font-display text-brand-900 truncate text-xl font-semibold sm:text-2xl">
            {pageTitle}
          </h1>

          <p className="truncate text-xs text-gray-500 sm:text-sm">
            {pageDescription}
          </p>
        </div>
      </div>
      <div className={cn("flex items-center gap-4", className)}>{children}</div>
    </header>
  );
}
