import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { useOffers } from "../hooks/useOffers";
import { useWallet, ROLE } from "../context/WalletContext";
import AddressChip from "../components/AddressChip";
import EmptyState, { LoadingState, ErrorState } from "../components/EmptyState";
import BuyEnergyModal from "../components/BuyEnergyModal";
import OfferMatcher from "../components/OfferMatcher";
import { formatKwh, formatInr, weiPerKwhToInr, timeAgo } from "../utils/format";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "cheapest", label: "Cheapest" },
  { value: "energy", label: "Highest energy" },
];

export default function Marketplace() {
  const { offers, loading, error, reload } = useOffers();
  const { account, isRegistered, role } = useWallet();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedOffer, setSelectedOffer] = useState(null);

  const canBuy = isRegistered && role === ROLE.Consumer;

  const visibleOffers = useMemo(() => {
    let list = offers.filter((o) => o.active);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => o.seller.toLowerCase().includes(q));
    }
    switch (sort) {
      case "cheapest":
        list = [...list].sort((a, b) => Number(a.pricePerKwh - b.pricePerKwh));
        break;
      case "energy":
        list = [...list].sort((a, b) => Number(b.remainingEnergy - a.remainingEnergy));
        break;
      default:
        list = [...list].sort((a, b) => Number(b.timestamp - a.timestamp));
    }
    return list;
  }, [offers, search, sort]);

  return (
    <div className="space-y-4">
      {canBuy && <OfferMatcher offers={offers.filter((o) => o.active)} onSelectOffer={setSelectedOffer} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-ink-500">
            {visibleOffers.length} active {visibleOffers.length === 1 ? "offer" : "offers"} from
            registered producers
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by seller address"
              className="w-56 rounded-md border border-ink-200 py-1.5 pl-8 pr-3 text-sm focus:border-forest-400 focus:outline-none focus:ring-1 focus:ring-forest-400"
            />
          </div>
          <div className="relative">
            <ArrowUpDown size={13} className="pointer-events-none absolute left-2.5 top-2.5 text-ink-300" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-md border border-ink-200 bg-white py-1.5 pl-8 pr-7 text-sm focus:border-forest-400 focus:outline-none focus:ring-1 focus:ring-forest-400"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-ink-200 bg-white">
        {loading ? (
          <LoadingState label="Loading marketplace offers..." />
        ) : error ? (
          <ErrorState message="Couldn't load offers from the contract. Is your local Hardhat node running?" />
        ) : visibleOffers.length === 0 ? (
          <EmptyState
            title="No active energy offers"
            description={
              search
                ? "No offers match that seller address."
                : "Check back once a producer lists surplus energy for sale."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Seller</th>
                  <th className="px-5 py-2.5 font-medium">Energy Available</th>
                  <th className="px-5 py-2.5 font-medium">Price/kWh</th>
                  <th className="px-5 py-2.5 font-medium">Source</th>
                  <th className="px-5 py-2.5 font-medium">Listed</th>
                  <th className="px-5 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {visibleOffers.map((offer) => {
                  const isOwn = account && offer.seller.toLowerCase() === account.toLowerCase();
                  return (
                    <tr key={offer.id} className="hover:bg-paper-50">
                      <td className="px-5 py-3">
                        <AddressChip value={offer.seller} />
                      </td>
                      <td className="px-5 py-3 font-mono">{formatKwh(offer.remainingEnergy)}</td>
                      <td className="px-5 py-3 font-mono">
                        {formatInr(weiPerKwhToInr(offer.pricePerKwh))}
                      </td>
                      <td className="px-5 py-3 text-ink-500">Solar</td>
                      <td className="px-5 py-3 text-ink-500">{timeAgo(offer.timestamp)}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelectedOffer(offer)}
                          disabled={isOwn || !canBuy}
                          title={
                            isOwn
                              ? "You can't buy your own offer"
                              : !canBuy
                              ? "Register as a consumer to buy energy"
                              : undefined
                          }
                          className="rounded bg-forest-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
                        >
                          Buy Energy
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BuyEnergyModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onPurchased={reload}
      />
    </div>
  );
}
