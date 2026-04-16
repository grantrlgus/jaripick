# 카파크 (Carpark)

우리 아파트 주차자리 도입 관심 수집 서비스 — 3일 MVP

## 서비스 소개

카파크는 아파트 입주민이 "좋은 주차자리를 더 공정하게 운영하는 방식"에 관심이 있는지를 확인하는 수요 검증 서비스입니다.

- 경매·입찰 없음. 관심 표시만.
- 목표 인원 달성 시 입대의 제안 자료를 안내.
- 단지별 참여 현황을 공개해 사회적 증거(social proof) 형성.

---

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 인증 | NextAuth v5 + Kakao OAuth |
| DB | Supabase (PostgreSQL) |
| 배포 | Vercel |

---

## 로컬 개발 환경 설정

### 1. 저장소 복사 & 의존성 설치

```bash
git clone <repo-url>
cd carpark
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열고 아래 항목을 채웁니다.

| 변수 | 발급 위치 | 설명 |
|------|-----------|------|
| `AUTH_SECRET` | `openssl rand -base64 32` | NextAuth 서명 키 |
| `AUTH_KAKAO_ID` | [카카오 개발자 콘솔](https://developers.kakao.com) → 내 애플리케이션 → REST API 키 | Kakao OAuth Client ID |
| `AUTH_KAKAO_SECRET` | 카카오 콘솔 → 보안 → Client Secret 활성화 | Kakao OAuth Client Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 대시보드 → Settings → API | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 대시보드 → Settings → API | anon/public 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 대시보드 → Settings → API | service_role 키 (서버 전용) |

### 3. Supabase DB 초기화

[Supabase SQL Editor](https://supabase.com/dashboard)에서 순서대로 실행:

```
1. supabase/schema.sql  ← 테이블·뷰·RLS 생성
2. supabase/seed.sql    ← 12개 단지 + 더미 관심 수 삽입
```

### 4. Kakao OAuth 리디렉션 URI 등록

카카오 개발자 콘솔 → 내 애플리케이션 → 카카오 로그인 → Redirect URI:

```
http://localhost:3000/api/auth/callback/kakao
```

### 5. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인합니다.

---

## Vercel 배포

### 1. Vercel 프로젝트 연결

```bash
npx vercel --prod
```

또는 GitHub 저장소를 Vercel에 import합니다.

### 2. 환경 변수 등록

Vercel 대시보드 → Settings → Environment Variables에서 `.env.example`의 모든 항목을 추가합니다.

> `NEXTAUTH_URL`은 Vercel 배포 URL로 변경하세요.  
> 예: `https://carpark.vercel.app`

### 3. Kakao 리디렉션 URI 추가

카카오 콘솔에서 프로덕션 URI도 추가합니다:

```
https://your-domain.vercel.app/api/auth/callback/kakao
```

---

## 주요 파일 구조

```
app/
  page.tsx                  ← 랜딩 페이지
  apartments/page.tsx       ← 검색 결과
  apartments/[slug]/page.tsx← 단지 상세 + 관심 표시
  auth/login/page.tsx       ← 카카오 로그인
  actions/interest.ts       ← 관심 표시 서버 액션
auth.ts                     ← NextAuth 설정
lib/
  supabase.ts               ← Supabase 클라이언트
  queries.ts                ← DB 쿼리 함수
supabase/
  schema.sql                ← DB 스키마
  seed.sql                  ← 시드 데이터
```

---

## 남은 작업 (다음 스프린트)

- [ ] Naver 로그인 추가 (`next-auth/providers/naver`)
- [ ] 관리사무소 제안서 PDF 자동 생성
- [ ] 카카오 공유하기 API 연동
- [ ] 관리자 페이지 (단지 추가/수정)
- [ ] 이메일 알림 (목표 달성 시)

---

## 라이선스

Private — MVP validation only.
