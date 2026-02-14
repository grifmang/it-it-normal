import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://isthisnormal.com"),
  title: {
    default: "Is This Normal? — Evidence-Based Political Claim Analysis",
    template: "%s | Is This Normal?",
  },
  description:
    "A searchable database of political claims with structured evidence, primary sources, and timelines. No opinion. No editorial tone. Just evidence.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Is This Normal?",
    description:
      "Evidence-based political claim analysis. Primary sources. Structured evidence. No opinion.",
    type: "website",
    images: [
      {
        url: "/og-default.svg",
        width: 1200,
        height: 630,
        alt: "Is This Normal? — Evidence-Based Political Claim Analysis",
      },
    ],
  },
  other: {
    "application/rss+xml": "/feed.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Is This Normal? RSS Feed"
          href="/feed.xml"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CookieConsent />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
