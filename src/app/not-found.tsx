import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-base text-gray-600">
        This page could not be found.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
