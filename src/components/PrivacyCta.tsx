"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const CONSENT_KEY = "cookie-consent";

function subscribeToConsent(callback: () => void) {
  window.addEventListener("cookie-consent-changed", callback);
  return () => window.removeEventListener("cookie-consent-changed", callback);
}

function getConsentSnapshot() {
  return localStorage.getItem(CONSENT_KEY);
}

function getServerSnapshot() {
  return null;
}

export default function PrivacyCta() {
  const consentState = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerSnapshot
  );

  const bottomOffsetClass = consentState === null ? "bottom-24" : "bottom-4";

  return (
    <div className={`fixed right-4 ${bottomOffsetClass} z-40`}>
      <Link
        href="/privacy"
        className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-md transition hover:bg-gray-50"
      >
        Privacy &amp; Cookie Choices
      </Link>
    </div>
  );
}
