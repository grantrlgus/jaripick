"use client";

interface Props {
  apartmentName: string;
  participantCount: number;
}

export default function ShareButton({ apartmentName, participantCount }: Props) {
  async function handleShare() {
    const text = `${apartmentName}에서 주차자리 관심 표시 중! 현재 ${participantCount}명이 참여했어요. 우리 단지도 가능하면 좋겠다면 같이 표시해봐요.`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "카파크", text, url });
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("링크가 복사되었어요!");
      } catch {
        alert("링크를 복사해주세요:\n" + url);
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 active:scale-95"
    >
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
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" x2="12" y1="2" y2="15" />
      </svg>
      우리 단지도 가능하면 좋겠다면 공유해보세요
    </button>
  );
}
