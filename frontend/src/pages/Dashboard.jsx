import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import ConnectGate from "../components/ConnectGate";
import StatBlock from "../components/StatBlock";
import StatusPill from "../components/StatusPill";
import AddressChip from "../components/AddressChip";
import EmptyState, { LoadingState } from "../components/EmptyState";
import { useWallet, ROLE } from "../context/WalletContext";
import { useOffers } from "../hooks/useOffers";
import { useTrades } from "../hooks/useTrades";
import { formatKwh, formatInr, weiToInr, whToKwh, formatDate, weiPerKwhToInr } from "../utils/format";
import { History } from "lucide-react";

export default function Dashboard() {
  return (
    <ConnectGate>
      <DashboardContent />
    </ConnectGate>
  );
}

function DashboardContent() {
  const { account, user, role } = useWallet();
  const { offers, loading: offersLoading } = useOffers();
  const { trades, loading: tradesLoading } = useTrades(account);

  const isProducer = role === ROLE.Producer;

  const myActiveOffers = useMemo(
    () => offers.filter((o) => o.seller?.toLowerCase() === account?.toLowerCase() && o.active),
    [offers, account]
  );

  const availableEnergy = useMemo(
    () => myActiveOffers.reduce((sum, o) => sum + whToKwh(o.remainingEnergy), 0),
    [myActiveOffers]
  );

  const chartData = useMemo(() => buildActivitySeries(trades), [trades]);

  return (
    <div className="space-y-5">
      {/* Top stat strip */}
      <div className="flex flex-wrap divide-x divide-ink-200 rounded-md border border-ink-200 bg-white">
        {isProducer ? (
          <>
            <StatBlock label="Available Energy" value={availableEnergy.toFixed(1)} unit="kWh" />
            <StatBlock
              label="Energy Sold"
              value={whToKwh(user?.energySold ?? 0n).toFixed(1)}
              unit="kWh"
            />
            <StatBlock label="Active Offers" value={myActiveOffers.length} />
            <StatBlock
              label="Total Earnings"
              value={formatInr(weiToInr(user?.totalEarned ?? 0n))}
              tone="positive"
            />
          </>
        ) : (
          <>
            <StatBlock
              label="Energy Purchased"
              value={whToKwh(user?.energyPurchased ?? 0n).toFixed(1)}
              unit="kWh"
            />
            <StatBlock label="Total Trades" value={trades.length} />
            <StatBlock
              label="Total Spent"
              value={formatInr(weiToInr(user?.totalSpent ?? 0n))}
              tone="warning"
            />
            <StatBlock label="Marketplace Offers" value={offers.filter((o) => o.active).length} />
          </>
        )}
      </div>

      {/* Chart + recent transactions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-md border border-ink-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Energy Activity</h2>
            <span className="text-xs text-ink-400">kWh per trade over time</span>
          </div>
          {tradesLoading ? (
            <LoadingState />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={History}
              title="No activity yet"
              description={
                isProducer
                  ? "Sell your first batch of energy to see activity here."
                  : "Purchase energy from the marketplace to see activity here."
              }
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8b969e" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8b969e" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  label={{ value: "kWh", angle: -90, position: "insideLeft", fontSize: 11, fill: "#8b969e" }}
                />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(2)} kWh`, "Energy"]}
                  contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#d6dcdf" }}
                />
                <Line type="monotone" dataKey="kwh" stroke="#25703f" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-md border border-ink-200 bg-white">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-ink-900">Recent Transactions</h2>
            <Link to="/transactions" className="text-xs font-medium text-forest-600 hover:underline">
              View all
            </Link>
          </div>
          {tradesLoading ? (
            <LoadingState />
          ) : trades.length === 0 ? (
            <EmptyState
              icon={History}
              title="No transactions yet"
              description="Your completed trades will show up here."
            />
          ) : (
            <div className="divide-y divide-ink-100">
              {trades.slice(0, 5).map((t) => {
                const isBuy = t.buyer.toLowerCase() === account.toLowerCase();
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        {isBuy ? "Bought" : "Sold"} {formatKwh(t.energyAmount)}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {isBuy ? "from" : "to"} <AddressChip value={isBuy ? t.seller : t.buyer} />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ink-900">
                        {formatInr(weiToInr(t.totalPrice))}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">{formatDate(t.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active offers */}
      <div className="rounded-md border border-ink-200 bg-white">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink-900">Active Marketplace Offers</h2>
          <Link to="/marketplace" className="text-xs font-medium text-forest-600 hover:underline">
            Open marketplace
          </Link>
        </div>
        {offersLoading ? (
          <LoadingState />
        ) : offers.filter((o) => o.active).length === 0 ? (
          <EmptyState title="No active energy offers" description="Check back once a producer lists surplus energy." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-5 py-2 font-medium">Seller</th>
                <th className="px-5 py-2 font-medium">Available</th>
                <th className="px-5 py-2 font-medium">Price/kWh</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {offers
                .filter((o) => o.active)
                .slice(0, 5)
                .map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-2.5">
                      <AddressChip value={o.seller} />
                    </td>
                    <td className="px-5 py-2.5">{formatKwh(o.remainingEnergy)}</td>
                    <td className="px-5 py-2.5">
                      {formatInr(weiPerKwhToInr(o.pricePerKwh))}
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusPill status="active" />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function buildActivitySeries(trades, account) {
  const relevant = trades
    .slice()
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  return relevant.map((t) => ({
    label: new Date(Number(t.timestamp) * 1000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    kwh: whToKwh(t.energyAmount),
  }));
}
