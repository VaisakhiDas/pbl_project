import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import contractArtifact from "../contracts/EnergyTrading.json";
import contractAddress from "../contracts/contract-address.json";
import { useToast } from "./ToastContext";

const WalletContext = createContext(null);

export const ROLE = { None: 0, Producer: 1, Consumer: 2 };
export const EXPECTED_CHAIN_ID = contractAddress.chainId || 31337;

export function WalletProvider({ children }) {
  const { push } = useToast();

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [user, setUser] = useState(null); // { registered, role, ... } or null
  const [userLoading, setUserLoading] = useState(false);

  const hasMetaMask = typeof window !== "undefined" && Boolean(window.ethereum);
  const wrongNetwork = chainId !== null && Number(chainId) !== Number(EXPECTED_CHAIN_ID);

  // Falls back to a direct RPC connection so the marketplace/analytics can be
  // browsed read-only before a wallet is connected.
  const fallbackProvider = useMemo(
    () => new ethers.JsonRpcProvider("http://127.0.0.1:8545"),
    []
  );

  const readContract = useMemo(() => {
    const activeProvider = provider || fallbackProvider;
    return new ethers.Contract(contractAddress.address, contractArtifact.abi, activeProvider);
  }, [provider, fallbackProvider]);

  const writeContract = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(contractAddress.address, contractArtifact.abi, signer);
  }, [signer]);

  const refreshUser = useCallback(
    async (addressOverride) => {
      const targetAddress = addressOverride || account;
      if (!readContract || !targetAddress) {
        setUser(null);
        return;
      }
      setUserLoading(true);
      try {
        const raw = await readContract.getUser(targetAddress);
        setUser({
          wallet: raw.wallet,
          role: Number(raw.role),
          registered: raw.registered,
          registeredAt: raw.registeredAt,
          energySold: raw.energySold,
          energyPurchased: raw.energyPurchased,
          totalEarned: raw.totalEarned,
          totalSpent: raw.totalSpent,
        });
      } catch (err) {
        console.error("Failed to load user", err);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    },
    [readContract, account]
  );

  const connect = useCallback(async () => {
    if (!hasMetaMask) {
      push({
        type: "error",
        title: "MetaMask not found",
        description: "Install the MetaMask extension to connect a wallet.",
      });
      return;
    }
    setConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const newSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(newSigner);
      setAccount(accounts[0]);
      setChainId(network.chainId);
    } catch (err) {
      if (err?.code === 4001 || err?.code === "ACTION_REJECTED") {
        push({ type: "error", title: "Connection rejected", description: "You declined the wallet connection request." });
      } else {
        push({ type: "error", title: "Couldn't connect wallet", description: err?.message || "Unknown error." });
      }
    } finally {
      setConnecting(false);
    }
  }, [hasMetaMask, push]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setUser(null);
  }, []);

  // React to MetaMask account/network changes.
  useEffect(() => {
    if (!hasMetaMask) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };
    const handleChainChanged = () => {
      window.location.reload();
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [hasMetaMask, disconnect]);

  useEffect(() => {
    if (account && readContract) {
      refreshUser(account);
    } else {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, readContract]);

  const value = {
    hasMetaMask,
    provider,
    signer,
    account,
    chainId,
    wrongNetwork,
    connecting,
    connect,
    disconnect,
    readContract,
    writeContract,
    contractAddress: contractAddress.address,
    user,
    userLoading,
    refreshUser,
    isRegistered: Boolean(user?.registered),
    role: user?.role ?? ROLE.None,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
