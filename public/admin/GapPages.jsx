// Admin gap screens — AG1–AG6 filling wireframe gaps.
// Updated: date ranges, auto-approval policy, 관리비 합산 결제, 공공데이터 연동,
// 공지 템플릿, 민원 카테고리 분류, 정산 과거 데이터.

// Helpers
const fmt = (n) => n.toLocaleString() + '원';
const today = '2026-04-20';

// ─── AG2: Round Wizard ───────────────────────────────────────────
function RoundWizardPage({ go }) {
  const [phase, setPhase] = React.useState('create');
  const [bidStartDate, setBidStartDate] = React.useState('2026-04-15');
  const [bidStartTime, setBidStartTime] = React.useState('09:00');
  const [bidEndDate, setBidEndDate] = React.useState('2026-04-22');
  const [bidEndTime, setBidEndTime] = React.useState('18:00');
  const [contractStart, setContractStart] = React.useState('2026-05-01');
  const [contractEnd, setContractEnd] = React.useState('2026-07-31');
  const [activeCount, setActiveCount] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/cells').then(r => r.json()).then(d => {
      const cells = Array.isArray(d) ? d : (d.cells || []);
      const n = cells.filter(c => c.active !== false && c.type !== 'excluded').length;
      setActiveCount(n);
    }).catch(() => setActiveCount(0));
  }, []);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 2 }}>라운드 마법사</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>새 라운드 생성 · 마감 · 낙찰 확정까지.</p>
        </div>
        <div className="row">
          <button className={phase === 'create' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setPhase('create')}>① 생성</button>
          <button className={phase === 'confirm' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setPhase('confirm')}>② 마감</button>
          <button className={phase === 'finalize' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setPhase('finalize')}>③ 확정</button>
        </div>
      </div>

      {phase === 'create' && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>① 새 라운드 생성</div>
          <div className="stack">
            <div><label className="label">라운드 이름</label><input className="input" defaultValue="2026년 5월 라운드" /></div>
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
                {activeCount !== null && <span className="muted"> · {activeCount}칸</span>}
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  비활성화된 구역과 전기차·장애인·방문객 구역은 자동 제외됩니다.
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--n50)', padding: 12, borderRadius: 8, fontSize: 12 }} className="muted">
              💡 시작 시각이 되면 입주민 앱에 자동으로 알림이 발송됩니다.<br/>
              ⚖️ 최고가보다 <b style={{ color: 'var(--n900)' }}>높은 금액</b>만 입찰 가능 — 동점은 발생하지 않습니다.
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost">취소</button>
              <button className="btn btn-primary" onClick={() => setPhase('confirm')}>생성하기</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'confirm' && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>② 라운드 마감</div>
          <div className="muted" style={{ marginBottom: 16 }}>2026년 5월 라운드 · 계약 2026-05-01 ~ 2026-07-31 (3개월) · D-0</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { l: '참여자', v: '48명' },
              { l: '총 입찰', v: '73건' },
              { l: '구역 매칭', v: '15 / 18' },
              { l: '평균 낙찰가', v: '152,000원' },
            ].map((s, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--n50)', borderRadius: 8 }}>
                <div className="muted" style={{ fontSize: 11 }}>{s.l}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'var(--primary-light)', padding: 14, marginBottom: 12 }}>
            <b>마감 전 체크</b>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div>✓ 모든 입찰 데이터가 수집되었습니다</div>
              <div>✓ 모든 입찰이 최고가 초과 규칙으로 검증됨 (동점 없음)</div>
              <div>⚠️ 4건의 구역이 미매칭 — 재입찰 라운드 필요</div>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setPhase('create')}>뒤로</button>
            <button className="btn btn-primary" onClick={() => setPhase('finalize')}>마감하고 결과 보기 →</button>
          </div>
        </div>
      )}

      {phase === 'finalize' && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>③ 낙찰 확정</div>
          <div className="muted" style={{ marginBottom: 16 }}>결과를 검토하고 입주민에게 통보합니다.</div>
          <table className="table" style={{ marginBottom: 12 }}>
            <thead><tr><th>구역</th><th>낙찰자</th><th>금액</th><th>경쟁</th><th>상태</th></tr></thead>
            <tbody>
              {[
                { n: 'A-23', w: '김철수', a: fmt(180000), c: '3명', s: 'auto', t: '자동 확정' },
                { n: 'B-07', w: '이영희', a: fmt(120000), c: '1명', s: 'auto', t: '자동 확정' },
                { n: 'C-03', w: '박지민', a: fmt(200000), c: '5명', s: 'auto', t: '자동 확정' },
                { n: 'D-01', w: '—', a: '—', c: '0명', s: 'empty', t: '재입찰 필요' },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{r.n}</td>
                  <td>{r.w}</td>
                  <td style={{ fontWeight: 600 }}>{r.a}</td>
                  <td className="muted">{r.c}</td>
                  <td>
                    <span className={r.s === 'auto' ? 'badge badge-success' : r.s === 'tie' ? 'badge badge-warn' : 'badge badge-neutral'}>{r.t}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button className="btn btn-outline">CSV 내보내기</button>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setPhase('confirm')}>뒤로</button>
              <button className="btn btn-primary" onClick={() => go('dashboard')}>전체 확정 & 알림 발송</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AG3: Complaints ────────────────────────────────────────────
function ComplaintsPage() {
  const [cat, setCat] = React.useState('all');
  const rows = [
    { t: '2026-04-20 14:22', by: '김철수 (101동 1201호)', subj: 'A-23 옆 기둥 때문에 주차가 어려워요', s: 'new', c: 'complex' },
    { t: '2026-04-20 12:10', by: '이영희 (103동 0902호)', subj: '앱에서 입찰 버튼이 안 눌려요', s: 'new', c: 'platform' },
    { t: '2026-04-20 10:08', by: '박민수 (105동 0503호)', subj: '낙찰가가 너무 높은 것 같아요 · 환불 문의', s: 'progress', c: 'complex' },
    { t: '2026-04-19 21:30', by: '정수민 (101동 0802호)', subj: '결제 오류 · 관리비 이중 청구', s: 'progress', c: 'platform' },
    { t: '2026-04-18 16:45', by: '조현우 (104동 2101호)', subj: '입주민 승인 지연 문의', s: 'done', c: 'complex' },
    { t: '2026-04-17 09:12', by: '한예슬 (106동 0301호)', subj: '차량번호 변경 요청', s: 'done', c: 'complex' },
  ];
  const filtered = cat === 'all' ? rows : rows.filter(r => r.c === cat);
  const platform = rows.filter(r => r.c === 'platform' && r.s !== 'done');

  const badge = (s) => s === 'new' ? <span className="badge badge-warn">신규</span>
    : s === 'progress' ? <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>진행 중</span>
    : <span className="badge badge-neutral">완료</span>;
  const catBadge = (c) => c === 'platform'
    ? <span className="badge badge-danger">🔧 플랫폼</span>
    : <span className="badge badge-neutral">단지 운영</span>;

  return (
    <div>
      <h1 className="title">민원 / 문의</h1>
      <p className="subtitle">입주민 ↔ 관리자 1:1 문의 · 카테고리 자동 분류</p>

      {platform.length > 0 && (
        <div className="card" style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>🔧 플랫폼 이슈 {platform.length}건이 접수되었습니다</div>
              <div className="muted" style={{ marginTop: 4, fontSize: 13, color: '#991B1B' }}>앱 버그·결제 오류 등 자리픽 운영팀 확인이 필요한 건입니다.</div>
            </div>
            <button className="btn btn-danger" style={{ background: '#EF4444' }}>운영팀에 전달</button>
          </div>
        </div>
      )}

      <div className="row" style={{ marginBottom: 12 }}>
        <button className={cat === 'all' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setCat('all')}>전체 {rows.length}</button>
        <button className={cat === 'complex' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setCat('complex')}>단지 운영 {rows.filter(r => r.c === 'complex').length}</button>
        <button className={cat === 'platform' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setCat('platform')}>🔧 플랫폼 {rows.filter(r => r.c === 'platform').length}</button>
        <div className="grow"></div>
        <input className="input" placeholder="🔍 제목/작성자 검색" style={{ width: 260 }} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>일시</th><th>카테고리</th><th>작성자</th><th>제목</th><th>상태</th><th></th></tr></thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td className="muted">{r.t}</td>
                <td>{catBadge(r.c)}</td>
                <td>{r.by}</td>
                <td style={{ fontWeight: 600 }}>{r.subj}</td>
                <td>{badge(r.s)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ height: 28, fontSize: 12, padding: '0 10px' }}>답변</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AG4: Announce with templates ───────────────────────────────
const ANNOUNCE_TEMPLATES = [
  {
    id: 'round-open',
    name: '🚀 라운드 시작 안내',
    target: 'all',
    title: '{단지명} 주차 라운드가 시작됐어요',
    body: '안녕하세요, {단지명} 관리사무소입니다.\n\n{시작일} {시작시각}부터 새 주차 라운드가 시작됩니다.\n자리픽 앱에서 원하는 구역에 입찰해주세요.\n\n마감: {마감일} {마감시각}\n계약 기간: {계약기간}\n\n감사합니다.',
  },
  {
    id: 'round-close',
    name: '⏰ 마감 임박 리마인더',
    target: 'round',
    title: '입찰 마감이 {디데이} 남았어요',
    body: '이번 라운드 입찰 마감이 얼마 남지 않았습니다.\n아직 입찰하지 않으셨다면 지금 앱에서 확인해보세요.\n\n마감: {마감일} {마감시각}',
  },
  {
    id: 'round-result',
    name: '🎉 낙찰 결과 발표',
    target: 'round',
    title: '{라운드명} 결과가 발표됐어요',
    body: '입찰에 참여해주셔서 감사합니다.\n\n낙찰 결과는 자리픽 앱에서 확인해주세요.\n낙찰 금액은 {계약기간} 동안 관리비에 합산 청구됩니다.',
  },
  {
    id: 'winner',
    name: '🏆 낙찰자 환영',
    target: 'winners',
    title: '주차 구역 {구역번호} 낙찰을 축하드려요',
    body: '{구역번호} 구역이 배정되었습니다.\n계약 기간: {계약기간}\n\n관리비에 자동으로 합산되며, 1개월 초과 시 개월별로 분할 청구됩니다.\n앱에서 권리증을 확인해보세요.',
  },
  {
    id: 'notice',
    name: '📢 일반 공지',
    target: 'all',
    title: '',
    body: '안녕하세요, {단지명} 관리사무소입니다.\n\n',
  },
];

function AnnouncePage() {
  const [target, setTarget] = React.useState('all');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [tplId, setTplId] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [notices, setNotices] = React.useState([]);
  const [approvedCount, setApprovedCount] = React.useState(0);

  const refetch = React.useCallback(() => {
    fetch('/api/notices?complex=heliocity', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setNotices(Array.isArray(d) ? d : []));
    fetch('/api/residents/requests?status=approved', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setApprovedCount(Array.isArray(d) ? d.length : 0));
  }, []);
  React.useEffect(() => { refetch(); }, [refetch]);

  const applyTpl = (tpl) => {
    setTarget(tpl.target);
    setTitle(tpl.title);
    setBody(tpl.body);
    setTplId(tpl.id);
  };

  const send = async () => {
    if (!title.trim() || !body.trim()) { setMsg('제목과 본문을 입력해주세요'); return; }
    setSending(true); setMsg('');
    const res = await fetch('/api/notices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complex: 'heliocity', target, title, body }),
    });
    setSending(false);
    if (!res.ok) { setMsg((await res.json()).error || '발송 실패'); return; }
    setMsg('발송되었습니다');
    setTitle(''); setBody(''); setTplId(null);
    refetch();
    setTimeout(() => setMsg(''), 2500);
  };

  const relT = (iso) => {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
    return new Date(iso).toLocaleDateString('ko-KR');
  };

  return (
    <div>
      <h1 className="title">공지 · 푸시 발송</h1>
      <p className="subtitle">템플릿을 선택해 빠르게 작성하거나 직접 작성하세요.</p>

      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📑 템플릿 프리셋</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ANNOUNCE_TEMPLATES.map(tpl => (
            <button key={tpl.id} onClick={() => applyTpl(tpl)}
              className={tplId === tpl.id ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ height: 32, fontSize: 12 }}>{tpl.name}</button>
          ))}
        </div>
        <div className="muted" style={{ marginTop: 8, fontSize: 11 }}>
          💡 본문의 <code style={{ background: 'var(--n100)', padding: '0 4px', borderRadius: 3 }}>{'{변수명}'}</code>은 발송 시 실제 값으로 자동 치환됩니다.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>새 공지 작성</div>
          <div className="stack">
            <div>
              <label className="label">대상</label>
              <div className="row">
                {[
                  { k: 'all', l: '전체 입주민' },
                  { k: 'round', l: '라운드 참여자' },
                  { k: 'winners', l: '낙찰자만' },
                ].map(o => (
                  <button key={o.k} onClick={() => setTarget(o.k)} className={target === o.k ? 'btn btn-primary' : 'btn btn-outline'} style={{ flex: 1 }}>{o.l}</button>
                ))}
              </div>
            </div>
            <div><label className="label">제목</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요" /></div>
            <div>
              <label className="label">본문</label>
              <textarea className="input" style={{ height: 180, padding: 12, resize: 'vertical', fontFamily: 'inherit' }}
                value={body} onChange={e => setBody(e.target.value)} placeholder="본문을 입력하세요" />
            </div>
            <label className="row" style={{ fontSize: 13 }}>
              <input type="checkbox" defaultChecked /> 푸시 알림도 함께 발송
            </label>
            {msg && <div className="muted" style={{ fontSize: 12 }}>{msg}</div>}
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-primary" onClick={send} disabled={sending}>
                {sending ? '발송 중…' : `발송 (${approvedCount}명)`}
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', fontSize: 14, fontWeight: 700 }}>지난 공지</div>
          <div className="stack" style={{ gap: 0 }}>
            {notices.length === 0 ? (
              <div style={{ padding: 16 }} className="muted">아직 발송된 공지가 없어요.</div>
            ) : notices.map((r, i, arr) => (
              <div key={r.id} style={{ padding: '12px 16px', borderBottom: i === arr.length - 1 ? 0 : '1px solid var(--n100)' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                <div className="row" style={{ marginTop: 4 }}>
                  <span className="muted" style={{ flex: 1 }}>{relT(r.sent_at)} · {r.recipient_count || 0}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AG5: Payments / Settlement (past data + 관리비 합산) ─────────
function PaymentsPage() {
  const [round, setRound] = React.useState('2026-05');
  const ROUNDS = {
    '2026-05': {
      label: '2026년 5월 라운드',
      period: '2026-05-01 ~ 2026-07-31 (3개월)',
      rows: [
        { n: 'A-23', w: '김철수',  amt: 180000, months: 3, s: 'billed', note: '관리비 합산 · 3개월 분할' },
        { n: 'B-07', w: '이영희',  amt: 120000, months: 3, s: 'billed', note: '관리비 합산 · 3개월 분할' },
        { n: 'B-09', w: '최민석',  amt: 140000, months: 3, s: 'billed', note: '관리비 합산 · 3개월 분할' },
        { n: 'C-03', w: '박지민',  amt: 200000, months: 3, s: 'pending', note: '1회차 청구 대기' },
        { n: 'C-11', w: '한예슬',  amt: 160000, months: 3, s: 'pending', note: '1회차 청구 대기' },
      ],
    },
    '2026-02': {
      label: '2026년 2월 라운드',
      period: '2026-02-01 ~ 2026-04-30 (3개월)',
      rows: [
        { n: 'A-15', w: '김철수',  amt: 150000, months: 3, s: 'paid',    note: '3개월 전액 완납' },
        { n: 'A-22', w: '이영희',  amt: 130000, months: 3, s: 'paid',    note: '3개월 전액 완납' },
        { n: 'B-05', w: '박민수',  amt: 110000, months: 3, s: 'paid',    note: '3개월 전액 완납' },
        { n: 'C-08', w: '조현우',  amt: 180000, months: 3, s: 'overdue', note: '3회차 연체' },
        { n: 'D-02', w: '정수민',  amt: 100000, months: 3, s: 'paid',    note: '3개월 전액 완납' },
      ],
    },
    '2025-11': {
      label: '2025년 11월 라운드',
      period: '2025-11-01 ~ 2026-01-31 (3개월)',
      rows: [
        { n: 'A-10', w: '김철수',  amt: 140000, months: 3, s: 'paid', note: '3개월 전액 완납' },
        { n: 'B-03', w: '한예슬',  amt: 125000, months: 3, s: 'paid', note: '3개월 전액 완납' },
        { n: 'C-05', w: '최민석',  amt: 175000, months: 3, s: 'paid', note: '3개월 전액 완납' },
        { n: 'C-12', w: '박지민',  amt: 160000, months: 3, s: 'paid', note: '3개월 전액 완납' },
      ],
    },
    '2025-08': {
      label: '2025년 8월 라운드',
      period: '2025-08-01 ~ 2025-10-31 (3개월)',
      rows: [
        { n: 'A-08', w: '이영희',  amt: 135000, months: 3, s: 'paid', note: '3개월 전액 완납' },
        { n: 'B-11', w: '조현우',  amt: 145000, months: 3, s: 'paid', note: '3개월 전액 완납' },
        { n: 'D-05', w: '정수민',  amt: 105000, months: 3, s: 'paid', note: '3개월 전액 완납' },
      ],
    },
  };
  const data = ROUNDS[round];
  const rows = data.rows;
  const total = rows.reduce((a, r) => a + r.amt, 0);
  const collected = rows.filter(r => r.s === 'paid').reduce((a, r) => a + r.amt, 0);
  const billed = rows.filter(r => r.s === 'billed' || r.s === 'paid').reduce((a, r) => a + r.amt, 0);
  const overdueCnt = rows.filter(r => r.s === 'overdue').length;

  const badge = (s) => s === 'paid' ? <span className="badge badge-success">완납</span>
    : s === 'billed' ? <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>청구 중</span>
    : s === 'overdue' ? <span className="badge badge-danger">연체</span>
    : <span className="badge badge-warn">대기</span>;

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 2 }}>정산 관리</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>{data.label} · {data.period} · <b style={{ color: 'var(--primary)' }}>관리비 합산 청구</b></p>
        </div>
        <select className="input" value={round} onChange={e => setRound(e.target.value)} style={{ width: 220 }}>
          {Object.keys(ROUNDS).map(k => <option key={k} value={k}>{ROUNDS[k].label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card"><div className="muted" style={{ fontSize: 12 }}>총 청구액</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{fmt(total)}</div></div>
        <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}><div className="muted" style={{ fontSize: 12 }}>청구 진행</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: 'var(--primary)' }}>{fmt(billed)}</div></div>
        <div className="card" style={{ borderLeft: '3px solid var(--success)' }}><div className="muted" style={{ fontSize: 12 }}>수금 완료</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: 'var(--success)' }}>{fmt(collected)}</div></div>
        <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}><div className="muted" style={{ fontSize: 12 }}>연체</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: overdueCnt ? 'var(--danger)' : 'var(--n900)' }}>{overdueCnt}건</div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>청구 목록 · 관리비 합산</div>
          {overdueCnt > 0 && <button className="btn btn-outline">연체자 일괄 알림</button>}
          <button className="btn btn-outline">관리사무소 내보내기 (CSV)</button>
        </div>
        <table className="table">
          <thead><tr><th>구역</th><th>낙찰자</th><th>총 금액</th><th>분할</th><th>월별 금액</th><th>상태</th><th>비고</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700 }}>{r.n}</td>
                <td>{r.w}</td>
                <td style={{ fontWeight: 600 }}>{fmt(r.amt)}</td>
                <td>{r.months > 1 ? `${r.months}개월` : '일시'}</td>
                <td className="muted">{fmt(Math.round(r.amt / r.months))} / 월</td>
                <td>{badge(r.s)}</td>
                <td className="muted" style={{ fontSize: 12 }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16, background: 'var(--n50)', fontSize: 13, color: 'var(--n700)' }}>
        💡 자리픽은 <b>관리비 합산</b>만 지원합니다. 낙찰 금액은 관리사무소를 통해 입주민 관리비에 자동 합산되며, 계약 기간이 1개월 초과이면 개월별로 <b>분할 청구</b>됩니다.
      </div>
    </div>
  );
}

