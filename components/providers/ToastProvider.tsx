"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

interface Toast {
  id: number;
  message: string;
  type?: "success" | "error" | "info";
}

interface ToastContextProps {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let idCounter = 0;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {isMounted
        ? createPortal(
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={clsx(
                    "px-4 py-2 rounded shadow text-sm flex items-center gap-2",
                    t.type === "success" && "bg-green-600 text-white",
                    t.type === "error" && "bg-red-600 text-white",
                    t.type === "info" && "bg-gray-800 text-white"
                  )}
                >
                  <span className="flex-1">{t.message}</span>
                  <button
                    className="opacity-70 hover:opacity-100"
                    onClick={() =>
                      setToasts((prev) => prev.filter((toast) => toast.id !== t.id))
                    }
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}
