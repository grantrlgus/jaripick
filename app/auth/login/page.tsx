import { signIn } from "@/auth";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  searchParams: { callbackUrl?: string };
}

export const metadata = {
  title: "로그인 — 카파크",
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) {
    redirect(searchParams.callbackUrl ?? "/");
  }

  const callbackUrl = searchParams.callbackUrl ?? "/";

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-black text-primary-600">
          카파크
        </Link>
        <p className="mt-2 text-sm text-gray-500">
          관심 표시를 하려면 로그인이 필요해요
        </p>
      </div>

      <div className="space-y-3">
        {/* Kakao */}
        <form action={async () => { "use server"; await signIn("kakao", { redirectTo: callbackUrl }); }}>
          <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] py-4 text-sm font-bold text-[#191919] shadow-sm transition hover:brightness-95 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.477 3 2 6.477 2 10.95c0 2.81 1.857 5.29 4.65 6.73l-1.187 4.334a.375.375 0 0 0 .548.416L11.1 19.49c.295.033.595.05.9.05 5.523 0 10-3.477 10-7.59C22 6.477 17.523 3 12 3z" />
            </svg>
            카카오로 시작하기
          </button>
        </form>

        {/* Naver */}
        <form action={async () => { "use server"; await signIn("naver", { redirectTo: callbackUrl }); }}>
          <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#03C75A] py-4 text-sm font-bold text-white shadow-sm transition hover:brightness-95 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
            </svg>
            네이버로 시작하기
          </button>
        </form>

        {/* Google */}
        <form action={async () => { "use server"; await signIn("google", { redirectTo: callbackUrl }); }}>
          <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 시작하기
          </button>
        </form>

        <p className="pt-1 text-center text-xs text-gray-400">
          로그인 시 관심 표시는 계정당 단지 1회로 제한됩니다.
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link href={callbackUrl} className="text-sm text-gray-400 hover:text-gray-600">
          ← 돌아가기
        </Link>
      </div>
    </div>
  );
}
