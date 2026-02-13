import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              Is This Normal?
            </span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/topics"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Topics
            </Link>
            <Link
              href="/search"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Search
            </Link>
            <Link
              href="/methodology"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Methodology
            </Link>
          </nav>
          <Link
            href="/search"
            className="sm:hidden text-gray-600 hover:text-gray-900"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
