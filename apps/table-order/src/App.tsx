import { Route, Routes } from "react-router-dom";
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
import "./App.css";

function ScanRequired() {
  return (
    <main className="page landing">
      <section className="error-panel">
        <span className="eyebrow">TABLE ORDERING</span>
        <h1>Scan your table QR code</h1>
        <p>
          This ordering page opens from the QR code placed at your hotel table.
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
        <Route path="order/:orderId" element={<Tracking />} />
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
