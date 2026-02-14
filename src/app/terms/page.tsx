import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using Is This Normal?",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Terms of Service
      </h1>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">
        <p>
          Last updated: February 2026. These Terms of Service
          (&ldquo;Terms&rdquo;) govern your use of Is This Normal? (&ldquo;the
          Site&rdquo;). By accessing or using the Site, you agree to be bound by
          these Terms.
        </p>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Acceptance of Terms
          </h2>
          <p>
            By accessing this website, you acknowledge that you have read,
            understood, and agree to be bound by these Terms of Service. If you
            do not agree to these Terms, you should not use this site.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Disclaimer
          </h2>
          <p>
            This site presents structured evidence for public claims. It does
            not offer legal advice, editorial opinion, or partisan commentary.
            The content on this site is for informational purposes only and
            should not be construed as professional, legal, or expert advice of
            any kind.
          </p>
          <p className="mt-2">
            The analysis presented on this site reflects a structured review of
            publicly available evidence. It does not represent the views or
            endorsement of any political party, organization, or individual.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Content Accuracy
          </h2>
          <p>
            We strive to provide accurate and up-to-date information. All
            factual assertions are cited to primary sources where possible.
            However, we make no warranties or representations about the
            completeness, accuracy, reliability, or availability of the content
            on this site.
          </p>
          <p className="mt-2">
            Sources referenced on this site are linked for transparency.
            External sources may change, become unavailable, or be updated after
            our analysis is published. We are not responsible for the content of
            external websites.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Intellectual Property
          </h2>
          <p>
            The original content, analysis structure, and design of this site
            are the intellectual property of Is This Normal? and are protected by
            applicable copyright and intellectual property laws.
          </p>
          <p className="mt-2">
            You may share links to any page on this site. Brief quotations with
            attribution are permitted for commentary, criticism, or educational
            purposes. Reproduction of substantial portions of the site&apos;s
            content without permission is prohibited.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, Is This Normal?, its
            operators, contributors, and affiliates shall not be liable for any
            direct, indirect, incidental, consequential, or punitive damages
            arising from your use of or inability to use this site, including but
            not limited to reliance on any information provided on the site.
          </p>
          <p className="mt-2">
            This site is provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis without warranties of any kind, either express
            or implied.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Third-Party Services
          </h2>
          <p>
            This site uses third-party services including Google Analytics and
            Google AdSense. Your use of these services is subject to their
            respective terms and privacy policies. We are not responsible for the
            practices of third-party service providers.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will
            be posted on this page with an updated revision date. Your continued
            use of the site after any changes constitutes acceptance of the
            revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            applicable law, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Contact
          </h2>
          <p>
            If you have questions about these Terms of Service, please contact
            us through the site&apos;s public communication channels.
          </p>
        </section>
      </div>
    </div>
  );
}
