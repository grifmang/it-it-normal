import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Is This Normal? collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Privacy Policy</h1>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">
        <p>
          Last updated: February 2026. This Privacy Policy describes how Is This
          Normal? (&ldquo;the Site&rdquo;) collects, uses, and shares
          information when you visit our website.
        </p>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Information We Collect
          </h2>
          <p>
            We do not require you to create an account or provide personal
            information to use this site. However, certain data may be collected
            automatically:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-6">
            <li>
              <strong>Usage data:</strong> Pages visited, time spent on pages,
              referring URLs, and general browsing behavior through analytics
              services.
            </li>
            <li>
              <strong>Device information:</strong> Browser type, operating
              system, screen resolution, and language preferences.
            </li>
            <li>
              <strong>IP address:</strong> Collected by analytics and advertising
              services in anonymized or pseudonymized form.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Cookies and Tracking Technologies
          </h2>
          <p>This site uses cookies for the following purposes:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-6">
            <li>
              <strong>Essential cookies:</strong> Used to remember your cookie
              consent preference.
            </li>
            <li>
              <strong>Analytics cookies:</strong> Google Analytics collects
              anonymized usage data to help us understand how visitors interact
              with the site.
            </li>
            <li>
              <strong>Advertising cookies:</strong> Google AdSense and its
              partners may use cookies to serve ads based on your prior visits to
              this site or other sites.
            </li>
          </ul>
          <p className="mt-2">
            You can manage your cookie preferences using the cookie consent
            banner that appears when you first visit the site. You may also
            configure your browser to block cookies, though some site
            functionality may be affected.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Google AdSense
          </h2>
          <p>
            This site uses Google AdSense to display advertisements. Google
            AdSense uses cookies to serve ads based on your visits to this and
            other websites. Google&apos;s use of advertising cookies enables it
            and its partners to serve ads based on your browsing history.
          </p>
          <p className="mt-2">
            You may opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Google Ads Settings
            </a>
            . For more information about how Google uses your data, see{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Google Analytics
          </h2>
          <p>
            This site uses Google Analytics to collect anonymized data about site
            usage, including pages viewed, session duration, and traffic sources.
            This data helps us improve the site. Google Analytics may use cookies
            and collects data in accordance with{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            GDPR Rights (European Economic Area)
          </h2>
          <p>
            If you are located in the European Economic Area, you have the
            following rights under the General Data Protection Regulation:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-6">
            <li>
              <strong>Right of access:</strong> You may request a copy of the
              personal data we hold about you.
            </li>
            <li>
              <strong>Right to rectification:</strong> You may request correction
              of inaccurate personal data.
            </li>
            <li>
              <strong>Right to erasure:</strong> You may request deletion of your
              personal data.
            </li>
            <li>
              <strong>Right to restrict processing:</strong> You may request that
              we limit how we use your data.
            </li>
            <li>
              <strong>Right to data portability:</strong> You may request your
              data in a structured, machine-readable format.
            </li>
            <li>
              <strong>Right to object:</strong> You may object to processing of
              your personal data for certain purposes.
            </li>
            <li>
              <strong>Right to opt out:</strong> You may decline cookies via the
              consent banner or your browser settings at any time.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, please contact us using the
            information below.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            CCPA Rights (California)
          </h2>
          <p>
            If you are a California resident, the California Consumer Privacy
            Act provides you with the following rights:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-6">
            <li>
              <strong>Right to know:</strong> You may request information about
              the categories and specific pieces of personal data we have
              collected.
            </li>
            <li>
              <strong>Right to delete:</strong> You may request deletion of your
              personal data.
            </li>
            <li>
              <strong>Right to opt out:</strong> You may opt out of the sale of
              your personal information. We do not sell personal information.
            </li>
            <li>
              <strong>Right to non-discrimination:</strong> We will not
              discriminate against you for exercising your privacy rights.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Data Retention
          </h2>
          <p>
            Analytics data is retained in accordance with the default retention
            settings of Google Analytics. Cookie consent preferences are stored
            in your browser&apos;s local storage and persist until you clear your
            browser data.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated revision date. Continued use of
            the site after changes are posted constitutes acceptance of the
            revised policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Contact
          </h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise
            your data rights, please contact us through the site&apos;s public
            communication channels.
          </p>
        </section>
      </div>
    </div>
  );
}
