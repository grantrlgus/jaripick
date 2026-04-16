import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "자리픽 — 우리 단지 주차 구역 신청",
  description:
    "원하는 주차 구역을 직접 신청하세요. 이용료는 단지 전체 기금으로 돌아와요.",
  openGraph: {
    title: "자리픽 — 우리 단지 주차 구역 신청",
    description:
      "원하는 주차 구역을 직접 신청하세요. 이용료는 단지 전체 기금으로 돌아와요.",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 antialiased">
        <Header />
        <main>{children}</main>
        <footer className="mt-20 border-t border-gray-100 bg-white py-10 text-center text-sm text-gray-400">
          <p>아직 시작 단계예요. 관심이 모이면 우리 단지도 가능해져요.</p>
          <p className="mt-1">© 2025 자리픽. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
