# 자리픽 QA 시나리오

> 입주민 앱(`/resident`) + 관리자 웹(`/admin`) 전체 동작을 검증하기 위한 체크리스트.
> E2E 순서대로 진행하면 **관리자 세팅 → 입주민 가입 → 입찰 → 낙찰 확정 → 정산**까지 한 바퀴가 돕니다.

---

## 0. 사전 준비

- [ ] Supabase 마이그레이션 모두 적용
  - `supabase/schema.sql`, `supabase/add_demo_tables.sql`
  - `supabase/add_active_households.sql` (households + parking_cells.active)
  - `supabase/add_cell_photo.sql` (parking_cells.photo_url + storage 버킷)
- [ ] `.env.local` 에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 설정
- [ ] `npm run dev` 기동, 콘솔 에러 없음 확인

---

## A. 관리자 웹 (`/admin`)

### A1. 대시보드 (`dashboard`)

- [ ] 총 구역 수, 입찰 가능 대수, 승인 대기, 진행 중 라운드 카드 숫자 표시
- [ ] 승인 대기 > 0 일 때 주황색 하이라이트
- [ ] 진행 중 라운드 D-day 정확 (`bid_end` 기준)
- [ ] 빠른 링크 클릭 시 해당 페이지로 이동

### A2. 구역 설정 — 레이아웃 에디터 (`layout`)

- [ ] 네이버 지도 로드 성공 (마커 + 단지 경계)
- [ ] 클릭으로 새 셀 추가 → `n`, `row`, `type` 입력
- [ ] 기존 셀 드래그 이동 → 좌표 갱신
- [ ] 회전(`rot`) 슬라이더 동작
- [ ] **저장**: `PUT /api/cells` 200, 새로고침 후 유지
- [ ] 비활성 토글(`active=false`): 입주민 지도에서 "입찰 없음" 상태로만 표시
- [ ] **사진 업로드**: 셀 선택 → 업로드 → `POST /api/cells/{id}/photo` 200, 썸네일 표시
- [ ] 사진 삭제 → `DELETE /api/cells/{id}/photo` 200

### A3. 구역 목록 (`spots`)

- [ ] 모든 셀이 테이블로 표시 (n, row, type, active, 사진 여부)
- [ ] 타입 변경 (general/disabled/ev) 저장
- [ ] 활성/비활성 토글 반영

### A4. 입주민 (`residents`)

**명단 탭:**
- [ ] 명단 GET (`GET /api/households?complex=heliocity`) 성공
- [ ] 단건 추가: 동/호/이름/연락처 입력 → `POST /api/households` 200, 테이블에 즉시 추가
- [ ] CSV 일괄 업로드: 템플릿 다운로드 → 편집 → 업로드 → `PUT /api/households` 200, 기존 명단 교체
- [ ] 동·호 중복 시 UNIQUE 제약 에러 메시지 표시
- [ ] 삭제: 행의 × 버튼 → `DELETE /api/households?id=...` 200

**가입 요청 탭:**
- [ ] pending 건수 뱃지 표시
- [ ] "명단에 없는 동·호" reason 표기
- [ ] 승인: `PATCH /api/residents/requests?id=...` `{status:'approved'}` 200 → 입주민 앱에서 홈 접근 가능
- [ ] 거절: `{status:'rejected'}` 200 → 앱에서 PendingScreen에 거절 메시지

### A5. 입찰 라운드 (`auctions`)

- [ ] 진행 중/마감/확정 탭 전환
- [ ] 새 라운드 생성(`RoundWizardPage`): 이름, 입찰 기간, 계약 기간 입력 → `POST /api/rounds` 200
- [ ] **날짜 검증**: `bid_end < bid_start` 막기, `contract_end < contract_start` 막기 *(TODO)*
- [ ] Live 라운드 상세: 셀별 최고가 + 참여자 수 + 모든 입찰 리스트
- [ ] 마감 버튼: `PATCH {status:'closed'}` 200
- [ ] 확정 버튼: `PATCH {status:'finalized'}` 200 (되돌림 불가 확인 다이얼로그)
- [ ] 확정 후 입주민 앱에서 "내 구역" 권리증 노출

