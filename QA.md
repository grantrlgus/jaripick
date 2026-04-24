# 자리픽 QA — 실서비스 검증 시나리오

> **목적**: 데모가 아닌 **실서비스 출시 전** 기능이 진짜로 작동하는지 검증.
> 각 시나리오 옆에 **현재 구현 상태**를 표기:
> - 🟢 **real** — 백엔드까지 동작, 데이터 영속
> - 🟡 **partial** — 단지(`heliocity`) 한정으로만 동작, 또는 일부 케이스 누락
> - 🔴 **mock** — UI만 있음, 실제 효과 없음
> - ⚫ **orphan** — 화면은 있으나 진입 경로 없음
> - ❌ **broken** — 시도 시 실패

---

## 🚨 출시 전 필수 차단 이슈 (CRITICAL)

이 5개를 해결하지 않으면 **유저가 1단계도 못 넘어감**.

| # | 이슈 | 영향 | 현 상태 |
|---|---|---|---|
| C1 | **다단지 미지원** — KAPT 검색은 1만+ 개 노출하지만, `households` 시드는 `heliocity` 1개. 다른 단지 선택 시 `pending` 영구 고착 | 헬리오시티 외 모든 사용자 가입 막힘 | 🔴 |
| C2 | **본인인증 mock** — SMS 미발송, 6자리 아무거나 통과. 중복 가입 방지 무력화 | 본인 확인 의미 없음 | 🔴 |
| C3 | **관리자 시드 없음** — `admin_users` 테이블 비어있음. 어드민 로그인 불가 | 관리자 콘솔 전체 차단 | ❌ |
| C4 | **complex 파라미터 누락** — 입주민 앱이 `/api/rounds`, `/api/cells`, `/api/payments` 등을 호출할 때 `?complex=` 미전달. 서버는 `heliocity` 기본값 사용 | 다른 단지 사용자 빈 화면 또는 남의 단지 데이터 노출 | ❌ |
| C5 | **PendingScreen 폴링 누락** — `/api/residents/requests/{id}` 호출 시 complex 파라미터 없음. 헬리오시티 외 신청자 상태 확인 불가 | pending 영구 고착 | ❌ |

→ **해결책**: 한 단지에만 집중하거나(예: 헬리오시티 사전 입주) 다단지 인프라(관리자 단지별 가입 + 명단 import + complex slug 라우팅)를 구축. **선택 필요**.

---

## 0. 사전 환경 점검

| 항목 | 명령/확인 | 기대 |
|---|---|---|
| Supabase 마이그레이션 | `schema.sql`, `add_demo_tables.sql`, `add_active_households.sql`, `add_cell_photo.sql`, `add_complaints.sql`, `add_payments.sql`, `seed-kapt.sql` 모두 적용 | 테이블 16개 이상 생성 |
| `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 모두 채워짐 |
| Vercel env vars | 위와 동일 | prod 배포 200 |
| Storage bucket `cell-photos` | Supabase Dashboard → Storage | 존재, public read 정책 OK |
| Google OAuth provider | Supabase Auth → Providers → Google ON | Client ID/Secret 입력됨 |
| `admin_users` 시드 | `SELECT * FROM admin_users;` | super 1명 이상 |
| `households` 시드 | `SELECT complex, count(*) FROM households GROUP BY complex;` | 타겟 단지 모두 존재 |

---

## A. 입주민 앱 (`/resident/`) — 온보딩

### A1. SplashScreen → LoginScreen 라우팅

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 첫 방문 (세션 X) → splash 1.2s → login | login 화면 | 🟢 real |
| 세션 O + 본인인증 X → splash → phone_auth | phone_auth 화면 | 🟢 real |
| 세션 O + 본인인증 O + 동/호 X → complex_register | complex_register | 🟢 real |
| 세션 O + 동/호 O → home | home | 🟢 real |

**검증법**: DevTools Console에서 `localStorage.clear(); location.reload();` 후 각 상태 조작.

### A2. LoginScreen — 구글 OAuth

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| "구글로 시작하기" 클릭 → Google 동의 → `/resident/` 복귀 | 세션 발급, 자동 라우팅 | 🟢 real |
| OAuth 취소 시 | login 머무름, 에러 안 뜸 | 🟢 real |
| Supabase 다운/네트워크 오류 시 | alert("로그인 실패: ...") | 🟢 real |
| URL hash(`#access_token=...`) 정리 | `history.replaceState` 로 깔끔 URL | 🟢 real |

