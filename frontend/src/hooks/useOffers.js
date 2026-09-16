import { useCallback, useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";

export function useOffers() {
  const { readContract } = useWallet();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!readContract) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await readContract.getAllOffers();
      setOffers(raw.map(normalizeOffer));
    } catch (err) {
      console.error("Failed to load offers", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [readContract]);

  useEffect(() => {
    load();
  }, [load]);

  return { offers, loading, error, reload: load };
}

export function normalizeOffer(raw) {
  return {
    id: Number(raw.id),
    seller: raw.seller,
    energyAmount: raw.energyAmount,
    remainingEnergy: raw.remainingEnergy,
    pricePerKwh: raw.pricePerKwh,
    timestamp: raw.timestamp,
    active: raw.active,
    cancelled: raw.cancelled,
  };
}