### A6. 정산 관리 (`payments`)

- [ ] finalized 라운드의 낙찰자 목록 표시
- [ ] 월별 분납 계산(`contract_start` ~ `contract_end`)
- [ ] 납부 상태(paid/due/upcoming) 현재 날짜 기준 정확

### A7. 공지 발송 (`announce`)

- [ ] 수신자 수 미리보기 (approved 입주민 수)
- [ ] 제목/본문 입력 → `POST /api/notices` 200
- [ ] 과거 공지 내역 리스트 최신순

### A8. 민원/문의 (`complaints`)

- [ ] 목록 표시 *(현재 더미 또는 미구현 확인)*

### A9. 관리자/권한 (`adminusers`)

- [ ] 관리자 목록 표시 *(현재 더미 또는 미구현 확인)*

### A10. 단지 설정 (`complex`)

- [ ] 단지명, 주소, 총 세대수, 최소 입찰가 로드
- [ ] 저장: `PUT /api/complex` 200, 새로고침 유지

---

## B. 입주민 앱 (`/resident`)

### B1. 온보딩

- [ ] **Splash**: 로딩 후 Login 이동
- [ ] **Login**: 카카오 버튼(데모) → ComplexRegister 이동
- [ ] **ComplexRegister**: 단지 검색 → 선택 → `jp_complex_name`, `jp_request_id` 저장
- [ ] **PhoneAuth**: 전화번호/인증번호 (데모 통과)
- [ ] **Vehicle**: 차량번호 입력 → `jp_plate` 저장
- [ ] 명단 매치 성공 시: 자동 승인 → Home 진입
- [ ] 명단 불일치: Pending 화면 → 관리자 승인 대기

### B2. 홈 (`home`)

- [ ] 헤더: `jp_complex_name`, `jp_dong` `jp_ho` 표시
- [ ] 진행 중 라운드 배너: D-day 정확 + 클릭 시 구역 목록
- [ ] **핫 스팟** 섹션: 최고가 top5 셀 (`count` 명수 정확)
- [ ] 내 신청 현황: 각 셀별 최신 입찰 금액, "1위"/"순위 밖" 태그
- [ ] 확정 구역 있으면 "확정된 구역이 있어요" 카드 → cert 이동
- [ ] 10초 폴링 정상

### B3. 구역 목록 / 지도 (`list`)

- [ ] 지도 로드, 마커 3색 상태
  - 흰색/회색: `open` (입찰 없음 또는 비활성)
  - 주황: `bidding` (1위 아님)
  - 파랑: `leading` (내가 1위)
- [ ] 마커 클릭 시 하단 시트: 구역명(관리자 설정한 `c.n` 그대로), 최고가, 참여자 수
- [ ] "입찰 없음 / 0명" 빈 상태
- [ ] "자세히 보기" → detail, "입찰하기" → bid

### B4. 구역 상세 (`detail`)

- [ ] 구역명 = `c.n` (접두어 중복 없음, 예: "A-01")
- [ ] 최고가 / 참여자 수 / D-day 실데이터
- [ ] 셀 사진 표시 (없으면 플레이스홀더)
- [ ] 내가 1위면 "1위 카드" 표시, 아니면 숨김
- [ ] "입찰하기" → bid

### B5. 입찰 (`bid`)

- [ ] 현재 최고가 + 참여자 수 실시간
- [ ] 시작 금액 = 최고가 + 10,000
- [ ] +1만 / +5만 / +10만 퀵 버튼
- [ ] 최고가 이하 입력 시 `isTooLow` 빨간 밑줄 + 메시지
- [ ] **입찰 윈도우 체크**: `bid_start` 전 POST → "아직 입찰이 시작되지 않았어요"
- [ ] `bid_end` 후 POST → "입찰이 마감되었어요"
- [ ] round.status !== 'live' → "라운드가 마감되었거나 종료되었어요"
- [ ] **세대당 한 구역**: 다른 구역에 입찰 중 상태로 신규 입찰
  - 409 응답 + confirm 다이얼로그 "이미 X 구역에 입찰 중이에요…"
  - 승인 → 기존 입찰 삭제 + 신규 입찰 성공
  - 취소 → 아무 변화 없음
