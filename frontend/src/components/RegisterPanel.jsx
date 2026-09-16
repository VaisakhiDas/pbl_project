import { useState } from "react";
import { Sun, ShoppingCart, Loader2 } from "lucide-react";
import { useWallet, ROLE } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { translateError } from "../utils/errors";

export default function RegisterPanel() {
  const { writeContract, refreshUser, wrongNetwork } = useWallet();
  const { push } = useToast();
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!selected || !writeContract) return;
    setSubmitting(true);
    const toastId = push({ type: "pending", title: "Registering wallet...", duration: 0 });
    try {
      const tx = await writeContract.registerUser(selected);
      await tx.wait();
      await refreshUser();
      push({ type: "success", title: "Registration complete" });
    } catch (err) {
      push({ type: "error", title: "Registration failed", description: translateError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-md border border-ink-200 bg-white px-6 py-8">
      <h2 className="text-base font-semibold text-ink-900">Register your wallet</h2>
      <p className="mt-1 text-sm text-ink-500">
        Choose how you'll use GridSwap. This is a one-time on-chain registration tied to your
        connected address.
      </p>

      {wrongNetwork && (
        <p className="mt-4 rounded border border-amber-200 bg-amber-100 px-3 py-2 text-xs text-amber-700">
          Switch MetaMask to the local Hardhat network before registering.
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RoleOption
          icon={Sun}
          title="Producer"
          description="List surplus solar energy for sale on the marketplace."
          active={selected === ROLE.Producer}
          onClick={() => setSelected(ROLE.Producer)}
        />
        <RoleOption
          icon={ShoppingCart}
          title="Consumer"
          description="Browse offers and purchase energy from producers."
          active={selected === ROLE.Consumer}
          onClick={() => setSelected(ROLE.Consumer)}
        />
      </div>

      <button
        onClick={handleRegister}
        disabled={!selected || submitting || wrongNetwork}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-forest-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-700 disabled:opacity-50"
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        {submitting ? "Confirming in wallet..." : "Register"}
      </button>
    </div>
  );
}

function RoleOption({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-4 py-4 text-left transition-colors ${
        active ? "border-forest-500 bg-forest-50" : "border-ink-200 hover:border-ink-300"
      }`}
    >
      <Icon size={18} className={active ? "text-forest-600" : "text-ink-400"} />
      <p className="mt-2 text-sm font-medium text-ink-900">{title}</p>
      <p className="mt-0.5 text-xs text-ink-500">{description}</p>
    </button>
  );
}