### A3. PhoneAuthScreen — 본인인증

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 휴대폰 번호 입력 → "인증번호 받기" → step 2 | 단계 전환 | 🟢 real |
| **실제 SMS 수신** | 입력한 번호로 6자리 도착 | 🔴 **mock — SMS 발송 X** |
| 6자리 입력 → "확인" → complex_register | 다음 화면 | 🟢 real (검증은 mock) |
| 잘못된 번호로 중복 가입 차단 | 같은 번호 재가입 막음 | 🔴 **미구현** |
| 통신사/실명 검증 | 본인 명의 확인 | 🔴 **미구현** |

→ **출시 전 필요**: NICE 본인인증 또는 Coolsms + 실명 매칭 구현.

### A4. ComplexRegisterScreen — 단지 검색 & 가입

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 진입 시 검색창 자동 포커스 | 키보드 즉시 표시 | 🟢 real |
| "오금" 입력 → 250ms debounce → 결과 | KAPT 실 데이터 (오금우방, 오금현대백조 등) | 🟢 real |
| 결과 클릭 → 선택 카드 + 동/호/이름 입력 단계 | UI 전환 | 🟢 real |
| "변경" 버튼 → 검색 단계 복귀 | 검색창 다시 노출 | 🟢 real |
| **헬리오시티 명단 일치 (101동 1201호 김철수)** → 즉시 승인 → home | `status: approved` | 🟢 real |
| **헬리오시티 명단 불일치** → pending | `status: pending` + PendingScreen | 🟢 real (관리자 승인 필요) |
| **다른 단지 (예: "오금현대백조")** → pending | 영구 pending | 🟡 partial — 해당 단지에 admin/households 없으면 영영 안 됨 |
| 검색 결과 없음 ("zzzzz") | "검색 결과가 없어요" 메시지 | 🟢 real |

### A5. PendingScreen

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 진입 시 1회 즉시 폴링 + 5초 간격 | `/api/residents/requests/{id}` 호출 | 🟢 real |
| 관리자가 승인 → 자동으로 home 이동 | 800ms 후 전환 | 🟢 real |
| 관리자가 거절 → 사유 표시 | rejected UI + reason | 🟢 real |
| 다른 단지 가입자 폴링 | complex 파라미터 누락 → 헬리오시티 데이터 조회 → 잘못된 결과 | ❌ **broken** (C5) |

### A6. VehicleScreen (선택)

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 차량번호 + 차종 + 전기차 토글 → 등록 완료 | localStorage 저장, pending 화면 | 🟢 real |
| 차량 정보 서버 저장 | DB `households.car_*` 컬럼 업데이트 | 🔴 **localStorage만 — DB 미반영** |

→ 차량 정보가 관리자에게 전달 안 됨. 출시 전 API 연결 필요.

---

## B. 입주민 앱 — 메인 기능

### B1. HomeScreen

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 진행 중 라운드 배너 표시 (D-day) | live round 정보 | 🟡 partial — `?complex=` 미전달, heliocity만 |
| 인기 구역 Top 5 | 입찰 많은 셀 정렬 | 🟡 partial — heliocity만 |
| 내 입찰 현황 (1위/순위 밖) | dong/ho 매칭 | 🟡 partial — heliocity만 |
| 내 낙찰 구역 (finalized) | 확정된 자리 | 🟡 partial — heliocity만 |
| 10초마다 자동 갱신 | setInterval(load, 10000) | 🟢 real |

### B2. SpotListScreen / SpotDetailScreen

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 활성 구역만 목록 표시 | `active=true` 필터 | 🟡 partial — heliocity만 |
| 구역 사진 표시 | parking_cells.photo_url | 🟢 real (storage bucket 설정됨) |
| 입찰자 수 / 최고가 | per_cell 집계 | 🟢 real |
| "입찰하기" 버튼 → BidScreen | 라운드 활성 시만 | 🟢 real |

