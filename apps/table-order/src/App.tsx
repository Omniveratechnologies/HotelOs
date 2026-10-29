import { useEffect, useState } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { SESSION_STORAGE_KEYS } from "@hotelos/utils";
import { AppLayout, MenuLayout } from "./components/Layout";
import Landing from "./pages/Landing";
import Menu from "./pages/Menu";
import CategoryItems from "./pages/CategoryItems";
import ItemDetail from "./pages/ItemDetail";
import Cart from "./pages/Cart";
import Tracking from "./pages/Tracking";
import Assistance from "./pages/Assistance";
import Bill from "./pages/Bill";
import Offers from "./pages/Offers";
import Profile from "./pages/Profile";
import { api, setApiSessionCredentials } from "./services/api";
import "./App.css";

function ScanRequired() {
  const [searchParams] = useSearchParams();
  const handoffCode = searchParams.get("kioskHandoffCode");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(Boolean(handoffCode));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handoffCode) return;
    api
      .exchangeKioskHandoff(handoffCode)
      .then((data) => {
        if (data.hotelId && data.tableId) {
          const payload = JSON.stringify({
            token: data.token,
            csrfToken: data.csrfToken,
            sessionType: "KIOSK",
            hotelId: data.hotelId,
            tableId: data.tableId,
          });
          const key = SESSION_STORAGE_KEYS.getSessionKey(
            data.hotelId,
            data.tableId,
          );
          try {
            window.localStorage.setItem(key, payload);
            window.sessionStorage.setItem(key, payload);
            window.localStorage.setItem(
              SESSION_STORAGE_KEYS.KIOSK_CURRENT,
              payload,
            );
            window.sessionStorage.setItem(
              SESSION_STORAGE_KEYS.KIOSK_CURRENT,
              payload,
            );
          } catch {
            // ignore storage quota errors
          }
          setApiSessionCredentials(data.token, data.csrfToken);
          navigate(`/${data.hotelId}/table/${data.tableId}`, {
            replace: true,
          });
        } else {
          setError(
            "This kiosk terminal is not assigned to a dining table. Please assign a table in Super Admin.",
          );
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to initialize kiosk session");
        setLoading(false);
      });
  }, [handoffCode, navigate]);

  if (loading) {
    return (
      <main className="page loading">
        Initializing terminal table session...
      </main>
    );
  }

  return (
    <main className="page landing">
      <section className="error-panel">
        <span className="eyebrow">TABLE ORDERING</span>
        <h1>{error ? "Table Setup Required" : "Scan your table QR code"}</h1>
        <p>
          {error ||
            "This ordering page opens from the QR code placed at your hotel table."}
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/:hotelId/table/:tableId" element={<AppLayout />}>
        <Route index element={<Landing />} />
        <Route element={<MenuLayout />}>
          <Route path="menu" element={<Menu />} />
          <Route path="menu/:category" element={<CategoryItems />} />
          <Route path="menu/:category/:itemId" element={<ItemDetail />} />
        </Route>
        <Route path="cart" element={<Cart />} />
        <Route path="order" element={<Tracking />} />
        <Route path="order/:orderId" element={<Tracking />} />
        <Route path="orders" element={<Tracking />} />
        <Route path="assistance" element={<Assistance />} />
        <Route path="bill" element={<Bill />} />
        <Route path="bill/:orderId" element={<Bill />} />
        <Route path="offers" element={<Offers />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/" element={<ScanRequired />} />
      <Route path="*" element={<ScanRequired />} />
    </Routes>
  );
}
