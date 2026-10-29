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
  Clock,
  Flame,
  Heart,
  Home,
  Leaf,
  Menu as MenuIcon,
  ShoppingBag,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { formatCurrency } from "@hotelos/utils";
import { api } from "../services/api";
import { CartProvider, useCart } from "../context/CartContext";
import { SessionProvider } from "../context/SessionContext";
import { OrdersProvider, useOrders } from "../context/OrdersContext";
import { LocationPromptModal } from "./LocationPromptModal";
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
    <SessionProvider hotelId={hotelId} tableId={tableId}>
      <OrdersProvider hotelId={hotelId} tableId={tableId}>
        <CartProvider hotelId={hotelId} tableId={tableId}>
          <MenuDataContext.Provider value={{ menu, ready: menuReady }}>
            <Shell drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
              <Outlet />
            </Shell>
            <LocationPromptModal />
          </MenuDataContext.Provider>
        </CartProvider>
      </OrdersProvider>
    </SessionProvider>
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
function getStageLabel(status: string) {
  switch (status) {
    case "NEW":
      return "Order Placed";
    case "CONFIRMED":
      return "Confirmed";
    case "PREPARING":
      return "Preparing";
    case "READY":
      return "Ready to Serve";
    case "OUT_FOR_DELIVERY":
      return "Serving";
    case "DELIVERED":
      return "Served";
    default:
      return status;
  }
}

function getStagePercent(status: string) {
  switch (status) {
    case "NEW":
      return 25;
    case "CONFIRMED":
      return 50;
    case "PREPARING":
      return 75;
    case "READY":
    case "OUT_FOR_DELIVERY":
    case "DELIVERED":
      return 100;
    default:
      return 20;
  }
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
  const { activeOrders } = useOrders();
  return (
    <div className="app-shell">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <button
        className="mobile-menu-button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon size={20} />
        {activeOrders.length > 0 && <span className="menu-pulse-badge" />}
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
  const { orders, activeOrders, latestOrder } = useOrders();
  const location = useLocation();
  const base = `/${hotelId}/table/${tableId}`;
  const categories = [
    ...new Set(menu.map((item) => item.category || "General")),
  ];
  const isActive = (path: string) =>
    location.pathname === path ||
    (path.endsWith("/menu") && location.pathname.includes("/menu")) ||
    (path.includes("/order") && location.pathname.includes("/order"));
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

        {/* Highlighted Live Order Progress Card in Sidebar */}
        {activeOrders.length > 0 && (
          <div className="sidebar-order-highlight">
            <div className="soh-header">
              <span className="soh-badge">
                <span className="soh-pulse" />
                ORDER IN PROGRESS
              </span>
              <span className="soh-id">
                #{activeOrders[0].id.slice(-6).toUpperCase()}
              </span>
            </div>
            <Link
              to={`${base}/order/${activeOrders[0].id}`}
              onClick={onClose}
              className="soh-body"
            >
              <div className="soh-status-row">
                <span className="soh-status">
                  <Flame size={13} className="soh-flame" />
                  {getStageLabel(activeOrders[0].status)}
                </span>
                <span className="soh-count">
                  {activeOrders.length > 1
                    ? `${activeOrders.length} active`
                    : "Cooking"}
                </span>
              </div>
              <div className="soh-progress-bar">
                <div
                  className="soh-progress-fill"
                  style={{
                    width: `${getStagePercent(activeOrders[0].status)}%`,
                  }}
                />
              </div>
              <div className="soh-tap-cta">
                <span>View Full Progress</span>
                <ChevronRight size={13} />
              </div>
            </Link>
          </div>
        )}

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
            className={location.pathname.includes("/order") ? "active" : ""}
            to={
              latestOrder ? `${base}/order/${latestOrder.id}` : `${base}/order`
            }
            onClick={onClose}
          >
            <Clock size={16} />
            <span>My Orders</span>
            {activeOrders.length > 0 && <b>{activeOrders.length}</b>}
          </Link>
          <Link
            className={isActive(`${base}/bill`) ? "active" : ""}
            to={`${base}/bill`}
            onClick={onClose}
          >
            <ClipboardList size={16} />
            <span>Billing / Pay</span>
            {orders.length > 0 && <b>{orders.length}</b>}
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
  return value == null ? "—" : formatCurrency(value);
}