### B3. BidScreen — 입찰 제출

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 금액 입력 → 제출 → POST /api/bids | 200 + 성공 토스트 | 🟢 real |
| `min_bid` 미달 시 거절 | 400 에러 | 🟢 real |
| 입찰 종료 시각(`bid_end`) 이후 제출 | 409 거절 | 🟢 real |
| 같은 세대가 다른 구역에 이미 입찰 | 확인 다이얼로그 → 자동 이관 | 🟢 real |
| 동일 구역 재입찰 (금액 갱신) | 최신 금액으로 갱신 | 🟢 real |
| **rate limit / 봇 방어** | IP/세션당 분당 N회 | 🔴 **미구현** |
| **금액 검증 (음수, 큰 수, 소수)** | 서버 검증 | 🟡 partial — 양수 체크만 |

### B4. MyBidsScreen / RebidCancelScreen / CertScreen

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 내가 낸 입찰 전체 (구역별 최신만) | dong/ho 필터 | 🟢 real |
| 입찰 취소 | DELETE /api/bids/{id} | 🟢 real |
| 라운드 종료 후 낙찰자 권리증 표시 | finalized round 매칭 | 🟢 real |
| 권리증 인쇄/캡처 | 디자인된 카드 | 🟢 real |

### B5. NotificationsScreen

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 입주민 승인/거절 알림 | 폴링 결과 표시 | 🟢 real |
| 입찰 1위/순위 밀림/낙찰 알림 | 라운드 detail 집계 | 🟢 real |
| **푸시 알림** (앱 미접속 시) | OS 알림 | 🔴 **미구현** (PWA 푸시 가능하지만 미세팅) |
| 알림 클릭 → 해당 화면 이동 | go(action) | 🟢 real |

### B6. SettingsScreen

| 항목 | 동작 | 현 상태 |
|---|---|---|
| 프로필 (이름/단지) | 표시 | 🟢 real |
| 차량 정보 | VehicleScreen 이동 | 🟢 real |
| 알림 설정 | — | ⚫ orphan (`to: null`) |
| 결제 수단 | — | ⚫ orphan (`to: null`) |
| 문의 / 민원 | SupportScreen 이동 | 🟢 real |
| 도움말 / FAQ | FAQScreen | 🟢 real |
| 이용약관 · 개인정보 | — | ⚫ orphan (`to: null`) |
| 로그아웃 | supabase signOut + localStorage 정리 | 🟢 real |
| 구글 프로필 사진/이메일 표시 | user_metadata 사용 | 🟢 real |

→ **출시 전**: 알림 설정/결제 수단/이용약관 화면 구현 또는 row 제거.

### B7. PaymentScreen

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 미납/완납 결제 목록 | dong/ho 필터 | 🟡 partial — heliocity만 |
| **실제 결제 처리** | PG 연동 (카드/계좌) | 🔴 **미구현 — "관리비 합산" 안내만** |
| 영수증 다운로드 | PDF | 🔴 미구현 |

### B8. SupportScreen / FAQScreen / ErrorScreen

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 민원 작성 → 관리자 전달 | POST /api/complaints | 🟢 real |
| 답변 폴링 | GET /api/complaints | 🟢 real |
| 플랫폼 에스컬레이션 | system reply | 🟢 real |
| FAQ 정적 페이지 | 하드코딩 Q&A | 🟢 real |
| ErrorScreen | 에러 시 안내 + 홈 복귀 | 🟢 real |

---

## C. 관리자 웹 (`/admin/`)

### C0. 관리자 로그인

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| Supabase Auth 이메일/패스워드 로그인 | 세션 + admin_users 매칭 | 🟢 real |
| `admin_users` 미시드 시 | 로그인 불가 | ❌ **broken** (C3) |
| 권한별 접근 (super / 단지 관리자) | canAccessComplex 체크 | 🟢 real |

→ **출시 전 필수**: `add_admin_users.sql` 의 주석 부분을 채워서 super admin 1명 이상 사전 등록.

