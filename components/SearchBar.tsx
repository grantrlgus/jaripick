"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface Props {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  defaultValue = "",
  placeholder = "아파트 이름을 검색해보세요",
  className = "",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      router.push(`/apartments?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-800 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-gray-400"
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 active:scale-95 transition-all"
      >
        검색
      </button>
    </form>
  );
}
