import SearchBar from "@/components/SearchBar";
import PainSlides from "@/components/PainSlides";

export const revalidate = 60;

export default async function LandingPage() {
  return (
    <div className="mx-auto max-w-lg px-4">

      {/* 1. 공감 슬라이드 */}
      <section className="pt-12 pb-2">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          혹시 이런 경험 있으신가요?
        </p>
        <PainSlides />
      </section>

      {/* 2. 솔루션 브리지 */}
      <section className="py-8 text-center">
        <div className="mb-3 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
          자리픽의 해결 방법
        </div>
        <h2 className="text-xl font-black leading-snug text-gray-900 sm:text-2xl">
          원하는 자리를 직접 <span className="text-primary-600">신청</span>하세요
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
          일부 구역만, 원하는 사람만, 강제 없이.
          <br />
          이용료는 단지 전체 기금으로 돌아와요.
        </p>

        {/* 3줄 요약 */}
        <div className="mx-auto mt-6 grid max-w-xs grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-gray-50 p-3">
            <div className="text-xl mb-1">🅿️</div>
            <p className="text-xs font-semibold text-gray-700">일부 구역만</p>
            <p className="mt-0.5 text-[11px] text-gray-400">관리사무소 지정</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-3">
            <div className="text-xl mb-1">✋</div>
            <p className="text-xs font-semibold text-gray-700">원하는 사람만</p>
            <p className="mt-0.5 text-[11px] text-gray-400">강제 없음</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-3">
            <div className="text-xl mb-1">🏘️</div>
            <p className="text-xs font-semibold text-gray-700">모두에게 혜택</p>
            <p className="mt-0.5 text-[11px] text-gray-400">공동 기금</p>
          </div>
        </div>
      </section>

      {/* 3. 단지 검색 CTA */}
      <section className="pb-16">
        <div className="rounded-3xl border border-primary-100 bg-primary-50 p-6">
          <h3 className="mb-1 text-center text-base font-black text-gray-900">
            우리 단지도 가능할까요?
          </h3>
          <p className="mb-5 text-center text-xs text-gray-500">
            단지 이름을 검색하고 관심을 표시해보세요
          </p>
          <SearchBar className="w-full" placeholder="단지 이름 검색..." />
          <p className="mt-3 text-center text-xs text-gray-400">
            로그인 없이 클릭 한 번으로 완료돼요
          </p>
        </div>
      </section>

    </div>
  );
}
