import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { WalletProvider } from "./context/WalletContext";
import AppLayout from "./components/AppLayout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Sell from "./pages/Sell";
import MyOffers from "./pages/MyOffers";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";

export default function App() {
  return (
    <ToastProvider>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/my-offers" element={<MyOffers />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </ToastProvider>
  );
}
