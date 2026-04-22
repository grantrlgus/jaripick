// Admin console pages. Copies layout/content from jaripick-admin/src/pages/*.tsx

function Sidebar({ active, go }) {
  const NAV = [
    { k: 'dashboard',  label: '📊  대시보드' },
    { k: 'layout',     label: '🗺️  구역 설정' },
    { k: 'spots',      label: '🅿️  구역 목록' },
    { k: 'residents',  label: '👥  입주민 승인' },
    { k: 'auctions',   label: '🔨  입찰 라운드' },
    { k: 'roundwiz',   label: '🪄  라운드 마법사' },
    { k: 'payments',   label: '💳  정산 관리' },
    { k: 'announce',   label: '📢  공지 발송' },
    { k: 'complaints', label: '💬  민원 / 문의' },
    { k: 'adminusers', label: '🔑  관리자 / 권한' },
    { k: 'setup',      label: '🚀  초기 셋업' },
    { k: 'complex',    label: '⚙️  단지 설정' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">자리픽 관리자</div>
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <a key={n.k} className={active === n.k ? 'active' : ''} onClick={() => go(n.k)}>{n.label}</a>
        ))}
      </nav>
      <div className="sidebar-foot">오금현대<br/>김관리 · admin</div>
    </aside>
  );
}

function Topbar({ title, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="row" style={{ gap: 12 }}>
        <span className="muted">오금현대</span>
        <button className="btn btn-ghost" onClick={onLogout}>로그아웃</button>
      </div>
    </header>
  );
}

