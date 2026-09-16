import { useMemo } from "react";
import ConnectGate from "../components/ConnectGate";
import AddressChip from "../components/AddressChip";
import { useWallet, ROLE, EXPECTED_CHAIN_ID } from "../context/WalletContext";
import { useTrades } from "../hooks/useTrades";
import { formatKwh, formatInr, weiToInr, formatDate } from "../utils/format";

export default function Profile() {
  return (
    <ConnectGate>
      <ProfileContent />
    </ConnectGate>
  );
}

function ProfileContent() {
  const { account, user, chainId } = useWallet();
  const { trades } = useTrades(account);

  const volume = useMemo(
    () => trades.reduce((sum, t) => sum + weiToInr(t.totalPrice), 0),
    [trades]
  );

  const roleLabel = user?.role === ROLE.Producer ? "Producer" : "Consumer";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-md border border-ink-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Wallet Address</p>
            <p className="mt-1 font-mono text-sm text-ink-900">
              <AddressChip value={account} chars={8} />
            </p>
          </div>
          <span className="rounded-full bg-forest-100 px-3 py-1 text-xs font-medium text-forest-700">
            {roleLabel}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-100 pt-5 sm:grid-cols-3">
          <Detail label="Registered" value={user?.registeredAt ? formatDate(user.registeredAt) : "—"} />
          <Detail label="Network" value={`Chain ID ${Number(chainId) || EXPECTED_CHAIN_ID}`} />
          <Detail label="Total Trading Volume" value={formatInr(volume)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-ink-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Energy Sold</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-ink-900">
            {formatKwh(user?.energySold ?? 0n)}
          </p>
        </div>
        <div className="rounded-md border border-ink-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Energy Purchased</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-ink-900">
            {formatKwh(user?.energyPurchased ?? 0n)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-900">{value}</p>
    </div>
  );
}
