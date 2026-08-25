import {
  Routes,
  Route,
} from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import CreateAccount from "./pages/CreateAccount.jsx";
import AcceptInvitation from "./pages/AcceptInvitation.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Members from "./pages/Members.jsx";

import HotelLayout from "./components/HotelLayout.jsx";

function App() {
  return (
    <Routes>

      {/* =========================
          PUBLIC PAGES
      ========================= */}

      <Route
        path="/"
        element={<Landing />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      {/* =========================
          INVITATION
      ========================= */}

      <Route
        path="/accept-invitation"
        element={<AcceptInvitation />}
      />

      {/* =========================
          CREATE ACCOUNT
      ========================= */}

      <Route
        path="/create-account"
        element={<CreateAccount />}
      />

      {/* =========================
          PASSWORD RESET
      ========================= */}

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* =========================
          DASHBOARD
      ========================= */}

      <Route
        path="/dashboard"
        element={
          <HotelLayout>
            <Dashboard />
          </HotelLayout>
        }
      />

      {/* =========================
          MEMBERS
      ========================= */}

      <Route
        path="/members"
        element={
          <HotelLayout>
            <Members />
          </HotelLayout>
        }
      />

    </Routes>
  );
}

export default App;