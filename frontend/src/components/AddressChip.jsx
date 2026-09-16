import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { shortenAddress } from "../utils/format";

export default function AddressChip({ value, chars = 4, className = "" }) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-ink-300">—</span>;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable; fail silently
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs text-ink-700 ${className}`}>
      {shortenAddress(value, chars)}
      <button
        onClick={handleCopy}
        title="Copy to clipboard"
        className="text-ink-300 hover:text-forest-600 transition-colors"
      >
        {copied ? <Check size={12} className="text-forest-500" /> : <Copy size={12} />}
      </button>
    </span>
  );
}
