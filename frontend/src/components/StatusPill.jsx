const STYLES = {
  active: "bg-forest-100 text-forest-700",
  sold: "bg-steel-100 text-steel-600",
  cancelled: "bg-ink-100 text-ink-500",
  pending: "bg-amber-100 text-amber-600",
  confirmed: "bg-forest-100 text-forest-700",
  failed: "bg-rust-100 text-rust-600",
  bought: "bg-steel-100 text-steel-600",
};

export default function StatusPill({ status }) {
  const key = status?.toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${
        STYLES[key] || "bg-ink-100 text-ink-500"
      }`}
    >
      {status}
    </span>
  );
}
