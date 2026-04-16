import Link from "next/link";
import type { ApartmentWithCount } from "@/types";

interface Props {
  apartment: ApartmentWithCount;
  rank?: number;
}

export default function ApartmentCard({ apartment, rank }: Props) {
  return (
    <Link
      href={`/apartments/${apartment.slug}`}
      className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {rank !== undefined && (
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                rank <= 3
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {rank}
            </span>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {apartment.name}
            </h3>
            <p className="mt-0.5 text-sm text-gray-400">
              {apartment.city !== "서울특별시" ? `${apartment.city} ` : ""}
              {apartment.district}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-xl font-bold tabular-nums text-primary-600">
            {apartment.participant_count}
          </span>
          <span className="text-xs text-gray-400">명</span>
          <p className="text-xs text-gray-400">관심 표시</p>
        </div>
      </div>
    </Link>
  );
}
