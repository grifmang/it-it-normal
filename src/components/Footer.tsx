import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Is This Normal?
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Evidence-based political claim analysis.
            </p>
          </div>
          <nav className="mt-4 flex gap-6 sm:mt-0">
            <Link
              href="/methodology"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Methodology
            </Link>
            <Link
              href="/topics"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Topics
            </Link>
            <Link
              href="/search"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Search
            </Link>
          </nav>
        </div>
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400">
            This site presents structured evidence for public claims. It does
            not offer legal advice, editorial opinion, or partisan commentary.
            All sources are cited. See our{" "}
            <Link
              href="/methodology"
              className="underline hover:text-gray-600"
            >
              methodology
            </Link>{" "}
            for details.
          </p>
        </div>
      </div>
    </footer>
  );
}
