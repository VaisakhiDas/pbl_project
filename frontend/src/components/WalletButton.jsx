import { useState, useRef, useEffect } from "react";
import { Wallet, ChevronDown, LogOut, AlertTriangle } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import AddressChip from "./AddressChip";

export default function WalletButton() {
  const { account, connect, disconnect, connecting, wrongNetwork, hasMetaMask } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!account) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-md bg-forest-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
      >
        <Wallet size={15} />
        {connecting ? "Connecting..." : hasMetaMask ? "Connect Wallet" : "Install MetaMask"}
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
          wrongNetwork
            ? "border-amber-300 bg-amber-100 text-amber-700"
            : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
        }`}
      >
        {wrongNetwork ? (
          <AlertTriangle size={14} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
        )}
        <AddressChip value={account} className="!text-ink-700" />
        <ChevronDown size={14} className="text-ink-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 w-48 rounded-md border border-ink-200 bg-white py-1 shadow-panel">
          {wrongNetwork && (
            <p className="border-b border-ink-100 px-3 py-2 text-xs text-amber-700">
              Wrong network — switch MetaMask to the local Hardhat network (chain ID 31337).
            </p>
          )}
          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-600 hover:bg-ink-100"
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
