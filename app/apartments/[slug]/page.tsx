import { notFound } from "next/navigation";
import Link from "next/link";
import { getApartmentBySlug } from "@/lib/queries";
import InterestButtons from "@/components/InterestButtons";
import ShareButton from "@/components/ShareButton";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const apt = await getApartmentBySlug(params.slug);
  if (!apt) return { title: "단지를 찾을 수 없어요 — 자리픽" };
  return {
    title: `${apt.name} 선호 주차 구역 — 자리픽`,
    description: `${apt.name}에서 현재 ${apt.participant_count}명이 선호 구역 도입에 관심을 표시했어요.`,
  };
}

export const revalidate = 30;

export default async function ApartmentDetailPage({ params }: Props) {
  const apt = await getApartmentBySlug(params.slug);
  if (!apt) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Back */}
      <Link
        href="/apartments"
        className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        단지 목록
      </Link>

      {/* Apartment header */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-1 text-xs font-medium text-primary-600 uppercase tracking-wide">
          {apt.city !== "서울특별시" ? `${apt.city} ` : ""}
          {apt.district}
        </div>
        <h1 className="text-2xl font-black text-gray-900">{apt.name}</h1>
        <p className="mt-1 text-sm text-gray-400">{apt.address}</p>

        {/* Count with social proof */}
        <div className="mt-6">
          <p className="text-xs text-gray-400">지금 이 단지에서</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-5xl font-black tabular-nums text-primary-600">
              {apt.participant_count}
            </span>
            <span className="text-xl font-semibold text-gray-500">명이 원하고 있어요</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mb-4">
        <InterestButtons
          apartmentId={apt.id}
          apartmentSlug={apt.slug}
          initialCount={apt.participant_count}
        />
      </div>

      {/* Share */}
      <div className="mb-6">
        <ShareButton
          apartmentName={apt.name}
          participantCount={apt.participant_count}
        />
      </div>

      {/* Info card */}
      <div className="mb-6 rounded-2xl bg-blue-50 p-5 border border-blue-100">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          선호 주차 구역 선택 이용이란?
        </div>
        <p className="text-sm leading-relaxed text-blue-800">
          편한 주차 구역을 원하는 입주민이 직접 신청해서 이용하는 방식이에요.
          이용료는 단지 전체의 관리·시설 개선에 쓰이고, 일부 구역에 한해 분기별로 운영돼요.
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-blue-700">
          <li className="flex items-center gap-2">
            <span>✓</span>
            지금 관심 표시는 의무가 아니에요
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span>
            관심이 충분히 모이면 관리사무소에 전달해요
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span>
            도입 여부는 단지가 결정해요
          </li>
        </ul>
      </div>

    </div>
  );
}
