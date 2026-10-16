import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  Heart,
  Home,
  Leaf,
  Menu as MenuIcon,
  ShoppingBag,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { CartProvider, useCart } from "../context/CartContext";
import type { FoodItem } from "../types";

export function AppLayout() {
  const { hotelId = "", tableId = "" } = useParams();
  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [menuReady, setMenuReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    api
      .getMenu(hotelId)
      .then(setMenu)
      .catch(() => setMenu([]))
      .finally(() => setMenuReady(true));
  }, [hotelId]);
  return (
    <CartProvider hotelId={hotelId} tableId={tableId}>
      <MenuDataContext.Provider value={{ menu, ready: menuReady }}>
        <Shell drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
          <Outlet />
        </Shell>
      </MenuDataContext.Provider>
    </CartProvider>
  );
}
export function MenuLayout() {
  const { ready } = useMenuContext();
  if (!ready) return <main className="page loading">Loading menu...</main>;
  return <Outlet />;
}
const MenuDataContext = createContext<{ menu: FoodItem[]; ready: boolean }>({
  menu: [],
  ready: false,
});
export function useMenu() {
  return useContext(MenuDataContext).menu;
}
function useMenuContext() {
  return useContext(MenuDataContext);
}
export function BottomNav() {
  const { itemCount } = useCart();
  const { hotelId, tableId } = useParams();
  const location = useLocation();
  const base = `/${hotelId}/table/${tableId}`;
  const tabs = [
    [`${base}/menu`, "Menu", MenuIcon],
    [`${base}/cart`, "Cart", ShoppingBag],
    [`${base}/offers`, "Offers", Heart],
    [`${base}/profile`, "Profile", UserRound],
  ] as const;
  return (
    <nav className="bottom-nav">
      {tabs.map(([to, label, Icon]) => (
        <Link
          className={
            location.pathname === to ||
            (label === "Menu" && location.pathname.includes("/menu"))
              ? "active"
              : ""
          }
          to={to}
          key={label}
        >
          <Icon size={18} />
          <span>{label}</span>
          {label === "Cart" && itemCount > 0 && <b>{itemCount}</b>}
        </Link>
      ))}
    </nav>
  );
}
function Shell({
  children,
  drawerOpen,
  setDrawerOpen,
}: {
  children: ReactNode;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}) {
  return (
    <div className="app-shell">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <button
        className="mobile-menu-button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon size={20} />
      </button>
      <div
        className="app-main"
        onClick={() => drawerOpen && setDrawerOpen(false)}
      >
        {children}
      </div>
    </div>
  );
}
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hotelId = "", tableId = "" } = useParams();
  const { menu } = useMenuContext();
  const { itemCount } = useCart();
  const location = useLocation();
  const base = `/${hotelId}/table/${tableId}`;
  const categories = [
    ...new Set(menu.map((item) => item.category || "General")),
  ];
  const isActive = (path: string) =>
    location.pathname === path ||
    (path.endsWith("/menu") && location.pathname.includes("/menu"));
  const links = [
    [`${base}`, "Home", Home],
    [`${base}/menu`, "Categories", MenuIcon],
  ] as const;
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Leaf size={19} />
          <span>
            Spice &amp; Soul<small>RESTAURANT</small>
          </span>
          <button
            className="drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.map(([to, label, Icon]) => (
            <Link
              className={isActive(to) ? "active" : ""}
              to={to}
              key={label}
              onClick={onClose}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
          <div className="sidebar-label">MENU</div>
          {categories.map((category) => {
            const to = `${base}/menu/${encodeURIComponent(category)}`;
            return (
              <Link
                className={location.pathname === to ? "active" : ""}
                to={to}
                key={category}
                onClick={onClose}
              >
                <UtensilsCrossed size={15} />
                <span>{category}</span>
              </Link>
            );
          })}
          <div className="sidebar-label sidebar-label-spaced">YOUR TABLE</div>
          <Link
            className={isActive(`${base}/cart`) ? "active" : ""}
            to={`${base}/cart`}
            onClick={onClose}
          >
            <ShoppingBag size={16} />
            <span>My Cart</span>
            {itemCount > 0 && <b>{itemCount}</b>}
          </Link>
          <Link
            className={isActive(`${base}/bill`) ? "active" : ""}
            to={`${base}/bill`}
            onClick={onClose}
          >
            <ClipboardList size={16} />
            <span>Billing / Pay</span>
          </Link>
          <Link
            className={isActive(`${base}/assistance`) ? "active" : ""}
            to={`${base}/assistance`}
            onClick={onClose}
          >
            <Bell size={16} />
            <span>Call Staff</span>
          </Link>
        </nav>
        <Link
          className="sidebar-help"
          to={`${base}/assistance`}
          onClick={onClose}
        >
          <Bell size={16} />
          <span>
            <strong>Need Help?</strong>
            <small>Call Staff</small>
          </span>
          <ChevronRight size={14} />
        </Link>
      </aside>
      {open && (
        <button
          className="drawer-backdrop"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}
    </>
  );
}
export function PageHeader({
  title,
  back = true,
  actions,
}: {
  title: string;
  back?: boolean;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back ? (
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>
      ) : (
        <span />
      )}
      {title}
      <span className="header-actions">{actions}</span>
    </header>
  );
}
export function formatMoney(value?: number) {
  return value == null ? "—" : `₹${value.toLocaleString("en-IN")}`;
}
