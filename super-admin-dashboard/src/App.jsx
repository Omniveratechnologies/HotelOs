import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import Overview from "./pages/Overview.jsx";
import Hotels from "./pages/Hotels.jsx";
import Transactions from "./pages/Transactions.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import ServiceRequests from "./pages/ServiceRequests.jsx";
import Settings from "./pages/Settings.jsx";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* =========================
            PROTECTED ROUTES
        ========================= */}

        <Route element={<ProtectedRoute />}>

          <Route element={<AppShell />}>

            {/* Root → Dashboard */}
            <Route
              index
              element={<Navigate to="/dashboard" replace />}
            />

            {/* Dashboard */}
            <Route
              path="dashboard"
              element={<Overview />}
            />

            {/* Hotels */}
            <Route
              path="hotels"
              element={<Hotels />}
            />

            {/* Transactions */}
            <Route
              path="transactions"
              element={<Transactions />}
            />

            {/* Subscriptions */}
            <Route
              path="subscriptions"
              element={<Subscriptions />}
            />

            {/* Service Requests */}
            <Route
              path="service-requests"
              element={<ServiceRequests />}
            />

            {/* Settings */}
            <Route
              path="settings"
              element={<Settings />}
            />

          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  );
}