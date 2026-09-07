"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";

function canRegisterServiceWorker(): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  if (typeof navigator.serviceWorker?.register !== "function") return false;

  const { hostname } = window.location;
  return (
    window.isSecureContext ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!canRegisterServiceWorker()) return;

    let cancelled = false;
    const register = () => {
      if (cancelled) return;
      void navigator.serviceWorker
        .register(SERVICE_WORKER_PATH, { scope: "/" })
        .catch(() => undefined);
    };

    if (document.readyState === "complete") {
      register();
      return () => {
        cancelled = true;
      };
    }

    window.addEventListener("load", register, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