### C1. 대시보드

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 카드 숫자 (구역/입찰가능/승인대기/진행중) | DB 집계 | 🟢 real |
| 진행 중 라운드 D-day | bid_end 기준 | 🟢 real |
| 빠른 링크 | navigation | 🟢 real |

### C2. 레이아웃 에디터

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 네이버 지도 로드 | NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 필요 | 🟡 partial — env 누락 시 빈 지도 |
| 셀 추가 / 드래그 / 회전 | UI 동작 | 🟢 real |
| 저장 (PUT /api/cells) | DB 영속 | 🟢 real |
| **사진 업로드** | storage `cell-photos` bucket 필요 | 🟡 partial — bucket 미생성 시 500 |
| 사진 삭제 | DELETE /api/cells/{id}/photo | 🟢 real |

### C3. 구역 목록 / C4. 입주민 명단

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 셀 테이블 | 모두 표시 | 🟢 real |
| 타입/활성 토글 | 즉시 저장 | 🟢 real |
| 명단 GET | complex별 | 🟢 real |
| 단건 추가 | POST /api/households | 🟢 real |
| **CSV 일괄 업로드** | PUT /api/households (rows replace) | 🟢 real |
| 자동 재매치 (rematchPending) | pending 신청자 자동 승인 | 🟢 real |
| 신청자 수동 승인/거절 | PATCH /api/residents/requests/{id} | 🟢 real |

### C5. 입찰 라운드 / 모니터링 / 확정

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 라운드 생성 (이름, bid_window, min_bid) | POST /api/rounds | 🟢 real |
| live 라운드 실시간 입찰 현황 | per_cell 집계 5초 갱신 | 🟢 real |
| 라운드 finalize | 낙찰자 결정 + payments 자동 생성 | 🟢 real |
| **finalize 누락 시** | 결제 미생성 → 수익 손실 | 🟡 partial — 자동 트리거 없음, 관리자가 직접 클릭해야 함 |
| 동일 세대 한 구역 제한 | 409 거절 | 🟢 real |
| 계약 기간 겹침 차단 | 409 거절 | 🟢 real |

### C6. 결제 관리 / C7. 공지 / C8. 민원

| 시나리오 | 기대 | 현 상태 |
|---|---|---|
| 결제 목록 (paid/pending/overdue) | 단지별 | 🟢 real |
| 결제 상태 변경 | PATCH | 🟢 real |
| **PG 연동** | 카드 결제 / 자동이체 | 🔴 미구현 |
| 공지 작성 → 입주민 발송 | POST /api/notices | 🟢 real (in-app만, 푸시 X) |
| 민원 응답 | 답변 작성 → 입주민에게 표시 | 🟢 real |
| 플랫폼 에스컬레이션 | 운영팀에게 전달 | 🟢 real |

---

## D. API 인증 / 보안

| 엔드포인트 | 인증 | 현 상태 |
|---|---|---|
| `POST /api/residents/match` | 없음 (공개) | 🟡 — 봇 방어 필요 |
| `GET /api/residents/requests/{id}` | 없음 | 🟡 — request_id 추측 공격 가능 (UUID라 어렵지만) |
| `POST /api/bids` | 없음 | 🔴 — **인증 없음, dong/ho만 보내면 누구나 남의 세대로 입찰 가능** |
| `POST /api/cells/{id}/photo` | requireAdmin | 🟢 |
| `POST /api/households` | requireAdmin + canAccessComplex | 🟢 |
| `POST /api/rounds` | requireAdmin | 🟢 |
| `PATCH /api/residents/requests/{id}` | requireAdmin | 🟢 |
| `GET /api/public/config` | 없음 (의도) | 🟢 — anon key만 노출 |

→ **출시 전 필수**: 입주민 API에 Supabase 세션 검증 추가. 입찰자 dong/ho는 서버에서 세션→user_profile→household 매핑으로 결정해야 함.

---

## E. E2E 시나리오 (실서비스 happy path)

