"use client";

import { useState, useSyncExternalStore, useCallback } from "react";

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

export default function CookieConsent() {
  const stored = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  const handleConsent = useCallback((accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, accepted ? "accepted" : "declined");
    setDismissed(true);
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: { accepted } }));
  }, []);

  if (stored !== null || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-700 bg-gray-900/95 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-white">
          We use cookies for analytics and advertising. By clicking
          &ldquo;Accept&rdquo; you consent to the use of cookies. See our{" "}
          <a href="/privacy" className="underline hover:text-gray-300">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => handleConsent(false)}
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-500"
          >
            Decline
          </button>
          <button
            onClick={() => handleConsent(true)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
