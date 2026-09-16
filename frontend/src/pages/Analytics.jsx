import { useMemo } from "react";
import {
  LineChart,
  Line,
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
import EmptyState, { LoadingState } from "../components/EmptyState";
import { formatInr, weiPerKwhToInr, whToKwh, weiToInr } from "../utils/format";
import { TrendingUp } from "lucide-react";

export default function Analytics() {
  const { offers, loading: offersLoading } = useOffers();
  const { trades, loading: tradesLoading } = useTrades();

  const loading = offersLoading || tradesLoading;

  const totalTraded = trades.reduce((sum, t) => sum + whToKwh(t.energyAmount), 0);
  const avgPrice = useMemo(() => {
    const activeOffers = offers.filter((o) => o.active);
    if (activeOffers.length === 0) return 0;
    const total = activeOffers.reduce((sum, o) => sum + weiPerKwhToInr(o.pricePerKwh), 0);
    return total / activeOffers.length;
  }, [offers]);

  const supply = offers.filter((o) => o.active).reduce((sum, o) => sum + whToKwh(o.remainingEnergy), 0);
  const demand = useMemo(() => {
    // Proxy for demand: total energy purchased so far by all registered consumers.
    return trades.reduce((sum, t) => sum + whToKwh(t.energyAmount), 0);
  }, [trades]);

  const priceOverTime = useMemo(() => buildPriceSeries(trades), [trades]);
  const producerActivity = useMemo(() => buildProducerActivity(offers, trades), [offers, trades]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap divide-x divide-ink-200 rounded-md border border-ink-200 bg-white">
        <StatBlock label="Total Energy Traded" value={totalTraded.toFixed(1)} unit="kWh" />
        <StatBlock label="Average Price" value={formatInr(avgPrice)} unit="/kWh" />
        <StatBlock label="Number of Trades" value={trades.length} />
        <StatBlock label="Marketplace Supply" value={supply.toFixed(1)} unit="kWh" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-md border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Average Trade Price Over Time</h2>
          {loading ? (
            <LoadingState />
          ) : priceOverTime.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No pricing data yet" description="Prices populate once trades occur." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={priceOverTime} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8b969e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8b969e" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(value) => [formatInr(value), "Price/kWh"]}
                  contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#d6dcdf" }}
                />
                <Line type="monotone" dataKey="price" stroke="#4f7fa3" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-md border border-ink-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Supply vs Demand</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[{ label: "Marketplace", supply: Number(supply.toFixed(1)), demand: Number(demand.toFixed(1)) }]}
              margin={{ left: -10, right: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8b969e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8b969e" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#d6dcdf" }} />
              <Bar dataKey="supply" fill="#25703f" radius={[3, 3, 0, 0]} maxBarSize={48} name="Available supply (kWh)" />
              <Bar dataKey="demand" fill="#4f7fa3" radius={[3, 3, 0, 0]} maxBarSize={48} name="Cumulative demand (kWh)" />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-ink-400">
            Demand is approximated here as total energy purchased to date, since GridSwap doesn't
            yet collect unmet demand requests separately from trades.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-ink-200 bg-white">
        <div className="border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink-900">Producer Activity</h2>
        </div>
        {loading ? (
          <LoadingState />
        ) : producerActivity.length === 0 ? (
          <EmptyState title="No producers yet" description="Producer stats will appear once offers are created." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-5 py-2.5 font-medium">Producer</th>
                <th className="px-5 py-2.5 font-medium">Offers</th>
                <th className="px-5 py-2.5 font-medium">Energy Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {producerActivity.map((p) => (
                <tr key={p.seller}>
                  <td className="px-5 py-2.5 font-mono text-xs text-ink-600">
                    {p.seller.slice(0, 8)}...{p.seller.slice(-4)}
                  </td>
                  <td className="px-5 py-2.5">{p.offerCount}</td>
                  <td className="px-5 py-2.5 font-mono">{p.energySold.toFixed(1)} kWh</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function buildPriceSeries(trades) {
  const sorted = [...trades].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  return sorted.map((t) => ({
    label: new Date(Number(t.timestamp) * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    price: weiToInr(t.totalPrice) / whToKwh(t.energyAmount),
  }));
}

function buildProducerActivity(offers, trades) {
  const map = new Map();
  offers.forEach((o) => {
    const key = o.seller.toLowerCase();
    if (!map.has(key)) map.set(key, { seller: o.seller, offerCount: 0, energySold: 0 });
    map.get(key).offerCount += 1;
  });
  trades.forEach((t) => {
    const key = t.seller.toLowerCase();
    if (!map.has(key)) map.set(key, { seller: t.seller, offerCount: 0, energySold: 0 });
    map.get(key).energySold += whToKwh(t.energyAmount);
  });
  return Array.from(map.values()).sort((a, b) => b.energySold - a.energySold);
}
