"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    emoji: "😤",
    situation: "밤 11시 퇴근",
    pain: "자리가 없어서\n이중주차 했더니\n새벽 2시에 문자",
    quote: '"차 빼주세요"',
    bg: "bg-orange-50",
    border: "border-orange-200",
    badgeClass: "bg-orange-100 text-orange-700",
  },
  {
    emoji: "😰",
    situation: "아침 출근길",
    pain: "내 차 앞에\n남의 차가 딱 막혀\n있어요",
    quote: '"지각할 뻔했어요"',
    bg: "bg-red-50",
    border: "border-red-200",
    badgeClass: "bg-red-100 text-red-700",
  },
  {
    emoji: "😒",
    situation: "매일 반복",
    pain: "좋은 자리는\n항상 그 집 차가\n차지하고 있어요",
    quote: '"누군 항상 좋은 자리"',
    bg: "bg-slate-50",
    border: "border-slate-200",
    badgeClass: "bg-slate-200 text-slate-600",
  },
];

const INTERVAL = 3200;

export default function PainSlides() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  function goTo(index: number) {
    setVisible(false);
    setTimeout(() => {
      setActive(index);
      setVisible(true);
    }, 180);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((active + 1) % SLIDES.length);
    }, INTERVAL);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const slide = SLIDES[active];

  return (
    <div className="mb-6">
      {/* Card */}
      <div
        className={`rounded-3xl border p-6 text-center ${slide.bg} ${slide.border} transition-opacity duration-200`}
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div className="mb-4 text-center">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${slide.badgeClass}`}>
            {slide.situation}
          </span>
        </div>

        <div className="mb-3 text-4xl text-center">{slide.emoji}</div>

        <h3 className="mb-3 whitespace-pre-line text-xl font-black leading-snug text-gray-900 text-center">
          {slide.pain}
        </h3>

        <p className="text-sm font-medium text-gray-500 italic text-center">{slide.quote}</p>
      </div>

      {/* Dot indicators */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-gray-700" : "w-2 bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label={`${i + 1}번째 사례`}
          />
        ))}
      </div>
    </div>
  );
}
