// Admin console pages. Copies layout/content from jaripick-admin/src/pages/*.tsx

function Sidebar({ active, go }) {
  const NAV = [
    { k: 'dashboard',  label: '📊  대시보드' },
    { k: 'layout',     label: '🗺️  구역 설정' },
    { k: 'spots',      label: '🅿️  구역 목록' },
    { k: 'residents',  label: '👥  입주민' },
    { k: 'auctions',   label: '🔨  입찰 라운드' },
    { k: 'payments',   label: '💳  정산 관리' },
    { k: 'announce',   label: '📢  공지 발송' },
    { k: 'complaints', label: '💬  민원 / 문의' },
    { k: 'adminusers', label: '🔑  관리자 / 권한' },
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
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/dashboard?complex=heliocity', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(setData);
  }, []);

  const stats = [
    { l: '총 구역', v: data ? data.cells.total : '—', sub: '등록된 칸' },
    { l: '입찰 가능 대수', v: data ? data.cells.active_bid_cells : '—', sub: '활성·일반' },
    { l: '승인 대기 입주민', v: data ? data.residents.pending : '—', sub: '자동승인 실패', highlight: (data?.residents.pending || 0) > 0 },
    { l: '진행 중 라운드', v: data && data.live_round ? 1 : 0, sub: data && data.live_round ? `D-${data.live_round.days_left} 마감` : '없음' },
  ];
  const links = [
    { k: 'spots', t: '🅿️ 구역 목록', d: '입찰 대상/제외 구역을 번호로 지정.' },
    { k: 'residents', t: '👥 입주민', d: data && data.residents.pending > 0 ? `${data.residents.pending}명이 수동 승인을 기다리고 있어요.` : '가입 요청을 관리합니다.' },
    { k: 'auctions', t: '🔨 입찰 라운드 관리', d: '새 라운드 시작, 결과 확정.' },
  ];
  return (
    <div>
      <h1 className="title">{data?.complex?.name || '오금현대'}</h1>
      <p className="subtitle">{data?.complex?.address || '—'}</p>

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
function SpotsPage({ go }) {
  const [filter, setFilter] = React.useState('all');
  const [cells, setCells] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const refetch = React.useCallback(() => {
    setLoading(true);
    fetch('/api/cells', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCells(data); })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { refetch(); }, [refetch]);

  const toggleActive = async (id, next) => {
    setCells(cs => cs.map(c => c.id === id ? { ...c, active: next } : c));
    await fetch(`/api/cells/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: next }),
    });
  };

  const kindMeta = {
    general:  { label: '입찰 대상', cls: 'badge-success' },
    ev:       { label: '⚡ 전기차', cls: 'badge-neutral' },
    disabled: { label: '♿ 장애인', cls: 'badge-neutral' },
    visitor:  { label: '🚗 방문객', cls: 'badge-neutral' },
  };
  const rows = [...cells].sort((a, b) => a.n.localeCompare(b.n));
  const bidCount = rows.filter(r => (r.type || 'general') === 'general' && r.active !== false).length;
  const excludedCount = rows.length - bidCount;
  const filtered = filter === 'all' ? rows
    : filter === 'bid' ? rows.filter(r => (r.type || 'general') === 'general' && r.active !== false)
    : rows.filter(r => (r.type || 'general') !== 'general' || r.active === false);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 2 }}>구역 목록</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            활성 입찰 대상 {bidCount}칸 · 제외/비활성 {excludedCount}칸
          </p>
        </div>
        <div className="row">
          <button className="btn btn-outline" onClick={refetch}>🔄 새로고침</button>
          <button className="btn btn-primary" onClick={() => go && go('layout')}>+ 구역 편집</button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className={filter === 'all' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setFilter('all')}>전체 {rows.length}</button>
        <button className={filter === 'bid' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setFilter('bid')}>입찰 대상 {bidCount}</button>
        <button className={filter === 'excluded' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setFilter('excluded')}>제외/비활성 {excludedCount}</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>번호</th>
              <th>유형</th>
              <th>좌표</th>
              <th>사진</th>
              <th>활성화</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 20 }}>불러오는 중…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 20 }}>구역이 없어요. 구역 설정에서 추가하세요.</td></tr>
            ) : filtered.map(r => {
              const meta = kindMeta[r.type || 'general'] || kindMeta.general;
              const isActive = r.active !== false;
              return (
                <tr key={r.id} style={{ opacity: isActive ? 1 : 0.55 }}>
                  <td style={{ fontWeight: 700 }}>{r.n}</td>
                  <td><span className={`badge ${meta.cls}`}>{meta.label}</span></td>
                  <td className="muted" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                    {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                  </td>
                  <td>
                    {r.photo_url ? (
                      <img src={r.photo_url} alt="" style={{ width: 42, height: 30, objectFit: 'cover', borderRadius: 4 }} />
                    ) : <span className="muted">—</span>}
                  </td>
                  <td>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={isActive} onChange={e => toggleActive(r.id, e.target.checked)} />
                      <span style={{ fontSize: 12, color: isActive ? 'var(--success)' : 'var(--n400)' }}>
                        {isActive ? '활성' : '비활성'}
                      </span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 12, background: 'var(--n50)', fontSize: 13, color: 'var(--n700)' }}>
        💡 <b>활성화</b> 된 구역만 입주민 앱 지도/리스트에 노출됩니다. 비활성화하면 일시적으로 숨길 수 있어요.
      </div>
    </div>
  );
}

// ─── Residents (roster + approval) ──────────────────────────────
function ResidentsPage() {
  const [tab, setTab] = React.useState('roster');
  const [pending, setPending] = React.useState([]);
  const [approved, setApproved] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const refetch = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/residents/requests?status=pending', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      fetch('/api/residents/requests?status=approved', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
    ]).then(([p, a]) => {
      setPending(Array.isArray(p) ? p : []);
      setApproved(Array.isArray(a) ? a : []);
    }).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { refetch(); }, [refetch]);

  const decide = async (id, status) => {
    const res = await fetch(`/api/residents/requests?id=${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) refetch();
  };

  const fmtDate = (s) => s ? new Date(s).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div>
      <h1 className="title">입주민</h1>
      <p className="subtitle">사전 등록된 명단과 앱 가입 요청을 한 곳에서 관리합니다.</p>

      <div className="row" style={{ marginBottom: 16, gap: 4 }}>
        <button className={tab === 'roster' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('roster')}>
          📋 명단
        </button>
        <button className={tab === 'requests' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('requests')}>
          ✋ 가입 요청 <span className="badge badge-warn" style={{ marginLeft: 6 }}>{pending.length}</span>
        </button>
      </div>

      {tab === 'roster' && (
        <div className="card">
          <HouseholdSection />
        </div>
      )}

      {tab === 'requests' && (
        <>
          <div className="card" style={{ marginBottom: 16, background: 'var(--primary-light)', padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>⚙️ 자동 승인 규칙</div>
            <div className="muted" style={{ marginTop: 4, fontSize: 13, color: 'var(--n700)' }}>
              카카오 로그인 → 실명 / 동 / 호수가 <b>명단 탭</b>과 일치하면 즉시 승인됩니다.<br/>
              불일치 / 미등록 건만 아래 큐에 쌓입니다.
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
                {loading ? (
                  <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 16 }}>불러오는 중…</td></tr>
                ) : pending.length === 0 ? (
                  <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 16 }}>대기 중인 요청이 없어요.</td></tr>
                ) : pending.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.dong}동 {p.ho}호</td>
                    <td>{p.car_plate || '—'}</td>
                    <td><span className="badge badge-warn">{p.reason || '명단 불일치'}</span></td>
                    <td><span className="muted">{fmtDate(p.created_at)}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn btn-outline" onClick={() => decide(p.id, 'rejected')} style={{ height: 28, fontSize: 12, padding: '0 10px' }}>거절</button>
                        <button className="btn btn-primary" onClick={() => decide(p.id, 'approved')} style={{ height: 28, fontSize: 12, padding: '0 10px' }}>승인</button>
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
                {approved.length === 0 ? (
                  <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 16 }}>승인된 입주민이 없어요.</td></tr>
                ) : approved.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.dong}동 {p.ho}호</td>
                    <td>{p.car_plate || '—'}</td>
                    <td><span className="muted">{fmtDate(p.decided_at || p.created_at)}</span></td>
                    <td><span className="badge badge-success">{p.auto ? '자동 승인' : '수동 승인'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Auctions page (live + history + new round) ──────────────────
function AuctionsPage() {
  const [tab, setTab] = React.useState('live');
  const [selectedPast, setSelectedPast] = React.useState(null);
  const [roundName, setRoundName] = React.useState('2026년 5월 라운드');

  const [liveRound, setLiveRound] = React.useState(null);
  const [liveDetail, setLiveDetail] = React.useState(null);
  const [pastRounds, setPastRounds] = React.useState([]);
  const [pastDetail, setPastDetail] = React.useState(null);
  const [cells, setCells] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');

  // New round form state
  const [bidStartDate, setBidStartDate] = React.useState('2026-04-15');
  const [bidStartTime, setBidStartTime] = React.useState('09:00');
  const [bidEndDate, setBidEndDate] = React.useState('2026-04-22');
  const [bidEndTime, setBidEndTime] = React.useState('18:00');
  const [contractStart, setContractStart] = React.useState('2026-05-01');
  const [contractEnd, setContractEnd] = React.useState('2026-07-31');

  const refetchList = React.useCallback(() => {
    Promise.all([
      fetch('/api/rounds?status=live', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      fetch('/api/rounds?status=finalized', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      fetch('/api/rounds?status=closed', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      fetch('/api/cells', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
    ]).then(([live, finalized, closed, cs]) => {
      setLiveRound(Array.isArray(live) && live.length ? live[0] : null);
      const past = [...(finalized || []), ...(closed || [])].sort((a, b) =>
        (b.bid_end || '').localeCompare(a.bid_end || ''));
      setPastRounds(past);
      setCells(Array.isArray(cs) ? cs : (cs.cells || []));
    });
  }, []);

  React.useEffect(() => { refetchList(); }, [refetchList]);

  // Live round detail polling
  React.useEffect(() => {
    if (!liveRound) { setLiveDetail(null); return; }
    const load = () => fetch(`/api/rounds/${liveRound.id}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(setLiveDetail).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [liveRound]);

  // Past round detail
  React.useEffect(() => {
    if (!selectedPast) { setPastDetail(null); return; }
    fetch(`/api/rounds/${selectedPast.id}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(setPastDetail);
  }, [selectedPast]);

  const fmt = (n) => (n || 0).toLocaleString() + '원';

  const bidTargetCells = cells.filter(c => c.active !== false && c.type !== 'excluded');
  const activeCount = bidTargetCells.length;

  const createRound = async () => {
    setErr('');
    if (!roundName.trim()) { setErr('라운드 이름을 입력해주세요'); return; }
    setSaving(true);
    const bid_start = new Date(`${bidStartDate}T${bidStartTime}:00`).toISOString();
    const bid_end = new Date(`${bidEndDate}T${bidEndTime}:00`).toISOString();
    const res = await fetch('/api/rounds', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roundName.trim(),
        bid_start, bid_end,
        contract_start: contractStart,
        contract_end: contractEnd,
      }),
    });
    setSaving(false);
    if (!res.ok) { setErr((await res.json()).error || '생성 실패'); return; }
    refetchList();
    setTab('live');
  };

  const changeStatus = async (id, status) => {
    if (!confirm(status === 'closed' ? '라운드를 마감할까요?' : '낙찰을 확정할까요? (되돌릴 수 없음)')) return;
    const res = await fetch(`/api/rounds/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) refetchList();
  };

  // Build live rows: all bid-target cells (empty or with top bid) from liveDetail.per_cell
  const liveRows = React.useMemo(() => {
    if (!liveDetail) return [];
    const perCell = liveDetail.per_cell || {};
    return bidTargetCells.map(c => {
      const entry = perCell[c.id];
      return {
        cell_id: c.id,
        n: c.n,
        top: entry ? entry.top.amount : null,
        bidders: entry ? new Set(entry.all.map(b => `${b.dong}-${b.ho}`)).size : 0,
        last: entry ? entry.top.created_at : null,
        winner: entry ? entry.top : null,
        count: entry ? entry.count : 0,
      };
    }).sort((a, b) => (b.top || 0) - (a.top || 0) || a.n.localeCompare(b.n));
  }, [liveDetail, bidTargetCells]);

  const now = Date.now();
  const relTime = (iso) => {
    if (!iso) return '—';
    const diff = (now - new Date(iso).getTime()) / 1000;
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };
  const daysLeft = (end) => {
    if (!end) return '—';
    const d = Math.ceil((new Date(end).getTime() - now) / (1000 * 60 * 60 * 24));
    return d <= 0 ? '마감' : `D-${d}`;
  };
  const fmtDate = (iso) => iso ? iso.slice(0, 10) : '';

  return (
    <div>
      <h1 className="title">입찰 라운드</h1>
      <p className="subtitle">진행 중인 라운드 · 과거 이력 · 새 라운드 생성</p>

      <div className="row" style={{ marginBottom: 16, gap: 4 }}>
        <button className={tab === 'live' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('live')}>
          🔴 진행 중
        </button>
        <button className={tab === 'past' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => { setTab('past'); setSelectedPast(null); }}>
          📁 지난 라운드
        </button>
        <button className={tab === 'new' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('new')}>
          + 새 라운드
        </button>
      </div>

      {tab === 'live' && !liveRound && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>진행 중인 라운드가 없어요</div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>새 라운드를 시작해보세요.</div>
          <button className="btn btn-primary" onClick={() => setTab('new')}>+ 새 라운드</button>
        </div>
      )}

      {tab === 'live' && liveRound && (
        <>
          <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--primary)' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{liveRound.name}</div>
                  <span className="badge badge-success">진행 중</span>
                </div>
                <div className="muted" style={{ marginTop: 4 }}>
                  입찰 {fmtDate(liveRound.bid_start)} ~ {fmtDate(liveRound.bid_end)} · 계약 {liveRound.contract_start} ~ {liveRound.contract_end}
                </div>
              </div>
              <div className="row">
                <button className="btn btn-outline" onClick={() => changeStatus(liveRound.id, 'closed')}>마감</button>
                <button className="btn btn-primary" onClick={() => changeStatus(liveRound.id, 'finalized')}>확정 실행</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
              {[
                { l: '대상 구역', v: `${activeCount}칸` },
                { l: '참여자', v: `${liveDetail ? new Set((liveDetail.bids || []).map(b => `${b.dong}-${b.ho}`)).size : 0}명` },
                { l: '총 입찰', v: `${liveDetail ? (liveDetail.bids || []).length : 0}건` },
                { l: '남은 시간', v: daysLeft(liveRound.bid_end) },
              ].map((s, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--n50)', borderRadius: 8 }}>
                  <div className="muted" style={{ fontSize: 11 }}>{s.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>실시간 입찰 현황</div>
              <span className="badge badge-success">{liveRound.name}</span>
              <div className="grow" />
              <span className="muted" style={{ fontSize: 11 }}>5초마다 새로고침</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>구역</th><th>현재 최고가</th><th>참여자</th><th>최종 입찰</th><th>최고가 입주민</th>
                </tr>
              </thead>
              <tbody>
                {liveRows.length === 0 ? (
                  <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 16 }}>대상 구역이 없어요. 구역 설정에서 활성화하세요.</td></tr>
                ) : liveRows.map(r => (
                  <tr key={r.cell_id} style={{ opacity: r.top ? 1 : 0.55 }}>
                    <td style={{ fontWeight: 700 }}>
                      {r.n} {r.bidders >= 3 && <span className="badge badge-warn" style={{ marginLeft: 6 }}>🔥 경쟁</span>}
                    </td>
                    <td style={{ fontWeight: 700, color: r.top ? 'var(--primary)' : 'var(--n400)' }}>
                      {r.top ? r.top.toLocaleString() + '원' : '입찰 없음'}
                    </td>
                    <td>{r.bidders > 0 ? `${r.bidders}명` : <span className="muted">—</span>}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{relTime(r.last)}</td>
                    <td style={{ fontSize: 13 }}>{r.winner ? `${r.winner.name} · ${r.winner.dong}동 ${r.winner.ho}호` : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 16px', background: 'var(--n50)', borderTop: '1px solid var(--n100)', fontSize: 12, color: 'var(--n500)' }}>
              💡 입찰이 들어올 때마다 표가 업데이트됩니다. 최고가 초과만 입찰 가능 — 동점은 발생하지 않아요.
            </div>
          </div>
        </>
      )}

      {tab === 'past' && !selectedPast && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', fontSize: 14, fontWeight: 700 }}>
            지난 라운드 <span className="muted" style={{ fontWeight: 400, marginLeft: 4 }}>— 행을 클릭하면 낙찰 상세를 확인할 수 있어요</span>
          </div>
          <table className="table">
            <thead>
              <tr><th>이름</th><th>입찰 기간</th><th>계약 기간</th><th>상태</th><th></th></tr>
            </thead>
            <tbody>
              {pastRounds.length === 0 ? (
                <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 16 }}>지난 라운드가 없어요.</td></tr>
              ) : pastRounds.map(r => (
                <tr key={r.id} onClick={() => setSelectedPast(r)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td className="muted">{fmtDate(r.bid_start)} ~ {fmtDate(r.bid_end)}</td>
                  <td className="muted">{r.contract_start} ~ {r.contract_end}</td>
                  <td><span className={`badge ${r.status === 'finalized' ? 'badge-success' : 'badge-neutral'}`}>{r.status === 'finalized' ? '확정' : '마감'}</span></td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>상세 →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'past' && selectedPast && (() => {
        const perCell = pastDetail ? pastDetail.per_cell || {} : {};
        const cellRows = bidTargetCells.map(c => ({ cell: c, entry: perCell[c.id] }));
        const awarded = cellRows.filter(r => r.entry).length;
        const total = cellRows.length;
        const bidsArr = pastDetail ? (pastDetail.bids || []) : [];
        const avg = awarded > 0
          ? Math.round(cellRows.filter(r => r.entry).reduce((a, r) => a + r.entry.top.amount, 0) / awarded)
          : 0;
        return (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <button className="btn btn-ghost" onClick={() => setSelectedPast(null)}>← 목록으로</button>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedPast.name}</div>
              <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                입찰 {fmtDate(selectedPast.bid_start)} ~ {fmtDate(selectedPast.bid_end)} · 계약 {selectedPast.contract_start} ~ {selectedPast.contract_end}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                {[
                  { l: '대상 구역', v: `${total}칸` },
                  { l: '낙찰', v: `${awarded}칸` },
                  { l: '미낙찰', v: `${total - awarded}칸` },
                  { l: '평균 낙찰가', v: awarded > 0 ? fmt(avg) : '—' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--n50)', borderRadius: 8 }}>
                    <div className="muted" style={{ fontSize: 11 }}>{s.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', fontSize: 14, fontWeight: 700 }}>낙찰 상세</div>
              <table className="table">
                <thead>
                  <tr><th>구역</th><th>낙찰자</th><th>동/호</th><th>낙찰가</th><th>경쟁</th></tr>
                </thead>
                <tbody>
                  {!pastDetail ? (
                    <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 16 }}>불러오는 중…</td></tr>
                  ) : cellRows.map(({ cell, entry }) => (
                    <tr key={cell.id} style={{ opacity: entry ? 1 : 0.55 }}>
                      <td style={{ fontWeight: 700 }}>{cell.n}</td>
                      <td>{entry ? entry.top.name : <span className="muted">—</span>}</td>
                      <td className="muted">{entry ? `${entry.top.dong}동 ${entry.top.ho}호` : '—'}</td>
                      <td style={{ fontWeight: 600, color: entry ? 'var(--primary)' : 'var(--n400)' }}>{entry ? fmt(entry.top.amount) : '미낙찰'}</td>
                      <td className="muted">{entry ? `${new Set(entry.all.map(b => `${b.dong}-${b.ho}`)).size}명` : '0명'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      {tab === 'new' && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>새 라운드 생성</div>
          <div className="stack">
            <div><label className="label">라운드 이름</label><input className="input" value={roundName} onChange={e => setRoundName(e.target.value)} /></div>
            <div>
              <label className="label">입찰 기간</label>
              <div className="row">
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}>
                    <input type="date" className="input" value={bidStartDate} onChange={e => setBidStartDate(e.target.value)} style={{ flex: 2 }} />
                    <input type="time" className="input" value={bidStartTime} onChange={e => setBidStartTime(e.target.value)} style={{ flex: 1 }} />
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>시작</div>
                </div>
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}>
                    <input type="date" className="input" value={bidEndDate} onChange={e => setBidEndDate(e.target.value)} style={{ flex: 2 }} />
                    <input type="time" className="input" value={bidEndTime} onChange={e => setBidEndTime(e.target.value)} style={{ flex: 1 }} />
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>마감</div>
                </div>
              </div>
            </div>
            <div>
              <label className="label">계약 기간</label>
              <div className="row">
                <div className="grow">
                  <input type="date" className="input" value={contractStart} onChange={e => setContractStart(e.target.value)} />
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>시작</div>
                </div>
                <div className="grow">
                  <input type="date" className="input" value={contractEnd} onChange={e => setContractEnd(e.target.value)} />
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>종료</div>
                </div>
              </div>
            </div>
            <div>
              <label className="label">대상 구역</label>
              <div style={{ padding: '10px 12px', background: 'var(--n50)', borderRadius: 8, fontSize: 13 }}>
                <b>활성화된 주차 구역 전체</b>
                <span className="muted"> · {activeCount}칸</span>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  비활성화된 구역과 전기차·장애인·방문객 구역은 자동 제외됩니다.
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--n50)', padding: 12, borderRadius: 8, fontSize: 12 }} className="muted">
              💡 시작 시각이 되면 입주민 앱에 자동으로 알림이 발송됩니다.<br/>
              ⚖️ 최고가보다 <b style={{ color: 'var(--n900)' }}>높은 금액</b>만 입찰 가능 — 동점은 발생하지 않습니다.
            </div>
            {err && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</div>}
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setTab('live')} disabled={saving}>취소</button>
              <button className="btn btn-primary" onClick={createRound} disabled={saving}>{saving ? '생성 중…' : '생성하기'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Complex settings ───────────────────────────────────────────
function ComplexPage() {
  const [cfg, setCfg] = React.useState({ name: '', address: '', total_units: '', min_bid: 50000 });
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => {
    fetch('/api/complex?complex=heliocity', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : {})
      .then(d => setCfg(c => ({
        ...c,
        name: d.name || '',
        address: d.address || '',
        total_units: d.total_units || '',
        min_bid: d.min_bid || 50000,
      })));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    const res = await fetch('/api/complex', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complex: 'heliocity',
        name: cfg.name,
        address: cfg.address,
        total_units: cfg.total_units ? Number(cfg.total_units) : null,
        min_bid: Number(cfg.min_bid) || 0,
      }),
    });
    setSaving(false);
    setMsg(res.ok ? '저장되었습니다' : '저장 실패');
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div>
      <h1 className="title">단지 설정</h1>
      <p className="subtitle">단지 기본 정보와 입찰 규칙을 설정합니다.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>기본 정보</div>
          <div className="stack">
            <div><label className="label">단지명</label><input className="input" value={cfg.name} onChange={e => setCfg(c => ({ ...c, name: e.target.value }))} /></div>
            <div><label className="label">주소</label><input className="input" value={cfg.address} onChange={e => setCfg(c => ({ ...c, address: e.target.value }))} /></div>
            <div><label className="label">총 세대</label><input className="input" type="number" value={cfg.total_units} onChange={e => setCfg(c => ({ ...c, total_units: e.target.value }))} /></div>
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
              <div className="grow"><label className="label">최소 입찰가</label><input className="input" type="number" value={cfg.min_bid} onChange={e => setCfg(c => ({ ...c, min_bid: e.target.value }))} /></div>
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
            <div className="muted" style={{ fontSize: 12 }}>
              💡 계약 기간은 <b>입찰 라운드 &gt; 새 라운드</b>에서 라운드별로 달력으로 지정합니다.
            </div>
          </div>
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16, alignItems: 'center', gap: 12 }}>
        {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '저장 중…' : '저장'}</button>
      </div>
    </div>
  );
}

// ─── Household list section (inside 단지 설정) ──────────────────
function HouseholdSection() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ dong: '', ho: '', name: '', phone: '' });
  const fileRef = React.useRef(null);

  const refetch = React.useCallback(() => {
    setLoading(true);
    fetch('/api/households?complex=heliocity', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setRows(d); })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { refetch(); }, [refetch]);

  const addOne = async () => {
    if (!form.dong || !form.ho || !form.name) { setErr('동/호/이름 필수'); return; }
    setErr('');
    const res = await fetch('/api/households', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complex: 'heliocity', ...form }),
    });
    if (!res.ok) { setErr((await res.json()).error || '추가 실패'); return; }
    setForm({ dong: '', ho: '', name: '', phone: '' });
    setAdding(false);
    refetch();
  };

  const removeOne = async (id) => {
    if (!confirm('삭제하시겠어요?')) return;
    await fetch(`/api/households?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    refetch();
  };

  const parseCsv = (text) => {
    const lines = text.trim().split(/\r?\n/);
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(s => s.trim());
      if (i === 0 && /동/.test(parts[0])) continue; // skip header
      const [dong, ho, name, phone] = parts;
      if (dong && ho && name) out.push({ dong, ho, name, phone: phone || null });
    }
    return out;
  };

  const uploadCsv = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) { setErr('CSV에서 읽은 행이 없어요'); return; }
    if (!confirm(`${rows.length}건을 입주민 명단에 일괄 업로드할까요?\n(기존 명단은 교체됩니다)`)) return;
    const res = await fetch('/api/households', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complex: 'heliocity', rows }),
    });
    if (!res.ok) { setErr('업로드 실패'); return; }
    setErr('');
    refetch();
  };

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>입주민 명단</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            카카오 로그인 후 실명+동·호가 명단과 일치하면 자동 승인됩니다.
          </div>
        </div>
        <div className="row">
          <a className="btn btn-outline" href="/admin/household-template.csv" download>📄 양식 다운로드</a>
          <button className="btn btn-outline" onClick={() => fileRef.current && fileRef.current.click()}>📥 CSV 업로드</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={uploadCsv} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => setAdding(v => !v)}>+ 세대 추가</button>
        </div>
      </div>

      {adding && (
        <div className="row" style={{ marginBottom: 12, gap: 8 }}>
          <input className="input" placeholder="동" value={form.dong} onChange={e => setForm(f => ({ ...f, dong: e.target.value }))} style={{ width: 80 }} />
          <input className="input" placeholder="호" value={form.ho} onChange={e => setForm(f => ({ ...f, ho: e.target.value }))} style={{ width: 100 }} />
          <input className="input" placeholder="이름" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: 140 }} />
          <input className="input" placeholder="연락처 (선택)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ width: 180 }} />
          <button className="btn btn-primary" onClick={addOne}>저장</button>
          <button className="btn btn-ghost" onClick={() => { setAdding(false); setErr(''); }}>취소</button>
        </div>
      )}
      {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{err}</div>}

      <div style={{ border: '1px solid var(--n100)', borderRadius: 8, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr><th>동</th><th>호</th><th>이름</th><th>연락처</th><th>등록일</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 16 }}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 16 }}>명단이 비어있어요. CSV 업로드로 시작하세요.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td>{r.dong}</td>
                <td>{r.ho}</td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td className="muted">{r.phone || '—'}</td>
                <td className="muted" style={{ fontSize: 12 }}>{(r.created_at || '').slice(0, 10)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" onClick={() => removeOne(r.id)} style={{ height: 28, fontSize: 12, padding: '0 10px', color: 'var(--danger)' }}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
        총 {rows.length}세대 등록됨
      </div>
    </div>
  );
}

Object.assign(window, {
  Sidebar, Topbar, AdminLogin, Dashboard, SpotsPage, ResidentsPage, AuctionsPage, ComplexPage,
});