### E1. 입주민 신규 가입 (헬리오시티 = 시드된 단지)
1. https://jaripick.com/resident/ 접속
2. 구글 로그인
3. 휴대폰 번호 입력 → 인증 (🔴 mock 통과)
4. "헬리오시티" 또는 "오금" 검색 → 선택 → 동/호/이름 입력 ("101 / 1201 / 김철수")
5. 즉시 승인 → home 진입 (헬리오시티 명단 매칭 시)
6. 홈에서 진행 중 라운드 배너 보임 (live round 있을 시)
7. 구역 목록 → 사진 확인 → 입찰
8. 다른 사용자가 더 높은 가격 입찰 시 알림
9. 라운드 종료 → 권리증 확인
10. 결제 안내 (현재 "관리비 합산" 만)

### E2. 관리자 운영
1. /admin 로그인 (수동 시드된 super admin)
2. 입주민 명단 CSV 업로드
3. 구역 레이아웃 그리기 + 사진 업로드
4. 라운드 생성 (입찰 시작/종료 시각, 최소가)
5. 모니터링 → 종료 시각 도래 → finalize
6. 결제 자동 생성 확인
7. 민원 답변

### E3. 다단지 케이스 (현재 broken)
1. 신규 단지 "엘스 잠실" 사용자 가입 시도 → ❌ pending 영구
   - **해결**: 해당 단지 관리자 사전 가입 + 명단 import 필요. 현재 인프라 없음.

---

## F. 출시 전 필수 작업 체크리스트 (우선순위순)

### Tier 1 — 막힘 해결 (없으면 서비스 불가)
- [ ] **C3** super admin 1명 이상 시드 (`admin_users` 수동 INSERT)
- [ ] **C4/C5** 입주민 앱 모든 fetch 호출에 `?complex=${jp_complex_slug}` 추가
- [ ] **B3** `/api/bids` 인증 추가 (Supabase 세션 → 본인 dong/ho 만 입찰 가능)
- [ ] **C1** 단지 1개로 한정한다면 KAPT 검색 비활성화 또는 "헬리오시티만 가능" 안내. 다단지로 갈 거면 households 일괄 import 인프라

### Tier 2 — 사용자 경험 정상화
- [ ] **C2** 본인인증 실 SMS 연동 (NICE 또는 Coolsms)
- [ ] PG 결제 연동 (토스페이먼츠 등) — PaymentScreen
- [ ] PWA 푸시 알림 세팅 (서비스워커 + Web Push)
- [ ] VehicleScreen → DB 저장 (현재 localStorage만)
- [ ] SettingsScreen orphan rows (알림설정/결제수단/이용약관) 구현 또는 제거

### Tier 3 — 보안 / 운영
- [ ] `/api/bids`, `/api/residents/match` 봇 방어 (rate limit, captcha)
- [ ] Storage `cell-photos` bucket 명시적 검증 + RLS 정책
- [ ] 라운드 finalize 자동화 (cron / Edge Function)
- [ ] 에러 모니터링 (Sentry 등)
- [ ] DB 백업 정책

### Tier 4 — 법적 / 정책
- [ ] 이용약관 / 개인정보처리방침 (한국 법규 준수)
- [ ] 개인정보 수집 동의 화면
- [ ] 사업자등록 (필요 시)
- [ ] PIPA 준수 검토

---

## 부록: 빠른 검증 명령어

```sql
-- 단지별 명단 수
SELECT complex, count(*) FROM households GROUP BY complex;

-- 진행 중 라운드
SELECT * FROM rounds WHERE status='live';

-- pending 신청자 (장기간 처리 안 된 것)
SELECT id, complex, dong, ho, name, created_at
FROM resident_requests WHERE status='pending'
ORDER BY created_at;

-- 미납 결제
SELECT count(*) FROM payments WHERE status='pending';

-- 어제 입찰 활동
SELECT count(*) FROM bids WHERE created_at > now() - interval '1 day';
```

```bash
# Prod 헬스체크
curl -sf https://jaripick.com/resident/ -o /dev/null && echo OK
curl -sf https://jaripick.com/api/public/config | head -1
curl -sf 'https://jaripick.com/api/apartments/search?q=오금' | head -c 200
```
