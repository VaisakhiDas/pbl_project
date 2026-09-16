import { useState } from "react";
import { Wand2, ChevronDown, ChevronUp } from "lucide-react";
import AddressChip from "./AddressChip";
import { formatKwh, formatInr, weiPerKwhToInr, kwhToWh } from "../utils/format";

// Greedy cheapest-first matcher: sorts active offers by price, fills the
// requested amount from the cheapest offers first, and stops once satisfied
// (or once supply runs out).
function matchOffers(offers, neededKwh) {
  let remainingWh = kwhToWh(neededKwh);
  const sorted = [...offers]
    .filter((o) => o.active && o.remainingEnergy > 0n)
    .sort((a, b) => Number(a.pricePerKwh - b.pricePerKwh));

  const picks = [];
  for (const offer of sorted) {
    if (remainingWh <= 0) break;
    const takeWh = Math.min(remainingWh, Number(offer.remainingEnergy));
    picks.push({ offer, amountWh: takeWh });
    remainingWh -= takeWh;
  }
  return { picks, unmetWh: Math.max(remainingWh, 0) };
}

export default function OfferMatcher({ offers, onSelectOffer }) {
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState(10);
  const [result, setResult] = useState(null);

  const handleFind = () => {
    setResult(matchOffers(offers, Number(need) || 0));
  };

  return (
    <div className="rounded-md border border-ink-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Wand2 size={15} className="text-forest-600" />
          Find the cheapest way to buy energy
        </span>
        {open ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
      </button>

      {open && (
        <div className="border-t border-ink-100 px-5 py-4">
          <p className="text-xs text-ink-500">
            Tell us how much energy you need and we'll recommend the cheapest combination of
            active offers to cover it.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-ink-600">I need (kWh)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                className="mt-1 w-32 rounded-md border border-ink-200 px-3 py-1.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-1 focus:ring-forest-400"
              />
            </div>
            <button
              onClick={handleFind}
              className="rounded-md bg-forest-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-forest-700"
            >
              Find offers
            </button>
          </div>

          {result && (
            <div className="mt-4 space-y-2">
              {result.picks.length === 0 ? (
                <p className="text-sm text-ink-500">No active offers are available right now.</p>
              ) : (
                <>
                  <p className="text-xs font-medium text-ink-500">Recommended purchase, cheapest first:</p>
                  {result.picks.map(({ offer, amountWh }) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between rounded border border-ink-100 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3 text-sm">
                        <AddressChip value={offer.seller} />
                        <span className="text-ink-500">{formatKwh(amountWh)}</span>
                        <span className="text-ink-400">@ {formatInr(weiPerKwhToInr(offer.pricePerKwh))}/kWh</span>
                      </div>
                      <button
                        onClick={() => onSelectOffer(offer)}
                        className="rounded bg-ink-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-ink-800"
                      >
                        Review & Buy
                      </button>
                    </div>
                  ))}
                  {result.unmetWh > 0 && (
                    <p className="text-xs text-amber-600">
                      Only {formatKwh(kwhToWh(need) - result.unmetWh)} of your {need} kWh request
                      can currently be filled by active offers.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink-400">
                    You'll still confirm each purchase individually — this is a recommendation, not
                    an automatic transaction.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