// ─── Login page ─────────────────────────────────────────────────
function AdminLogin({ go }) {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">자리픽</div>
        <div className="login-sub">관리자 콘솔에 로그인하세요</div>
        <div className="stack">
          <div>
            <label className="label">아이디</label>
            <input className="input" defaultValue="admin@heliocity" />
          </div>
          <div>
            <label className="label">비밀번호</label>
            <input className="input" type="password" defaultValue="••••••••" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: 14 }} onClick={() => go('dashboard')}>로그인</button>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--n400)', marginTop: 8 }}>
            관리자 계정은 본사에서 발급됩니다
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────
function Dashboard({ go }) {
  const stats = [
    { l: '공식 주차대수', v: '1,350', sub: '공공데이터', highlight: false },
    { l: '입찰 가능 대수', v: 18, sub: '관리자 지정', highlight: false },
    { l: '승인 대기 입주민', v: 3, sub: '자동승인 실패', highlight: true },
    { l: '진행 중 라운드', v: 1, sub: 'D-3 마감' },
  ];
  const links = [
    { k: 'spots', t: '🅿️ 구역 목록', d: '입찰 대상/제외 구역을 번호로 지정.' },
    { k: 'residents', t: '👥 입주민 승인', d: '3명이 수동 승인을 기다리고 있어요.' },
    { k: 'auctions', t: '🔨 입찰 라운드 관리', d: '새 라운드 시작, 결과 확정.' },
  ];
  return (
    <div>
      <h1 className="title">오금현대</h1>
      <p className="subtitle">서울특별시 송파구 오금로 223</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.l} className="card" style={{ borderLeft: s.highlight ? '3px solid var(--warning)' : undefined }}>
            <div className="muted" style={{ fontSize: 12 }}>{s.l}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{s.v}</div>
            {s.sub && <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {links.map(l => (
          <div key={l.k} className="card" style={{ cursor: 'pointer' }} onClick={() => go(l.k)}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{l.t}</div>
            <div className="muted">{l.d}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>최근 활동</div>
          <div className="stack" style={{ gap: 8 }}>
            {[
              { t: '김철수 님이 A-23 구역에 입찰했어요 (180,000원)', a: '10분 전', i: '🔨' },
              { t: '이영희 님이 자동 승인되었어요 (명단 일치)', a: '30분 전', i: '✅' },
              { t: '박지민 님 수동 승인 필요 (명단 미일치)', a: '1시간 전', i: '⚠️' },
              { t: '2026년 5월 라운드가 시작됐어요 (계약 5/1~7/31)', a: '오늘 09:00', i: '📢' },
              { t: 'B-07 구역이 확정됐어요 (관리비 합산 120,000원)', a: '어제', i: '🎉' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderTop: i === 0 ? 0 : '1px solid var(--n100)',
              }}>
                <div style={{ fontSize: 18 }}>{r.i}</div>
                <div style={{ flex: 1, fontSize: 13 }}>{r.t}</div>
                <div className="muted" style={{ fontSize: 11 }}>{r.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Spots list ─────────────────────────────────────────────────
function SpotsPage() {
  const [filter, setFilter] = React.useState('all');
  const rows = [
    { n: 'A-23', kind: 'general',  avail: true,  bid: { count: 3, top: 180000 } },
    { n: 'A-24', kind: 'general',  avail: false, bid: null },
    { n: 'A-25', kind: 'ev',       avail: false, bid: null },
    { n: 'A-26', kind: 'disabled', avail: false, bid: null },
    { n: 'B-07', kind: 'general',  avail: true,  bid: { count: 1, top: 120000 } },
    { n: 'B-08', kind: 'general',  avail: true,  bid: null },
    { n: 'B-09', kind: 'general',  avail: true,  bid: { count: 2, top: 140000 } },
    { n: 'B-10', kind: 'visitor',  avail: false, bid: null },
    { n: 'C-03', kind: 'general',  avail: true,  bid: { count: 5, top: 200000 } },
    { n: 'C-04', kind: 'general',  avail: false, bid: null },
    { n: 'D-01', kind: 'general',  avail: true,  bid: null },
  ];
  const kindMeta = {
    general:  { label: '입찰 대상', cls: 'badge-success' },
    ev:       { label: '⚡ 전기차 전용', cls: 'badge-neutral' },
    disabled: { label: '♿ 장애인 전용',   cls: 'badge-neutral' },
    visitor:  { label: '🚗 방문객 전용',   cls: 'badge-neutral' },
  };
  const filtered = filter === 'all' ? rows
    : filter === 'bid' ? rows.filter(r => r.kind === 'general')
    : rows.filter(r => r.kind !== 'general');
  const bidCount = rows.filter(r => r.kind === 'general').length;
  const excludedCount = rows.length - bidCount;
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 2 }}>구역 목록</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>입찰 대상 {bidCount}칸 · 제외 {excludedCount}칸 (전기차/장애인/방문객)</p>
        </div>
        <div className="row">
          <input className="input" placeholder="🔍 구역 번호 검색" style={{ width: 220 }} />
          <button className="btn btn-outline">CSV로 내보내기</button>
          <button className="btn btn-primary">+ 구역 추가</button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className={filter === 'all' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setFilter('all')}>전체 {rows.length}</button>
        <button className={filter === 'bid' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setFilter('bid')}>입찰 대상 {bidCount}</button>
        <button className={filter === 'excluded' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setFilter('excluded')}>제외 {excludedCount}</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>번호</th>
              <th>유형</th>
              <th>상태</th>
              <th>입찰</th>
              <th>최고가</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const meta = kindMeta[r.kind];
              const isBid = r.kind === 'general';
              return (
                <tr key={r.n} style={{ opacity: isBid ? 1 : 0.6 }}>
                  <td style={{ fontWeight: 700 }}>{r.n}</td>
                  <td><span className={`badge ${meta.cls}`}>{meta.label}</span></td>
                  <td>
                    {!isBid ? <span className="muted">—</span>
                      : r.avail ? <span className="badge badge-success">가능</span>
                      : <span className="badge badge-neutral">마감</span>}
                  </td>
                  <td>{r.bid ? `${r.bid.count}명` : <span className="muted">—</span>}</td>
                  <td style={{ fontWeight: 600, color: r.bid ? 'var(--primary)' : 'var(--n400)' }}>
                    {r.bid ? `${r.bid.top.toLocaleString()}원` : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ height: 28, fontSize: 12, padding: '0 10px' }}>편집</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 12, background: 'var(--n50)', fontSize: 13, color: 'var(--n700)' }}>
        💡 전기차 충전소, 장애인 전용, 방문객 구역은 입찰 대상에서 자동 제외됩니다. 각 구역의 <b>편집</b>에서 유형을 지정하세요.
      </div>
    </div>
  );
}

// ─── Residents approval ─────────────────────────────────────────
function ResidentsPage() {
  const pending = [
    { name: '박지민', dong: '102', ho: '1503', car: '56다 9012', at: '2026-04-19 22:07', reason: '명단에 없는 호수' },
    { name: '장현진', dong: '103', ho: '0805', car: '77바 1234', at: '2026-04-19 18:22', reason: '명단 실명 불일치' },
    { name: '친서준', dong: '105', ho: '1102', car: '88사 5678', at: '2026-04-19 14:40', reason: '명단 미등록 동·호' },
  ];
  const approved = [
    { name: '김철수', dong: '101', ho: '1201', car: '12가 3456', at: '2026-04-20', auto: true },
    { name: '이영희', dong: '103', ho: '0902', car: '34나 5678', at: '2026-04-20', auto: true },
    { name: '정수민', dong: '101', ho: '0802', car: '78라 3456', at: '2026-04-15', auto: false },
    { name: '조현우', dong: '104', ho: '2101', car: '90마 7890', at: '2026-04-12', auto: true },
  ];
  return (
    <div>
      <h1 className="title">입주민 승인</h1>
      <p className="subtitle">카카오 실명 + 명단 매칭이 일치하면 자동 승인, 이외에만 수동 검토합니다.</p>

      <div className="card" style={{ marginBottom: 16, background: 'var(--primary-light)', padding: 14 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>⚙️ 자동 승인 규칙</div>
            <div className="muted" style={{ marginTop: 4, fontSize: 13, color: 'var(--n700)' }}>
              카카오 로그인 → 실명 / 동 / 호수가 업로드된 <b>입주민 명단</b>과 일치하면 즉시 승인됩니다.<br/>
              불일치/미등록/보안 이상 건만 수동 큐에 쌓입니다.
            </div>
          </div>
          <div className="row">
            <button className="btn btn-outline">명단 다운로드</button>
            <button className="btn btn-primary">+ 명단 업로드</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>수동 승인 큐</div>
          <span className="badge badge-warn">{pending.length}</span>
          <span className="muted" style={{ fontSize: 12 }}>— 명단 매칭 실패 건</span>
        </div>
        <table className="table">
          <thead>
            <tr><th>이름</th><th>동/호</th><th>차량 번호</th><th>이유</th><th>요청 시각</th><th style={{ width: 200 }}></th></tr>
          </thead>
          <tbody>
            {pending.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.dong}동 {p.ho}호</td>
                <td>{p.car}</td>
                <td><span className="badge badge-warn">{p.reason}</span></td>
                <td><span className="muted">{p.at}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                    <button className="btn btn-outline" style={{ height: 28, fontSize: 12, padding: '0 10px' }}>거절</button>
                    <button className="btn btn-primary" style={{ height: 28, fontSize: 12, padding: '0 10px' }}>승인</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>승인된 입주민 <span className="muted" style={{ fontWeight: 400, marginLeft: 4 }}>({approved.length})</span></div>
        </div>
        <table className="table">
          <thead>
            <tr><th>이름</th><th>동/호</th><th>차량 번호</th><th>승인일</th><th>상태</th></tr>
          </thead>
          <tbody>
            {approved.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.dong}동 {p.ho}호</td>
                <td>{p.car}</td>
                <td><span className="muted">{p.at}</span></td>
                <td><span className="badge badge-success">승인됨</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Auctions page ──────────────────────────────────────────────
function AuctionsPage() {
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 2 }}>입찰 라운드</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>현재 진행 중인 라운드를 관리합니다.</p>
        </div>
        <button className="btn btn-primary">+ 새 라운드 시작</button>
      </div>

      <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--primary)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>2026년 5월 라운드</div>
              <span className="badge badge-success">진행 중</span>
            </div>
            <div className="muted" style={{ marginTop: 4 }}>2026-04-15 09:00 ~ 2026-04-22 18:00 · 3개월 계약</div>
          </div>
          <div className="row">
            <button className="btn btn-outline">마감</button>
            <button className="btn btn-primary">확정 실행</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
          {[
            { l: '대상 구역', v: '18칸' },
            { l: '참여자', v: '48명' },
            { l: '총 입찰', v: '73건' },
            { l: '남은 시간', v: 'D-3' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 12, background: 'var(--n50)', borderRadius: 8 }}>
              <div className="muted" style={{ fontSize: 11 }}>{s.l}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>실시간 입찰 현황</div>
          <span className="badge badge-success">2026년 5월 라운드</span>
          <div className="grow" />
          <input className="input" placeholder="🔍 구역 번호" style={{ width: 180, height: 32, fontSize: 12 }} />
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>구역</th>
              <th>현재 최고가</th>
              <th>참여자</th>
              <th>최종 입찰</th>
              <th>최고가 입주민</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {[
              { n: 'C-03', top: 200000, bidders: 5, last: '3분 전', who: '박지민 · 105동 1503호', hot: true },
              { n: 'A-23', top: 180000, bidders: 3, last: '12분 전', who: '김철수 · 101동 1201호', hot: true },
              { n: 'B-09', top: 140000, bidders: 2, last: '28분 전', who: '최민석 · 102동 0804호' },
              { n: 'B-07', top: 120000, bidders: 1, last: '2시간 전', who: '이영희 · 103동 0902호' },
              { n: 'A-21', top: 100000, bidders: 1, last: '4시간 전', who: '정수민 · 101동 0802호' },
              { n: 'D-01', top: null,   bidders: 0, last: '—',       who: '—', empty: true },
              { n: 'D-02', top: null,   bidders: 0, last: '—',       who: '—', empty: true },
              { n: 'C-11', top: null,   bidders: 0, last: '—',       who: '—', empty: true },
            ].map(r => (
              <tr key={r.n} style={{ opacity: r.empty ? 0.55 : 1 }}>
                <td style={{ fontWeight: 700 }}>
                  {r.n} {r.hot && <span className="badge badge-warn" style={{ marginLeft: 6 }}>🔥 경쟁</span>}
                </td>
                <td style={{ fontWeight: 700, color: r.top ? 'var(--primary)' : 'var(--n400)' }}>
                  {r.top ? r.top.toLocaleString() + '원' : '입찰 없음'}
                </td>
                <td>{r.bidders > 0 ? `${r.bidders}명` : <span className="muted">—</span>}</td>
                <td className="muted" style={{ fontSize: 12 }}>{r.last}</td>
                <td style={{ fontSize: 13 }}>{r.empty ? <span className="muted">—</span> : r.who}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ height: 28, fontSize: 12, padding: '0 10px' }}>내역</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', background: 'var(--n50)', borderTop: '1px solid var(--n100)', fontSize: 12, color: 'var(--n500)' }}>
          💡 입찰이 들어올 때마다 표가 업데이트됩니다. 최고가 초과만 입찰 가능 — 동점은 발생하지 않아요.
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', fontSize: 14, fontWeight: 700 }}>지난 라운드</div>
        <table className="table">
          <thead>
            <tr><th>이름</th><th>기간</th><th>대상</th><th>확정</th><th>상태</th></tr>
          </thead>
          <tbody>
            <tr><td style={{ fontWeight: 600 }}>2026년 2월 라운드</td><td className="muted">2026-01-15 ~ 01-22</td><td>18칸</td><td>15 / 18</td><td><span className="badge badge-neutral">완료</span></td></tr>
            <tr><td style={{ fontWeight: 600 }}>2025년 11월 라운드</td><td className="muted">2025-10-15 ~ 10-22</td><td>18칸</td><td>16 / 18</td><td><span className="badge badge-neutral">완료</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Complex settings ───────────────────────────────────────────
function ComplexPage() {
  return (
    <div>
      <h1 className="title">단지 설정</h1>
      <p className="subtitle">단지 기본 정보와 입찰 규칙을 설정합니다.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>기본 정보</div>
          <div className="stack">
            <div><label className="label">단지명</label><input className="input" defaultValue="오금현대" /></div>
            <div><label className="label">주소</label><input className="input" defaultValue="서울특별시 송파구 오금로 223" /></div>
            <div><label className="label">총 세대</label><input className="input" defaultValue="1,124세대" /></div>
            <div style={{ background: 'var(--primary-light)', padding: 12, borderRadius: 8 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>🏢 K-apt 공공데이터 연동됨</div>
                <button className="btn btn-outline" style={{ height: 28, fontSize: 12, padding: '0 10px' }}>재동기화</button>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>마지막 업데이트: 2026-04-18</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>주차 대수</div>
          <div className="stack">
            <div>
              <label className="label">공식 주차대수 <span className="muted" style={{ fontWeight: 400 }}>(공공데이터 · 읽기 전용)</span></label>
              <input className="input" defaultValue="1,350" readOnly style={{ background: 'var(--n50)' }} />
            </div>
            <div>
              <label className="label">입찰 가능 대수 <span className="muted" style={{ fontWeight: 400 }}>(관리자 지정)</span></label>
              <input className="input" defaultValue="18" />
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>전기차 · 장애인 · 방문객 구역을 제외한 수치입니다.</div>
            </div>
            <div style={{ background: 'var(--n50)', padding: 10, borderRadius: 6, fontSize: 12 }} className="muted">
              1,350 공식 − 1,320 고정 배정 − 12 제외 = <b style={{ color: 'var(--n900)' }}>18칸 입찰 가능</b>
            </div>
          </div>
        </div>
        <div className="card" style={{ gridColumn: '1 / 3' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>입찰 규칙</div>
          <div className="stack">
            <div className="row">
              <div className="grow"><label className="label">계약 기간</label><select className="input"><option>3개월</option><option>6개월</option><option>12개월</option></select></div>
              <div className="grow"><label className="label">최소 입찰가</label><input className="input" defaultValue="50,000원" /></div>
              <div className="grow"><label className="label">입찰 규칙</label>
                <input className="input" value="최고가 초과만 가능 (동점 방지)" readOnly style={{ background: 'var(--n50)' }} />
              </div>
            </div>
            <div>
              <label className="label">결제 방식</label>
              <div style={{ background: 'var(--n50)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                <b>관리비 합산</b> · 1개월 초과 계약은 <b>개월별 분할</b>로 관리비에 자동 포함됩니다.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-ghost">취소</button>
        <button className="btn btn-primary">저장</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  Sidebar, Topbar, AdminLogin, Dashboard, SpotsPage, ResidentsPage, AuctionsPage, ComplexPage,
});
