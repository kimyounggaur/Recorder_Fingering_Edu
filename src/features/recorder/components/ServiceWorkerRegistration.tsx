"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

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
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const refreshRequested = useRef(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (!canRegisterServiceWorker()) return;

    const serviceWorker = navigator.serviceWorker;
    let cancelled = false;
    let reloaded = false;
    const cleanup: (() => void)[] = [];
    const controllerChanged = () => {
      if (refreshRequested.current && !reloaded) {
        reloaded = true;
        window.location.reload();
      }
    };
    serviceWorker.addEventListener?.("controllerchange", controllerChanged);
    const register = () => {
      if (cancelled) return;
      void serviceWorker
        .register(SERVICE_WORKER_PATH, { scope: "/" })
        .then((registration) => {
          if (cancelled) return;
          if (registration.waiting) setWaiting(registration.waiting);
          const watchInstalling = () => {
            const installing = registration.installing;
            if (!installing) return;
            const check = () => {
              if (!cancelled && installing.state === "installed" && serviceWorker.controller) {
                setWaiting(registration.waiting ?? installing);
              }
            };
            installing.addEventListener("statechange", check);
            cleanup.push(() => installing.removeEventListener("statechange", check));
            check();
          };
          registration.addEventListener?.("updatefound", watchInstalling);
          cleanup.push(() => registration.removeEventListener?.("updatefound", watchInstalling));
          watchInstalling();
        })
        .catch(() => undefined);
    };

    if (document.readyState === "complete") {
      register();
    } else window.addEventListener("load", register, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
      serviceWorker.removeEventListener?.("controllerchange", controllerChanged);
      cleanup.forEach(dispose => dispose());
    };
  }, []);

  if (!waiting) return null;
  return (
    <div className="update-toast" role="status" aria-live="polite">
      <span>새 버전이 준비되었어요</span>
      <button type="button" className="primary-button" onClick={() => {
        refreshRequested.current = true;
        waiting.postMessage({ type: "SKIP_WAITING" });
      }}><RefreshCw size={18} aria-hidden="true" />새로 고침</button>
    </div>
  );
}
