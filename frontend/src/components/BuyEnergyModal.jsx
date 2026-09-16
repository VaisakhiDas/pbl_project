import { useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "./Modal";
import { formatKwh, formatInr, whToKwh, kwhToWh, weiPerKwhToInr } from "../utils/format";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { translateError } from "../utils/errors";

export default function BuyEnergyModal({ offer, onClose, onPurchased }) {
  const { writeContract } = useWallet();
  const { push, update } = useToast();
  const [amount, setAmount] = useState(() => Math.min(1, whToKwh(offer?.remainingEnergy ?? 0)));
  const [submitting, setSubmitting] = useState(false);

  if (!offer) return null;

  const availableKwh = whToKwh(offer.remainingEnergy);
  const pricePerKwhInr = weiPerKwhToInr(offer.pricePerKwh);
  const amountValid = amount > 0 && amount <= availableKwh;
  const totalInr = amountValid ? amount * pricePerKwhInr : 0;

  const handleConfirm = async () => {
    if (!writeContract || !amountValid) return;
    setSubmitting(true);
    const toastId = push({ type: "pending", title: "Waiting for confirmation...", duration: 0 });
    try {
      const amountWh = kwhToWh(amount);
      // Recompute payment from on-chain price so rounding always matches the contract's check.
      const totalWei = (BigInt(amountWh) * offer.pricePerKwh) / 1000n;
      const tx = await writeContract.buyEnergy(offer.id, amountWh, { value: totalWei });
      update(toastId, { title: "Transaction submitted", description: "Waiting for block confirmation..." });
      await tx.wait();
      update(toastId, {
        type: "success",
        title: "Purchase complete",
        description: `Bought ${amount} kWh for ${formatInr(totalInr)}.`,
        duration: 5000,
      });
      onPurchased?.();
      onClose();
    } catch (err) {
      update(toastId, { type: "error", title: "Purchase failed", description: translateError(err), duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(offer)} onClose={onClose} title="Buy Energy">
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Available</span>
          <span className="font-medium text-ink-900">{formatKwh(offer.remainingEnergy)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Price</span>
          <span className="font-medium text-ink-900">{formatInr(pricePerKwhInr)}/kWh</span>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-500">Amount to buy (kWh)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            max={availableKwh}
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none focus:ring-1 focus:ring-forest-400"
          />
          {!amountValid && (
            <p className="mt-1 text-xs text-rust-600">Enter an amount between 0.1 and {availableKwh} kWh.</p>
          )}
        </div>

        <div className="flex justify-between rounded-md bg-ink-100 px-3 py-2.5 text-sm">
          <span className="text-ink-600">Total</span>
          <span className="font-mono font-semibold text-ink-900">{formatInr(totalInr)}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:border-ink-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!amountValid || submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-forest-600 py-2 text-sm font-medium text-white hover:bg-forest-700 disabled:opacity-50"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Confirming..." : "Confirm Purchase"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
