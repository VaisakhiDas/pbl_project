import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useOffers } from "../hooks/useOffers";
import { useTrades } from "../hooks/useTrades";
import StatBlock from "../components/StatBlock";
import AddressChip from "../components/AddressChip";
import EmptyState, { LoadingState } from "../components/EmptyState";
import { formatKwh, formatInr, weiToInr, whToKwh, formatDate } from "../utils/format";
import { LayoutGrid } from "lucide-react";

export default function Admin() {
  const { offers, loading: offersLoading } = useOffers();
  const { trades, loading: tradesLoading } = useTrades();

  const activeOffers = offers.filter((o) => o.active);
  const totalEnergyTraded = trades.reduce((sum, t) => sum + whToKwh(t.energyAmount), 0);
  const totalVolume = trades.reduce((sum, t) => sum + weiToInr(t.totalPrice), 0);

  const uniqueUsers = useMemo(() => {
    const set = new Set();
    offers.forEach((o) => set.add(o.seller.toLowerCase()));
    trades.forEach((t) => {
      set.add(t.buyer.toLowerCase());
      set.add(t.seller.toLowerCase());
    });
    return set.size;
  }, [offers, trades]);

  const dailyVolume = useMemo(() => buildDailyVolume(trades), [trades]);

  const loading = offersLoading || tradesLoading;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap divide-x divide-ink-200 rounded-md border border-ink-200 bg-white">
        <StatBlock label="Registered Wallets Seen" value={uniqueUsers} />
        <StatBlock label="Active Offers" value={activeOffers.length} />
        <StatBlock label="Completed Trades" value={trades.length} />
        <StatBlock label="Energy Traded" value={totalEnergyTraded.toFixed(1)} unit="kWh" />
        <StatBlock label="Transaction Volume" value={formatInr(totalVolume)} tone="positive" />
      </div>

      <div className="rounded-md border border-ink-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Energy Traded Per Day</h2>
          <span className="text-xs text-ink-400">kWh, all users</span>
        </div>
        {loading ? (
          <LoadingState />
        ) : dailyVolume.length === 0 ? (
          <EmptyState icon={LayoutGrid} title="No trades yet" description="Platform activity will chart here once trades occur." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyVolume} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8b969e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8b969e" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(value) => [`${value.toFixed(2)} kWh`, "Energy traded"]}
                contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#d6dcdf" }}
              />
              <Bar dataKey="kwh" fill="#25703f" radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-md border border-ink-200 bg-white">
        <div className="border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink-900">Recent Platform Trades</h2>
        </div>
        {loading ? (
          <LoadingState />
        ) : trades.length === 0 ? (
          <EmptyState title="No trades recorded yet" description="Completed trades across the platform will show here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Buyer</th>
                  <th className="px-5 py-2.5 font-medium">Seller</th>
                  <th className="px-5 py-2.5 font-medium">Energy</th>
                  <th className="px-5 py-2.5 font-medium">Amount</th>
                  <th className="px-5 py-2.5 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {trades.slice(0, 10).map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-2.5">
                      <AddressChip value={t.buyer} />
                    </td>
                    <td className="px-5 py-2.5">
                      <AddressChip value={t.seller} />
                    </td>
                    <td className="px-5 py-2.5 font-mono">{formatKwh(t.energyAmount)}</td>
                    <td className="px-5 py-2.5 font-mono">{formatInr(weiToInr(t.totalPrice))}</td>
                    <td className="px-5 py-2.5 text-ink-500">{formatDate(t.timestamp)}</td>
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

function buildDailyVolume(trades) {
  const byDay = new Map();
  trades.forEach((t) => {
    const label = new Date(Number(t.timestamp) * 1000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    byDay.set(label, (byDay.get(label) || 0) + whToKwh(t.energyAmount));
  });
  return Array.from(byDay.entries()).map(([label, kwh]) => ({ label, kwh }));
}
