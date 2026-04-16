import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">자리픽</span>
          <span className="hidden text-sm text-gray-400 sm:inline">
            우리 단지 주차 구역 신청
          </span>
        </Link>
      </div>
    </header>
  );
}
