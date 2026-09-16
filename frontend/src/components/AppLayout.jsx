import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import WalletButton from "./WalletButton";

const TITLES = {
  "/dashboard": "Dashboard",
  "/marketplace": "Marketplace",
  "/sell": "Sell Energy",
  "/my-offers": "My Offers",
  "/transactions": "Transaction History",
  "/analytics": "Analytics",
  "/profile": "Profile",
  "/admin": "Admin",
};

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const title = TITLES[location.pathname] || "GridSwap";

  return (
    <div className="min-h-screen bg-paper-100">
      <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-20 bg-ink-950/30 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div className="lg:pl-56">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-ink-200 bg-paper-100/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="text-ink-500 lg:hidden"
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-ink-900">{title}</h1>
          </div>
          <WalletButton />
        </header>
        <main className="px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
