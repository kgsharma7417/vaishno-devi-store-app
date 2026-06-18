import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

// Toast types configuration — Flipkart theme
const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bg: "bg-fk-green-light border-fk-green/30",
    iconColor: "text-fk-green",
    textColor: "text-fk-green",
  },
  error: {
    icon: XCircle,
    bg: "bg-fk-red-light border-fk-red/30",
    iconColor: "text-fk-red",
    textColor: "text-fk-red",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-fk-yellow-light border-fk-yellow/30",
    iconColor: "text-fk-yellow-dark",
    textColor: "text-fk-yellow-dark",
  },
  info: {
    icon: Info,
    bg: "bg-fk-blue-light border-fk-blue/30",
    iconColor: "text-fk-blue",
    textColor: "text-fk-blue",
  },
};

function ToastItem({ toast, onDismiss }) {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 p-3 border shadow-medium
                  animate-slide-down ${config.bg} max-w-sm w-full rounded-sm`}
      role="alert"
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`text-sm font-semibold ${config.textColor}`}>
            {toast.title}
          </p>
        )}
        <p className={`text-sm ${config.textColor} opacity-90`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`flex-shrink-0 p-0.5 rounded-sm hover:bg-black/5 transition-colors ${config.iconColor}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = "info", title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-14 right-2 md:top-4 md:right-4 z-[200] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
