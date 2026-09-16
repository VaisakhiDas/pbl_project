import { useMemo, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import ConnectGate from "../components/ConnectGate";
import { useWallet, ROLE } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { translateError } from "../utils/errors";
import { kwhToWh, inrPerKwhToWei, formatInr } from "../utils/format";
import { useNavigate } from "react-router-dom";

export default function Sell() {
  return (
    <ConnectGate requireRole={ROLE.Producer}>
      <SellForm />
    </ConnectGate>
  );
}

function SellForm() {
  const { writeContract } = useWallet();
  const { push, update } = useToast();
  const navigate = useNavigate();

  const [available, setAvailable] = useState(10);
  const [energyToSell, setEnergyToSell] = useState(5);
  const [pricePerKwh, setPricePerKwh] = useState(6);
  const [submitting, setSubmitting] = useState(false);

  const potentialEarnings = useMemo(
    () => (Number(energyToSell) || 0) * (Number(pricePerKwh) || 0),
    [energyToSell, pricePerKwh]
  );

  const errors = {
    energy:
      energyToSell <= 0
        ? "Enter an amount greater than 0."
        : energyToSell > available
        ? "You can't sell more than your available surplus."
        : null,
    price: pricePerKwh <= 0 ? "Enter a price greater than 0." : null,
  };
  const isValid = !errors.energy && !errors.price;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || !writeContract) return;

    setSubmitting(true);
    const toastId = push({ type: "pending", title: "Creating offer...", duration: 0 });
    try {
      const energyWh = kwhToWh(energyToSell);
      const priceWei = inrPerKwhToWei(pricePerKwh);
      const tx = await writeContract.createEnergyOffer(energyWh, priceWei);
      update(toastId, { title: "Transaction submitted", description: "Waiting for confirmation..." });
      await tx.wait();
      update(toastId, {
        type: "success",
        title: "Offer created",
        description: `Listed ${energyToSell} kWh at ${formatInr(pricePerKwh)}/kWh.`,
        duration: 5000,
      });
      navigate("/my-offers");
    } catch (err) {
      update(toastId, { type: "error", title: "Couldn't create offer", description: translateError(err), duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <form onSubmit={handleSubmit} className="rounded-md border border-ink-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-forest-100 text-forest-600">
            <Zap size={15} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink-900">Create Energy Offer</h2>
            <p className="text-xs text-ink-500">List your surplus solar generation for sale.</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Energy Available (kWh)" hint="Your current surplus — generation minus your own consumption.">
            <input
              type="number"
              min="0"
              step="0.1"
              value={available}
              onChange={(e) => setAvailable(parseFloat(e.target.value) || 0)}
              className="input"
            />
          </Field>

          <Field label="Energy to Sell (kWh)" error={errors.energy}>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={energyToSell}
              onChange={(e) => setEnergyToSell(parseFloat(e.target.value) || 0)}
              className="input"
            />
          </Field>

          <Field label="Price per kWh (₹)" error={errors.price}>
            <input
              type="number"
              min="0.1"
              step="0.05"
              value={pricePerKwh}
              onChange={(e) => setPricePerKwh(parseFloat(e.target.value) || 0)}
              className="input"
            />
          </Field>

          <div className="flex justify-between rounded-md bg-ink-100 px-3.5 py-2.5 text-sm">
            <span className="text-ink-600">Potential earnings</span>
            <span className="font-mono font-semibold text-forest-700">{formatInr(potentialEarnings)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-forest-600 py-2.5 text-sm font-medium text-white hover:bg-forest-700 disabled:opacity-50"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? "Confirming in wallet..." : "Create Energy Offer"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-600">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rust-600">{error}</p>}
    </div>
  );
}
