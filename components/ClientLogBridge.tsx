"use client";

import { useEffect } from "react";

/**
 * ClientLogBridge
 * Overrides console methods and captures runtime errors/unhandled rejections
 * sending them to `/api/client-logs` so that server logs show browser issues.
 * Only active in development; in production it is a no-op on the server side.
 */
export default function ClientLogBridge() {
  useEffect(() => {
    const levels: Array<keyof Console> = ["log", "info", "warn", "error"];
    const original: Record<string, any> = {};

    // Patch console methods
    levels.forEach((level) => {
      original[level] = (console as any)[level];
      // We cast to unknown first to satisfy TS about console index signature
      (console as any)[level] = ((...args: any[]) => {
        try {
          fetch("/api/client-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level, args }),
          });
        } catch (_err) {
          /* ignore network errors */
        }
        original[level]?.(...args);
      }) as unknown as any;
    });

    // Browser error events
    const onError = (
      event: ErrorEvent | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error,
    ) => {
      const payload = {
        type: "error",
        message: (event as ErrorEvent).message || "unknown",
        source: source ?? (event as ErrorEvent).filename,
        lineno: lineno ?? (event as ErrorEvent).lineno,
        colno: colno ?? (event as ErrorEvent).colno,
        stack: error?.stack ?? (event as ErrorEvent).error?.stack ?? "",
      };
      try {
        fetch("/api/client-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (_) {}
    };
    window.addEventListener("error", onError as any);

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        fetch("/api/client-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "unhandledrejection", reason: event.reason }),
        });
      } catch (_) {}
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      // Restore originals to avoid side effects in HMR
      levels.forEach((level) => {
        if (original[level]) {
          (console as any)[level] = original[level];
        }
      });
      window.removeEventListener("error", onError as any);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
