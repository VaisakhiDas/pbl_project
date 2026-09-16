import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Zap,
  ListChecks,
  History,
  User,
  ShieldCheck,
  BarChart3,
  Leaf,
} from "lucide-react";
import { useWallet, ROLE } from "../context/WalletContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/sell", label: "Sell Energy", icon: Zap, roles: [ROLE.Producer] },
  { to: "/my-offers", label: "My Offers", icon: ListChecks, roles: [ROLE.Producer] },
  { to: "/transactions", label: "Transactions", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

export default function Sidebar({ mobileOpen, onNavigate }) {
  const { role, isRegistered } = useWallet();

  const items = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    if (!isRegistered) return false;
    return item.roles.includes(role);
  });

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-56 shrink-0 border-r border-ink-200 bg-ink-950 text-ink-200 transition-transform lg:static lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-14 items-center gap-2 border-b border-ink-800 px-4">
        <Leaf size={18} className="text-forest-400" />
        <span className="text-sm font-semibold tracking-tight text-white">GridSwap</span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2.5 py-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-forest-800/60 text-white"
                  : "text-ink-300 hover:bg-ink-800/60 hover:text-white"
              }`
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 border-t border-ink-800 px-4 py-3 text-[11px] leading-snug text-ink-500">
        Local Hardhat network
        <br />
        Trades settle on-chain; energy still flows through the grid.
      </div>
    </aside>
  );
}
