import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "리코더 운지법 배우기";
const description =
  "숫자 버튼과 실제 손 모양 애니메이션으로 소프라노 리코더의 기본 8음 운지를 배워요.";

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
    keywords: ["리코더", "운지법", "음악 교육", "바로크식", "독일식"],
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
          alt: "선화로 그린 리코더와 양손으로 운지법을 배우는 교육용 웹앱",
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
      <body>{children}</body>
    </html>
  );
}
