import { useCallback, useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";

export function useTrades(userAddress) {
  const { readContract } = useWallet();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!readContract) return;
    setLoading(true);
    setError(null);
    try {
      const raw = userAddress
        ? await readContract.getUserTrades(userAddress)
        : await readContract.getAllTrades();
      setTrades(raw.map(normalizeTrade).sort((a, b) => Number(b.timestamp) - Number(a.timestamp)));
    } catch (err) {
      console.error("Failed to load trades", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [readContract, userAddress]);

  useEffect(() => {
    load();
  }, [load]);

  return { trades, loading, error, reload: load };
}

function normalizeTrade(raw) {
  return {
    id: Number(raw.id),
    offerId: Number(raw.offerId),
    buyer: raw.buyer,
    seller: raw.seller,
    energyAmount: raw.energyAmount,
    totalPrice: raw.totalPrice,
    timestamp: raw.timestamp,
  };
}
