import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, width = "max-w-md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/40 px-4">
      <div
        className={`w-full ${width} rounded-md border border-ink-200 bg-white shadow-lg animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