// ─── AG6: Admin Users / Permissions ─────────────────────────────
function AdminUsersPage() {
  const rows = [
    { name: '김관리', email: 'admin@heliocity', role: '최고 관리자', last: '방금 전', me: true },
    { name: '이부관리', email: 'lee@heliocity', role: '입찰 관리자', last: '2시간 전', me: false },
    { name: '박운영', email: 'park@heliocity', role: '입주민 담당', last: '어제', me: false },
    { name: '최회계', email: 'choi@heliocity', role: '정산 담당', last: '3일 전', me: false },
  ];
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 2 }}>관리자 계정 / 권한</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>함께 운영하는 관리자를 초대하고 권한을 설정합니다.</p>
        </div>
        <button className="btn btn-primary">+ 관리자 초대</button>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n100)', fontSize: 14, fontWeight: 700 }}>관리자 ({rows.length})</div>
        <table className="table">
          <thead><tr><th>이름</th><th>이메일</th><th>역할</th><th>마지막 접속</th><th></th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.name} {r.me && <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', marginLeft: 6 }}>나</span>}</td>
                <td className="muted">{r.email}</td>
                <td>
                  <select className="input" defaultValue={r.role} style={{ height: 32, width: 160, fontSize: 13 }}>
                    <option>최고 관리자</option><option>입찰 관리자</option><option>입주민 담당</option><option>정산 담당</option>
                  </select>
                </td>
                <td className="muted">{r.last}</td>
                <td style={{ textAlign: 'right' }}>
                  {!r.me && <button className="btn btn-ghost" style={{ height: 28, fontSize: 12, padding: '0 10px', color: 'var(--danger)' }}>삭제</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>역할별 권한</div>
        <table className="table">
          <thead>
            <tr>
              <th>권한</th>
              <th style={{ textAlign: 'center' }}>최고 관리자</th>
              <th style={{ textAlign: 'center' }}>입찰 관리자</th>
              <th style={{ textAlign: 'center' }}>입주민 담당</th>
              <th style={{ textAlign: 'center' }}>정산 담당</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['도면 편집 · 입찰 구역 지정', 'y','n','n','n'],
              ['라운드 생성/확정', 'y','y','n','n'],
              ['입주민 승인 (수동)', 'y','n','y','n'],
              ['정산 조회/처리', 'y','n','n','y'],
              ['공지 발송', 'y','y','y','n'],
              ['관리자 관리', 'y','n','n','n'],
            ].map(([perm, ...roles], i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{perm}</td>
                {roles.map((v, j) => (
                  <td key={j} style={{ textAlign: 'center', color: v === 'y' ? 'var(--success)' : 'var(--n200)', fontSize: 16 }}>{v === 'y' ? '✓' : '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, {
  RoundWizardPage, ComplaintsPage, AnnouncePage, PaymentsPage, AdminUsersPage,
});
