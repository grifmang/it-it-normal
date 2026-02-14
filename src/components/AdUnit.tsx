"use client";

import { useEffect, useSyncExternalStore } from "react";

const CONSENT_KEY = "cookie-consent";

function subscribeToConsent(callback: () => void) {
  window.addEventListener("cookie-consent-changed", callback);
  return () => window.removeEventListener("cookie-consent-changed", callback);
}

function getConsentSnapshot() {
  return localStorage.getItem(CONSENT_KEY) === "accepted";
}

function getServerSnapshot() {
  return false;
}

interface AdUnitProps {
  slot: string;
  format?: string;
}

export default function AdUnit({ slot, format = "auto" }: AdUnitProps) {
  const consented = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getServerSnapshot);

  useEffect(() => {
    if (consented) {
      try {
        ((window as unknown as Record<string, unknown>).adsbygoogle as unknown[] || []).push({});
      } catch {
        // AdSense not loaded yet
      }
    }
  }, [consented]);

  if (!consented) {
    return <div className="my-6" />;
  }

  return (
    <div className="my-6">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
