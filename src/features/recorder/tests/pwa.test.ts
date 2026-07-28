import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("PWA assets", () => {
  it("ships a valid web app manifest", () => {
    const manifest = JSON.parse(
      readFileSync(join(root, "public/manifest.webmanifest"), "utf8"),
    ) as {
      name?: string;
      start_url?: string;
      scope?: string;
      display?: string;
      icons?: Array<{ src?: string; sizes?: string; type?: string }>;
    };

    expect(manifest.name).toBe("리코더 운지법 배우기");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/favicon.svg",
          sizes: "any",
          type: "image/svg+xml",
        }),
      ]),
    );
  });

  it("ships a fetch-capable service worker", () => {
    const serviceWorker = readFileSync(join(root, "public/sw.js"), "utf8");

    expect(serviceWorker).toContain('self.addEventListener("install"');
    expect(serviceWorker).toContain('self.addEventListener("activate"');
    expect(serviceWorker).toContain('self.addEventListener("fetch"');
    expect(serviceWorker).toContain("networkFirst(request)");
  });
});
