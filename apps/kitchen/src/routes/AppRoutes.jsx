import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import AllOrders from "../pages/orders/AllOrders";
import NewOrders from "../pages/orders/NewOrders";
import InProgress from "../pages/orders/InProgress";
import Completed from "../pages/orders/Completed";
import Cancelled from "../pages/orders/Cancelled";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/orders/all-orders" element={<AllOrders />} />
      <Route path="/orders/new-orders" element={<NewOrders />} />
      <Route path="/orders/in-progress" element={<InProgress />} />
      <Route path="/orders/completed" element={<Completed />} />
      <Route path="/orders/cancelled" element={<Cancelled />} />
    </Routes>
  );
};

export default AppRoutes;
