export default function StatBlock({ label, value, unit, tone = "default", trend }) {
  const toneClasses = {
    default: "text-ink-900",
    positive: "text-forest-600",
    warning: "text-amber-600",
  };

  return (
    <div className="flex-1 px-5 py-4 first:pl-0 last:pr-0">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`mt-1.5 font-mono text-2xl font-semibold ${toneClasses[tone]}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-ink-400">{unit}</span>}
      </p>
      {trend && <p className="mt-0.5 text-xs text-ink-400">{trend}</p>}
    </div>
  );
}
