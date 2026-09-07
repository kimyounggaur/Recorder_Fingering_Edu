import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceWorkerRegistration as ServiceWorkerRegistrationComponent } from "./ServiceWorkerRegistration";

const originalServiceWorker = Object.getOwnPropertyDescriptor(
  window.navigator,
  "serviceWorker",
);
const originalIsSecureContext = Object.getOwnPropertyDescriptor(
  window,
  "isSecureContext",
);

function restoreProperty<T extends object>(
  target: T,
  property: keyof T,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
    return;
  }

  Reflect.deleteProperty(target, property);
}

function setSecureContext(value: boolean) {
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value,
  });
}

function setServiceWorkerRegister(
  register: ServiceWorkerContainer["register"],
) {
  Object.defineProperty(window.navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
}

afterEach(() => {
  restoreProperty(window.navigator, "serviceWorker", originalServiceWorker);
  restoreProperty(window, "isSecureContext", originalIsSecureContext);
});

describe("ServiceWorkerRegistration", () => {
  it("registers the app service worker with root scope", async () => {
    const register = vi.fn<ServiceWorkerContainer["register"]>(async () => {
      return {} as globalThis.ServiceWorkerRegistration;
    });
    setSecureContext(true);
    setServiceWorkerRegister(register);

    render(<ServiceWorkerRegistrationComponent />);
    window.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    });
  });

  it("skips registration when service workers are unavailable", () => {
    const register = vi.fn<ServiceWorkerContainer["register"]>(async () => {
      return {} as globalThis.ServiceWorkerRegistration;
    });
    setSecureContext(true);
    Reflect.deleteProperty(window.navigator, "serviceWorker");

    render(<ServiceWorkerRegistrationComponent />);
    window.dispatchEvent(new Event("load"));

    expect(register).not.toHaveBeenCalled();
  });
});
