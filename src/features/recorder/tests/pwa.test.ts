import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readPngSize(path: string): { width: number; height: number } {
  const png = readFileSync(join(root, path));
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

describe("PWA assets", () => {
  it("ships a valid web app manifest", () => {
    const manifest = JSON.parse(
      readFileSync(join(root, "public/manifest.webmanifest"), "utf8"),
    ) as {
      name?: string;
      start_url?: string;
      scope?: string;
      display?: string;
      launch_handler?: { client_mode?: string };
      icons?: Array<{ src?: string; sizes?: string; type?: string }>;
      shortcuts?: Array<{ name?: string; url?: string }>;
    };

    expect(manifest.name).toBe("리코더 운지법 배우기");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.launch_handler).toEqual({
      client_mode: "focus-existing",
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
        }),
        expect.objectContaining({
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
        }),
        expect.objectContaining({
          src: "/favicon.svg",
          sizes: "any",
          type: "image/svg+xml",
        }),
      ]),
    );
    expect(manifest.shortcuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "/?bank=low" }),
        expect.objectContaining({ url: "/?bank=high" }),
        expect.objectContaining({ url: "/?bank=chromatic" }),
      ]),
    );
  });

  it("ships installable PNG icons with manifest-required dimensions", () => {
    expect(readPngSize("public/icon-192.png")).toEqual({
      width: 192,
      height: 192,
    });
    expect(readPngSize("public/icon-512.png")).toEqual({
      width: 512,
      height: 512,
    });
  });

  it("ships a fetch-capable service worker", () => {
    const serviceWorker = readFileSync(join(root, "public/sw.js"), "utf8");

    expect(serviceWorker).toContain("/icon-192.png");
    expect(serviceWorker).toContain("/icon-512.png");
    expect(serviceWorker).toContain('self.addEventListener("install"');
    expect(serviceWorker).toContain('self.addEventListener("activate"');
    expect(serviceWorker).toContain('self.addEventListener("fetch"');
    expect(serviceWorker).toContain("networkFirst(request)");
  });
});