- [ ] 최고가보다 낮거나 같은 금액 POST → 400 "현재 최고가 N원보다 높은 금액…"
- [ ] 성공 → BidComplete

### B6. 내 신청 (`bids`)

- [ ] 모든 라운드에서 내 입찰 리스트
- [ ] 상태 태그: leading(1위) / outbid(밀림) / confirmed(낙찰) / lost(탈락)
- [ ] 클릭 시 detail 이동
- [ ] 취소 버튼 (live 라운드만) → ReBidCancel 이동

### B7. 입찰 취소 (`rebidcancel`)

- [ ] 현재 내 입찰 금액 표시
- [ ] 취소 확인 → `DELETE /api/bids` 200
- [ ] 성공 후 내 신청 목록에서 사라짐
- [ ] 마감된 라운드면 "진행 중인 라운드만 취소할 수 있어요" 메시지

### B8. 내 구역 / 권리증 (`cert`)

- [ ] finalized 라운드에서 내가 1위인 셀 있으면 권리증 표시
  - 구역명, 낙찰가, 계약 기간, 세대주명, 차량번호
- [ ] 없으면 빈 상태 "확정된 구역이 없어요"

### B9. 알림 (`notifications`)

- [ ] request status 변경 (승인/거절) 알림 파생
- [ ] 라운드별 1위/순위밖/낙찰 알림 파생
- [ ] 최신순 정렬 + 상대시간(방금/N분전/N시간전)

### B10. 결제 (`payment`)

- [ ] 낙찰 구역의 월별 분납 스케줄
- [ ] 납부완료/납부예정/진행예정 상태
- [ ] 오늘 날짜 기준 정확

### B11. 설정 (`settings`)

- [ ] 프로필: 이름/동호/차량/단지 표시
- [ ] 로그아웃 → localStorage 초기화 → Login

### B12. FAQ / 에러 (`faq`, `error`)

- [ ] FAQ 목록 표시
- [ ] 에러 화면 - 홈 복귀

---

## C. 크로스-플로우 E2E (회귀 방지)

### C1. 해피 패스 전체

1. 관리자: 단지 설정 → 구역 레이아웃 3개 생성 → 명단에 황기현(211-801) 추가 → 라운드 생성(`bid_start` = 지금, `bid_end` = +7일)
2. 입주민: 가입 → 자동 승인 → 홈에서 라운드 배너 확인 → A-01에 60,000원 입찰
3. 관리자: 라운드 상세에서 해당 입찰 확인
4. 입주민: 다른 사람 계정(다른 동/호)으로 A-01에 70,000원 입찰 → 원래 유저 "순위 밖"
5. 원래 유저: 80,000원 재입찰 → 1위 복귀
6. 관리자: 라운드 마감 → 확정
7. 입주민: 권리증 표시 + 정산 페이지 월별 스케줄 확인

### C2. 입찰 제약 회귀

- [ ] `bid_start` 전 입찰 → 거부
- [ ] `bid_end` 후 입찰 → 거부
- [ ] 다른 구역 입찰 중 새 구역 입찰 → 확인 다이얼로그
- [ ] 최고가 이하 입찰 → 거부

### C3. 마이그레이션 안전성

- [ ] SQL 재실행 → 에러 없음 (모든 `IF NOT EXISTS` / `ON CONFLICT`)
- [ ] seed 데이터 중복 없음

---

## D. 알려진 이슈 / TODO

- 라운드 날짜 유효성 검증 서버 부재 (`bid_end < bid_start` 막기)
- 공지 삭제 API 없음 (UI에 삭제 버튼 있으면 404)
- 민원·관리자권한 페이지 실데이터 미연동
- 결제 페이지 납부 상태 변경 API 없음 (읽기 전용)
- `parking_cells` CREATE TABLE이 어느 마이그레이션에도 없음 (Dashboard에서 생성됐다고 가정)

---

*마지막 업데이트: 2026-04-22*
