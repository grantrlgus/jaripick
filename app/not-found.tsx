import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <div className="mb-4 text-5xl">🏢</div>
      <h2 className="text-xl font-bold text-gray-800">페이지를 찾을 수 없어요</h2>
      <p className="mt-2 text-sm text-gray-500">
        단지가 없거나 주소가 잘못되었어요.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
