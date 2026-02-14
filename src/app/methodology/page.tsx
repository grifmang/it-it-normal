import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How we research, structure, and present evidence for political claims.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Methodology</h1>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            What This Site Does
          </h2>
          <p>
            Is This Normal? presents structured evidence for political claims
            that appear in public discourse. Each claim page provides primary
            sources, a summary of evidence for and against the claim, a
            chronological timeline of events, and a structured interpretation
            section.
          </p>
          <p className="mt-2">
            This site does not offer legal advice, editorial opinion, or
            partisan commentary.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            How Claims Are Selected
          </h2>
          <p>
            Claims are selected based on public interest, search volume, and
            recurring appearance in news cycles. We prioritize claims that are
            widely repeated, frequently mischaracterized, or difficult to verify
            through a single source.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            How Claims Are Researched
          </h2>
          <p>Each claim undergoes the following process:</p>
          <ol className="mt-2 list-decimal space-y-2 pl-6">
            <li>
              <strong>Identification:</strong> The claim is stated as precisely
              as possible, in the form it most commonly appears.
            </li>
            <li>
              <strong>Source collection:</strong> Primary sources are gathered
              including court filings, official government statements, inspector
              general reports, congressional testimony, and credible news
              reporting.
            </li>
            <li>
              <strong>Evidence structuring:</strong> Evidence is divided into
              what supports the claim and what provides additional context or
              contradicts it.
            </li>
            <li>
              <strong>Timeline construction:</strong> Key dates and events are
              organized chronologically.
            </li>
            <li>
              <strong>Status assignment:</strong> A status is assigned based on
              the weight of available evidence.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Status Definitions
          </h2>
          <div className="space-y-3">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="font-semibold text-green-700">
                Supported by Evidence
              </p>
              <p className="mt-1 text-gray-600">
                The available primary sources substantially support the claim as
                stated.
              </p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="font-semibold text-amber-700">Mixed Evidence</p>
              <p className="mt-1 text-gray-600">
                Some evidence supports the claim, but significant caveats,
                context, or contradicting evidence exists.
              </p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="font-semibold text-red-700">
                Not Supported by Evidence
              </p>
              <p className="mt-1 text-gray-600">
                The available evidence does not support the claim as commonly
                stated.
              </p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="font-semibold text-gray-700">Unresolved</p>
              <p className="mt-1 text-gray-600">
                Insufficient evidence exists to make a determination, or the
                matter is still pending (e.g., ongoing investigation or
                litigation).
              </p>
            </div>
          </div>
        </section>


        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Continuous Fact-Check Coverage
          </h2>
          <p>
            We continuously monitor structured fact-check ecosystems (including
            Google Fact Check claim reviews and dedicated fact-checker feeds) to
            identify where claims are evolving, disputed across outlets, or
            newly resurfacing with updated context.
          </p>
          <p className="mt-2">
            Existing fact-checks are used as a starting map, not a final
            verdict. We prioritize claims where new evidence, official records,
            or changed circumstances may alter the interpretation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Editorial Standards
          </h2>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>All factual assertions are cited to primary sources.</li>
            <li>
              Language is neutral and avoids adjectives that imply judgment.
            </li>
            <li>
              &ldquo;What This Means&rdquo; sections present structured
              interpretation, not opinion.
            </li>
            <li>
              Claims are updated when new evidence becomes available, with
              update dates noted.
            </li>
            <li>
              No claim page expresses support for or opposition to any political
              party, candidate, or ideology.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Corrections
          </h2>
          <p>
            If you identify an error in any claim page, including broken source
            links, factual inaccuracies, or missing context, please contact us.
            All corrections are reviewed and applied promptly, with the update
            date reflected on the affected claim page.
          </p>
        </section>
      </div>
    </div>
  );
}
