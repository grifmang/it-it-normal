"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  defaultValue = "",
  large = false,
}: {
  defaultValue?: string;
  large?: boolean;
}) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className={`${large ? "h-5 w-5" : "h-4 w-4"} text-gray-400`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search claims... e.g. &quot;voter fraud&quot; or &quot;deportation numbers&quot;"
          className={`block w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 ${
            large ? "py-3 pl-11 pr-4 text-base" : "py-2 pl-9 pr-4 text-sm"
          }`}
        />
      </div>
    </form>
  );
}
