import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, Loader2, X } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ type = "info", title, description, duration = 5000 }) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const update = useCallback((id, patch) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss, update }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const icons = {
    success: <CheckCircle2 size={18} className="text-forest-500 shrink-0 mt-0.5" />,
    error: <XCircle size={18} className="text-rust-500 shrink-0 mt-0.5" />,
    info: <Info size={18} className="text-steel-500 shrink-0 mt-0.5" />,
    pending: <Loader2 size={18} className="text-ink-500 shrink-0 mt-0.5 animate-spin" />,
  };

  return (
    <div className="flex items-start gap-2.5 rounded-md border border-ink-200 bg-white px-3.5 py-3 shadow-panel animate-in slide-in-from-bottom-2">
      {icons[toast.type] || icons.info}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-900">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-snug text-ink-500">{toast.description}</p>
        )}
      </div>
      <button onClick={onDismiss} className="text-ink-300 hover:text-ink-500">
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
