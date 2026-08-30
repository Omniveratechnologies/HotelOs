import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";

import { logoutSuperAdmin } from "../../services/auth.service.js";

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  async function handleConfirmLogout() {
    setLoggingOut(true);

    try {
      await logoutSuperAdmin();

      setLogoutOpen(false);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="bg-canvas flex min-h-screen">
      <Sidebar
        onLogoutClick={() => setLogoutOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Outlet
          context={{
            onMenuClick: () => setMobileOpen(true),
          }}
        />
      </div>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Log out of your account?"
        subtitle="You'll need to sign in again to access the super admin dashboard."
      >
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={handleConfirmLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
