import { Wallet, UserPlus } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import WalletButton from "./WalletButton";
import RegisterPanel from "./RegisterPanel";

// Wraps a page that needs a connected + registered wallet. Shows the right
// intermediate state instead of a blank screen or the page half-working.
export default function ConnectGate({ children, requireRole }) {
  const { account, isRegistered, userLoading, role } = useWallet();

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-100 text-forest-600">
          <Wallet size={20} />
        </div>
        <p className="text-sm font-medium text-ink-900">Connect your wallet to continue</p>
        <p className="max-w-sm text-xs text-ink-500">
          GridSwap uses your wallet to identify your account and sign trades on the local
          blockchain. No funds leave your wallet without your confirmation.
        </p>
        <div className="mt-1">
          <WalletButton />
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="rounded-md border border-ink-200 bg-white px-6 py-16 text-center text-sm text-ink-500">
        Checking your registration status...
      </div>
    );
  }

  if (!isRegistered) {
    return <RegisterPanel />;
  }

  if (requireRole && role !== requireRole) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          <UserPlus size={20} />
        </div>
        <p className="text-sm font-medium text-ink-900">This page is for a different role</p>
        <p className="max-w-sm text-xs text-ink-500">
          You're registered as a {role === 1 ? "Producer" : "Consumer"}. This page is only
          available to {requireRole === 1 ? "Producers" : "Consumers"}.
        </p>
      </div>
    );
  }

  return children;
}
