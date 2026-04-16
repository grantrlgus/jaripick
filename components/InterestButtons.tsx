"use client";

import { useState, useTransition, useEffect } from "react";
import { submitInterest } from "@/app/actions/interest";

const LS_KEY = (apartmentId: string) => `jaripeek_interest_${apartmentId}`;

interface Props {
  apartmentId: string;
  apartmentSlug: string;
  initialCount: number;
}

export default function InterestButtons({
  apartmentId,
  apartmentSlug,
  initialCount,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(initialCount);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage on mount to restore done state
  useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY(apartmentId)) === "1") {
        setDone(true);
      }
    } catch {}
  }, [apartmentId]);

  function handleClick() {
    if (done || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await submitInterest(apartmentId, apartmentSlug, "participate_if_adopted");
      if ("success" in result) {
        setCount(result.participantCount);
        setDone(true);
        try { localStorage.setItem(LS_KEY(apartmentId), "1"); } catch {}
      } else if (result.error === "already_signaled") {
        setDone(true);
        try { localStorage.setItem(LS_KEY(apartmentId), "1"); } catch {}
      } else {
        setError("오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      }
    });
  }

  if (done) {
    return (
      <div className="space-y-4">
        {/* Success card */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
          <div className="mb-2 text-3xl">🎉</div>
          <h3 className="text-lg font-bold text-gray-900">관심 표시 완료!</h3>
          <p className="mt-1 text-sm text-gray-500">
            충분한 관심이 모이면 관리사무소에 전달할게요.
          </p>
        </div>

        {/* Count */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-5">
          <span className="text-4xl font-black tabular-nums text-primary-600">
            {count}
          </span>
          <span className="text-base text-gray-500">명이 함께 원하고 있어요</span>
        </div>

        {/* Share nudge */}
        <p className="text-center text-xs text-gray-400">
          이웃에게도 알려주세요 — 관심이 많을수록 도입이 빨라져요 🙌
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-2xl bg-primary-600 px-4 py-5 text-[16px] font-bold text-white shadow-md shadow-primary-100 transition-all hover:bg-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            처리 중...
          </span>
        ) : (
          "우리 단지도 가능하면 좋겠어요 👋"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        클릭 한 번으로 완료돼요
      </p>

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
