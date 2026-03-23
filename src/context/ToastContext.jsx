import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let toastIdCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = ({ type = "info", message = "", duration = 3000 }) => {
    const id = toastIdCounter++;
    const toast = { id, type, message };

    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const success = (message) => showToast({ type: "success", message });
  const error = (message) => showToast({ type: "error", message, duration: 4000 });
  const info = (message) => showToast({ type: "info", message });

  const value = useMemo(
    () => ({
      success,
      error,
      info,
      removeToast,
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastViewport({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 w-[320px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const toneMap = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div
      className={`w-full rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${toneMap[toast.type]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-6">{toast.message}</p>
        <button
          onClick={() => onClose(toast.id)}
          className="text-xs opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}