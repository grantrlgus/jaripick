"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    emoji: "🅿️",
    tag: "지금 우리 단지는",
    title: "좋은 자리,\n선착순이 공정한가요?",
    body: "입구 근처, 엘리베이터 앞 좋은 자리는 선착순이나 추첨으로 배정돼요. 원하는 사람이 많아도 선택권이 없어요.",
    bg: "bg-slate-50",
    border: "border-slate-200",
    tagClass: "bg-slate-200 text-slate-600",
  },
  {
    emoji: "🎯",
    tag: "선호 구역 선택 이용",
    title: "원하는 사람이\n선택해서 이용하는 구조",
    body: "편한 자리를 원하는 입주민이 직접 신청해요. 일부 구역에 한해 분기별로 운영되고, 강제 배정은 없어요.",
    bg: "bg-blue-50",
    border: "border-blue-200",
    tagClass: "bg-blue-200 text-blue-700",
  },
  {
    emoji: "🏘️",
    tag: "이용료는 단지 전체로",
    title: "선택한 사람이 내고,\n모두가 혜택을",
    body: "구역 이용료는 단지 공동 기금으로 돌아와요. 주차장 조명, 공용 시설 개선 등 모든 입주민이 혜택을 받아요.",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    tagClass: "bg-emerald-200 text-emerald-700",
  },
  {
    emoji: "📋",
    tag: "지금 할 수 있는 것",
    title: "우리 단지도\n도입 관심 표시",
    body: "지금은 도입을 원하는 입주민의 관심을 모으는 단계예요. 관심이 충분히 모이면 다음 단계로 진행돼요.",
    bg: "bg-violet-50",
    border: "border-violet-200",
    tagClass: "bg-violet-200 text-violet-700",
  },
];

const INTERVAL = 3500;

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  function goTo(index: number) {
    setVisible(false);
    setTimeout(() => {
      setActive(index);
      setVisible(true);
    }, 220);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((active + 1) % STEPS.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const step = STEPS[active];

  return (
    <section className="mb-16">
      <h2 className="mb-5 text-lg font-bold text-gray-900">어떻게 작동하나요?</h2>

      {/* Card */}
      <div
        className={`rounded-3xl border p-6 ${step.bg} ${step.border} transition-opacity duration-200 ease-in-out`}
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${step.tagClass}`}>
            {step.tag}
          </span>
          <span className="text-xs text-gray-400">{active + 1} / {STEPS.length}</span>
        </div>

        <div className="mb-3 text-4xl">{step.emoji}</div>

        <h3 className="mb-2 whitespace-pre-line text-xl font-black leading-snug text-gray-900">
          {step.title}
        </h3>
        <p className="text-sm leading-relaxed text-gray-600">{step.body}</p>
      </div>

      {/* Dot indicators */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-primary-600" : "w-2 bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label={`${i + 1}번째 단계`}
          />
        ))}
      </div>
    </section>
  );
}
