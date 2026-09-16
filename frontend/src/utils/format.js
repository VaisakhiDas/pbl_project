import { ethers } from "ethers";

// Demo-only exchange rate so the local Hardhat currency has a readable INR
// price on screen. Nothing here touches real currency or a price oracle.
export const RUPEES_PER_ETH = 1000;

export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}

export function shortenHash(hash, chars = 6) {
  if (!hash) return "";
  return `${hash.slice(0, 2 + chars)}...${hash.slice(-4)}`;
}

// Contract stores energy in Wh. UI works in kWh.
export function whToKwh(wh) {
  return Number(wh) / 1000;
}

export function kwhToWh(kwh) {
  return Math.round(Number(kwh) * 1000);
}

export function formatKwh(wh, decimals = 1) {
  return `${whToKwh(wh).toFixed(decimals)} kWh`;
}

// pricePerKwh is stored on-chain in wei. Convert to a display INR/kWh figure.
export function weiPerKwhToInr(weiPerKwh) {
  return Number(ethers.formatEther(weiPerKwh)) * RUPEES_PER_ETH;
}

export function inrPerKwhToWei(inrPerKwh) {
  const eth = Number(inrPerKwh) / RUPEES_PER_ETH;
  return ethers.parseEther(eth.toFixed(18));
}

export function formatInr(amount, decimals = 2) {
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function weiToInr(wei) {
  return Number(ethers.formatEther(wei)) * RUPEES_PER_ETH;
}

export function formatDate(timestamp) {
  const ms = Number(timestamp) * 1000;
  return new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000 - Number(timestamp));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
