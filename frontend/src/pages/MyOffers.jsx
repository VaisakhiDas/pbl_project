import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, PlusCircle } from "lucide-react";
import ConnectGate from "../components/ConnectGate";
import StatusPill from "../components/StatusPill";
import EmptyState, { LoadingState } from "../components/EmptyState";
import { useWallet, ROLE } from "../context/WalletContext";
import { useOffers } from "../hooks/useOffers";
import { useToast } from "../context/ToastContext";
import { translateError } from "../utils/errors";
import { formatKwh, formatInr, weiPerKwhToInr, formatDate } from "../utils/format";

export default function MyOffers() {
  return (
    <ConnectGate requireRole={ROLE.Producer}>
      <MyOffersContent />
    </ConnectGate>
  );
}

function MyOffersContent() {
  const { account, writeContract } = useWallet();
  const { offers, loading, reload } = useOffers();
  const { push, update } = useToast();
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState(null);

  const myOffers = useMemo(
    () =>
      offers
        .filter((o) => o.seller.toLowerCase() === account?.toLowerCase())
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp)),
    [offers, account]
  );

  const statusOf = (o) => {
    if (o.cancelled) return "cancelled";
    if (!o.active) return "sold";
    return "active";
  };

  const handleCancel = async (offer) => {
    setCancellingId(offer.id);
    const toastId = push({ type: "pending", title: "Cancelling offer...", duration: 0 });
    try {
      const tx = await writeContract.cancelOffer(offer.id);
      await tx.wait();
      update(toastId, { type: "success", title: "Offer cancelled", duration: 4000 });
      reload();
    } catch (err) {
      update(toastId, { type: "error", title: "Couldn't cancel offer", description: translateError(err), duration: 6000 });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{myOffers.length} offers created</p>
        <button
          onClick={() => navigate("/sell")}
          className="inline-flex items-center gap-1.5 rounded-md bg-forest-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-700"
        >
          <PlusCircle size={14} /> Create Offer
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-ink-200 bg-white">
        {loading ? (
          <LoadingState />
        ) : myOffers.length === 0 ? (
          <EmptyState
            title="You haven't created any offers yet."
            description="List your surplus solar energy to start selling on the marketplace."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Offer ID</th>
                  <th className="px-5 py-2.5 font-medium">Energy</th>
                  <th className="px-5 py-2.5 font-medium">Remaining</th>
                  <th className="px-5 py-2.5 font-medium">Price/kWh</th>
                  <th className="px-5 py-2.5 font-medium">Created</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {myOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink-500">#{offer.id}</td>
                    <td className="px-5 py-3 font-mono">{formatKwh(offer.energyAmount)}</td>
                    <td className="px-5 py-3 font-mono">{formatKwh(offer.remainingEnergy)}</td>
                    <td className="px-5 py-3 font-mono">{formatInr(weiPerKwhToInr(offer.pricePerKwh))}</td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(offer.timestamp)}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={statusOf(offer)} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {statusOf(offer) === "active" && (
                        <button
                          onClick={() => handleCancel(offer)}
                          disabled={cancellingId === offer.id}
                          className="inline-flex items-center gap-1 rounded border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 hover:border-rust-300 hover:text-rust-600 disabled:opacity-50"
                        >
                          <Ban size={12} />
                          {cancellingId === offer.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </td>
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
