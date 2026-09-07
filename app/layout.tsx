import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ServiceWorkerRegistration } from "@/src/features/recorder/components/ServiceWorkerRegistration";
import "./globals.css";

const title = "리코더 운지법 배우기";
const description =
  "낮은 계이름 8음, 높은 계이름 5음, 반음 5음(C4–G5)의 소프라노 리코더 운지를 실제 손 모양 포즈와 구멍 지도로 배우는 교육용 웹앱";

export const viewport: Viewport = {
  themeColor: "#2858c7",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0].trim();
  const requestHost = requestHeaders.get("host")?.trim();
  const candidateHost = forwardedHost || requestHost || "localhost:3000";
  const host = /^[a-z0-9.:[\]-]+$/i.test(candidateHost)
    ? candidateHost
    : "localhost:3000";
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https";
  const origin = `${protocol}://${host}`;
  const socialImage = new URL("/og-remastered.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title,
    description,
    applicationName: title,
    manifest: "/manifest.webmanifest",
    keywords: ["리코더", "운지법", "음악 교육", "바로크식", "독일식", "소프라노 리코더", "반음", "높은 음", "PWA"],
    alternates: { canonical: "/" },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      title,
      description,
      url: origin,
      siteName: title,
      images: [
        {
          url: socialImage,
          width: 1730,
          height: 909,
          alt: "17음의 소프라노 리코더 운지를 손 모양 포즈와 구멍 지도로 배우는 웹앱",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
