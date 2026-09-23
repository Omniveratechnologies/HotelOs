import { useState } from "react";
import { Outlet, useNavigate } from "react-router";

import Sidebar from "../../components/layout/Sidebar.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { clearAuth } from "@hotelos/api";
import { useSidebarStore } from "@hotelos/stores";

export default function DashboardLayout() {
  const {
    isOpen: mobileOpen,
    open: openMobile,
    close: closeMobile,
  } = useSidebarStore();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  async function handleConfirmLogout() {
    setLoggingOut(true);

    try {
      clearAuth();
      setLogoutOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="bg-background-50 flex min-h-screen">
      <Sidebar
        onLogoutClick={() => setLogoutOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Outlet
          context={{
            onMenuClick: openMobile,
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
