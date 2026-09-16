// Maps common MetaMask / ethers / revert-reason errors to plain language.
// Falls back to the raw shortMessage rather than a wall of hex if nothing matches.
export function translateError(error) {
  const raw = error?.reason || error?.shortMessage || error?.message || String(error);

  if (error?.code === "ACTION_REJECTED" || raw.includes("user rejected")) {
    return "You cancelled the transaction in your wallet.";
  }
  if (raw.includes("insufficient funds")) {
    return "Insufficient funds in your wallet to cover this transaction.";
  }
  if (raw.includes("Already registered")) {
    return "This wallet is already registered.";
  }
  if (raw.includes("Not a registered user")) {
    return "Register your wallet before doing this.";
  }
  if (raw.includes("Only producers")) {
    return "Only registered producers can do this.";
  }
  if (raw.includes("Only consumers")) {
    return "Only registered consumers can do this.";
  }
  if (raw.includes("Insufficient energy remaining")) {
    return "This offer no longer has enough energy remaining. Try a smaller amount.";
  }
  if (raw.includes("Incorrect payment amount")) {
    return "The payment amount didn't match the offer price. Please try again.";
  }
  if (raw.includes("Offer is not active")) {
    return "This offer is no longer available — it may have been sold out or cancelled.";
  }
  if (raw.includes("Not the offer owner")) {
    return "You can only cancel offers you created.";
  }
  if (raw.includes("missing provider") || raw.includes("no wallet")) {
    return "No wallet detected. Install MetaMask to continue.";
  }
  if (raw.includes("could not detect network") || raw.includes("network changed")) {
    return "Wallet network mismatch. Switch MetaMask to the GridSwap local network.";
  }

  return raw.length < 140 ? raw : "Something went wrong processing that transaction.";
}
