import { Inbox, Loader2, AlertTriangle } from "lucide-react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <Icon size={18} />
      </div>
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {description && <p className="max-w-sm text-xs text-ink-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-ink-500">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-rust-100 text-rust-600">
        <AlertTriangle size={18} />
      </div>
      <p className="text-sm font-medium text-ink-700">{message}</p>
    </div>
  );
}

EmptyState.defaultProps = {
  icon: Inbox,
};
