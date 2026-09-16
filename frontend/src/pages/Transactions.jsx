import { useMemo, useState } from "react";
import { History } from "lucide-react";
import ConnectGate from "../components/ConnectGate";
import AddressChip from "../components/AddressChip";
import EmptyState, { LoadingState } from "../components/EmptyState";
import { useWallet } from "../context/WalletContext";
import { useTrades } from "../hooks/useTrades";
import { formatKwh, formatInr, weiToInr, formatDate } from "../utils/format";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "bought", label: "Bought" },
  { value: "sold", label: "Sold" },
];

export default function Transactions() {
  return (
    <ConnectGate>
      <TransactionsContent />
    </ConnectGate>
  );
}

function TransactionsContent() {
  const { account } = useWallet();
  const { trades, loading } = useTrades(account);
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return trades;
    return trades.filter((t) =>
      filter === "bought"
        ? t.buyer.toLowerCase() === account?.toLowerCase()
        : t.seller.toLowerCase() === account?.toLowerCase()
    );
  }, [trades, filter, account]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-md border border-ink-200 bg-white p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-ink-200 bg-white">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon={History} title="No transactions found" description="Trades you buy or sell will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Trade ID</th>
                  <th className="px-5 py-2.5 font-medium">Buyer</th>
                  <th className="px-5 py-2.5 font-medium">Seller</th>
                  <th className="px-5 py-2.5 font-medium">Energy</th>
                  <th className="px-5 py-2.5 font-medium">Total</th>
                  <th className="px-5 py-2.5 font-medium">Timestamp</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink-500">#{t.id}</td>
                    <td className="px-5 py-3">
                      <AddressChip value={t.buyer} />
                    </td>
                    <td className="px-5 py-3">
                      <AddressChip value={t.seller} />
                    </td>
                    <td className="px-5 py-3 font-mono">{formatKwh(t.energyAmount)}</td>
                    <td className="px-5 py-3 font-mono">{formatInr(weiToInr(t.totalPrice))}</td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(t.timestamp)}</td>
                    <td className="px-5 py-3 text-forest-600 text-xs font-medium">Confirmed</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
