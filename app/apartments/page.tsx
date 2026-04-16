import { searchApartments } from "@/lib/queries";
import SearchBar from "@/components/SearchBar";
import ApartmentCard from "@/components/ApartmentCard";
import Link from "next/link";

interface Props {
  searchParams: { q?: string };
}

export async function generateMetadata({ searchParams }: Props) {
  const q = searchParams.q ?? "";
  return {
    title: q
      ? `"${q}" 검색 결과 — 자리픽`
      : "아파트 검색 — 자리픽",
  };
}

export default async function ApartmentsPage({ searchParams }: Props) {
  const query = searchParams.q ?? "";
  const apartments = await searchApartments(query);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back + Search */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          홈
        </Link>
        <SearchBar defaultValue={query} className="flex-1" />
      </div>

      {/* Results header */}
      {query ? (
        <h2 className="mb-5 text-base font-semibold text-gray-700">
          &ldquo;{query}&rdquo; 검색 결과{" "}
          <span className="text-primary-600 font-bold">{apartments.length}개</span>
        </h2>
      ) : (
        <h2 className="mb-5 text-base font-semibold text-gray-700">
          전체 단지{" "}
          <span className="text-primary-600 font-bold">{apartments.length}개</span>
        </h2>
      )}

      {/* Results */}
      {apartments.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-base font-medium text-gray-600">
            &ldquo;{query}&rdquo;에 해당하는 단지를 찾지 못했어요.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            다른 이름으로 검색해보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apartments.map((apt) => (
            <ApartmentCard key={apt.id} apartment={apt} />
          ))}
        </div>
      )}
    </div>
  );
}
