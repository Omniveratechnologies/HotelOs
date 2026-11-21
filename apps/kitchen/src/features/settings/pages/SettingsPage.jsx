import { useState } from "react";
import Navbar from "@/components/ui/Navbar.jsx";
import Sidebar from "@/components/hamburger/SideBar.jsx";
import { TwoFactorSecurityCard } from "@hotelos/ui/components";

export default function SettingsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${
          isMenuOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar
          title="Kitchen Settings"
          subtitle="Manage account security, two-factor authentication, and terminal preferences."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />

        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Account Security</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Enhance your kitchen terminal security with two-factor
                authentication.
              </p>
            </div>

            <TwoFactorSecurityCard theme="dark" />
          </div>
        </main>
      </div>
    </div>
  );
}
