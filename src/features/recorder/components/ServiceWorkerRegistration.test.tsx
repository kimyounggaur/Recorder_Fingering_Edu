import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("offers a waiting update without activating it until refresh is clicked", async () => {
    const postMessage = vi.fn();
    const register = vi.fn<ServiceWorkerContainer["register"]>(async () => ({ waiting: { postMessage } }) as unknown as globalThis.ServiceWorkerRegistration);
    setSecureContext(true);
    setServiceWorkerRegister(register);
    render(<ServiceWorkerRegistrationComponent />);
    window.dispatchEvent(new Event("load"));
    await screen.findByText("새 버전이 준비되었어요");
    expect(postMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "새로 고침" }));
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
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
