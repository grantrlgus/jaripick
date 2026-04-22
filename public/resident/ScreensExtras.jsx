// Extra screens: Notifications, Settings, Payment, ReBidCancel, Error, FAQ

function NotificationsScreen({ go }) {
  const [notifs, setNotifs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const creds = React.useMemo(() => {
    try {
      return {
        dong: localStorage.getItem('jp_dong') || '',
        ho: localStorage.getItem('jp_ho') || '',
        requestId: localStorage.getItem('jp_request_id') || '',
        complexName: localStorage.getItem('jp_complex_name') || '오금현대',
      };
    } catch { return { dong: '', ho: '', requestId: '', complexName: '오금현대' }; }
  }, []);

  const relTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return '방금 전';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}일 전`;
    return new Date(iso).toISOString().slice(0, 10);
  };

  React.useEffect(() => {
    (async () => {
      if (!creds.dong || !creds.ho) { setLoading(false); return; }
      const list = [];
      const [rounds, cells, req] = await Promise.all([
        fetch('/api/rounds', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch('/api/cells', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        creds.requestId
          ? fetch(`/api/residents/requests/${creds.requestId}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
          : Promise.resolve(null),
      ]);
      const cellById = {};
      (Array.isArray(cells) ? cells : []).forEach(c => { cellById[c.id] = c; });

      if (req && req.status === 'approved') {
        list.push({
          ts: req.decided_at || req.created_at,
          t: '✅ 입주민 승인 완료',
          d: `${creds.complexName} ${creds.dong}동 ${creds.ho}호`,
          action: null,
        });
      } else if (req && req.status === 'rejected') {
        list.push({
          ts: req.decided_at || req.created_at,
          t: '⚠️ 입주민 승인 거절',
          d: '관리자에게 문의해주세요',
          action: null,
        });
      }

      for (const r of (Array.isArray(rounds) ? rounds : [])) {
        const detail = await fetch(`/api/rounds/${r.id}`, { cache: 'no-store' }).then(x => x.ok ? x.json() : null);
        if (!detail) continue;
        const perCell = detail.per_cell || {};
        const myBidsByCell = {};
        (detail.bids || []).forEach(b => {
          if (b.dong !== creds.dong || b.ho !== creds.ho) return;
          const cur = myBidsByCell[b.cell_id];
          if (!cur || new Date(b.created_at) > new Date(cur.created_at)) myBidsByCell[b.cell_id] = b;
        });
        for (const [cid, myBid] of Object.entries(myBidsByCell)) {
          const entry = perCell[cid];
          const c = cellById[cid];
          const spot = c ? c.n : cid;
          const isTop = entry && entry.top.dong === creds.dong && entry.top.ho === creds.ho;
          const uniq = entry ? new Set(entry.all.map(b => `${b.dong}-${b.ho}`)).size : 1;
          if (r.status === 'finalized' && isTop) {
            list.push({
              ts: r.updated_at || r.bid_end || myBid.created_at,
              t: '🎉 낙찰됐어요!',
              d: `${spot} 구역에 ${entry.top.amount.toLocaleString()}원으로 확정됐어요`,
              action: 'cert',
            });
          } else if (r.status === 'live' && isTop) {
            list.push({
              ts: myBid.created_at,
              t: '🏆 현재 1위예요',
              d: `${spot} 구역 · ${uniq}명 중 1위`,
              action: 'detail',
              spot,
            });
          } else if (r.status === 'live' && !isTop) {
            list.push({
              ts: entry?.top?.created_at || myBid.created_at,
              t: '⚠️ 순위가 밀렸어요',
              d: `${spot} 구역 · ${entry.top.amount.toLocaleString()}원이 최고가가 됐어요`,
              action: 'bid',
              spot,
            });
          }
        }
      }

      list.sort((a, b) => (new Date(b.ts).getTime() || 0) - (new Date(a.ts).getTime() || 0));
      setNotifs(list);
      setLoading(false);
    })();
  }, [creds]);

  return (
    <JPScreen>
      <JPHeader left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => go('home')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>알림</div>
        </div>
      } />
      {!loading && notifs.length === 0 && (
        <div style={{ padding: '40px 20px' }}>
          <JPEmptyState emoji="🔔" message={"아직 알림이 없어요."} />
        </div>
      )}
      <div style={{ padding: '8px 20px 100px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifs.map((n, i) => (
          <div key={i} onClick={() => n.action && go(n.action, n.spot ? { spot: n.spot } : {})} style={{
            background: C.white, borderRadius: 12, padding: 14,
            cursor: n.action ? 'pointer' : 'default',
            border: `1px solid ${C.n100}`,
            display: 'flex', gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{n.t}</div>
                <div style={{ fontSize: 11, color: C.n400 }}>{relTime(n.ts)}</div>
              </div>
              <div style={{ fontSize: 13, color: C.n500, marginTop: 4 }}>{n.d}</div>
            </div>
          </div>
        ))}
      </div>
    </JPScreen>
  );
}

function SettingsScreen({ go }) {
  const profile = (() => {
    try {
      return {
        name: localStorage.getItem('jp_name') || '',
        dong: localStorage.getItem('jp_dong') || '',
        ho: localStorage.getItem('jp_ho') || '',
        plate: localStorage.getItem('jp_plate') || '',
        complexName: localStorage.getItem('jp_complex_name') || '오금현대',
      };
    } catch { return { name: '', dong: '', ho: '', plate: '', complexName: '오금현대' }; }
  })();
  const dongHo = profile.dong && profile.ho ? `${profile.dong}동 ${profile.ho}호` : '';
  const rows = [
    { e: '👤', l: '프로필', s: [profile.name, dongHo].filter(Boolean).join(' · ') || '—', to: null },
    { e: '🚗', l: '차량 정보', s: profile.plate || '등록된 차량 없음', to: 'vehicle' },
    { e: '🔔', l: '알림 설정', s: '입찰, 라운드, 공지', to: null },
    { e: '💳', l: '결제 수단', s: '관리비 합산', to: null },
    { e: '❓', l: '도움말 / FAQ', s: null, to: 'faq' },
    { e: '📋', l: '이용약관 · 개인정보', s: null, to: null },
  ];
  return (
    <JPScreen>
      <JPHeader left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => go('home')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>설정</div>
        </div>
      } />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 100 }}>
        <div style={{
          background: C.white, borderRadius: 12, padding: 18,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧑</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{profile.name || '—'}</div>
            <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>{profile.complexName}{dongHo ? ` · ${dongHo}` : ''}</div>
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <div key={i} onClick={() => r.to && go(r.to)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderTop: i === 0 ? 0 : `1px solid ${C.n100}`,
                cursor: r.to ? 'pointer' : 'default',
              }}>
              <span style={{ fontSize: 20 }}>{r.e}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.l}</div>
                {r.s && <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>{r.s}</div>}
              </div>
              <span style={{ color: C.n400, fontSize: 20 }}>›</span>
            </div>
          ))}
        </div>

        <button onClick={() => {
          if (!confirm('로그아웃 하시겠어요?')) return;
          try {
            localStorage.removeItem('jp_request_id');
            localStorage.removeItem('jp_dong');
            localStorage.removeItem('jp_ho');
            localStorage.removeItem('jp_name');
            localStorage.removeItem('jp_plate');
            localStorage.removeItem('jp_complex_name');
          } catch {}
          go('login');
        }} style={{
          height: 48, background: C.white, borderRadius: 12, border: 0,
          color: C.danger, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: jpFont,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}>로그아웃</button>
      </div>
    </JPScreen>
  );
}

function PaymentScreen({ go }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const creds = React.useMemo(() => {
    try { return { dong: localStorage.getItem('jp_dong') || '', ho: localStorage.getItem('jp_ho') || '' }; }
    catch { return { dong: '', ho: '' }; }
  }, []);

  React.useEffect(() => {
    (async () => {
      if (!creds.dong || !creds.ho) { setLoading(false); return; }
      const [rounds, cells] = await Promise.all([
        fetch('/api/rounds', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch('/api/cells', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      ]);
      const cellById = {};
      (Array.isArray(cells) ? cells : []).forEach(c => { cellById[c.id] = c; });
      for (const r of (Array.isArray(rounds) ? rounds : []).filter(x => x.status === 'finalized')) {
        const detail = await fetch(`/api/rounds/${r.id}`, { cache: 'no-store' }).then(x => x.ok ? x.json() : null);
        const perCell = detail?.per_cell || {};
        for (const [cid, e] of Object.entries(perCell)) {
          if (e.top.dong === creds.dong && e.top.ho === creds.ho) {
            const c = cellById[cid];
            setData({ spot: c ? c.n : cid, amount: e.top.amount, start: r.contract_start, end: r.contract_end });
            setLoading(false);
            return;
          }
        }
      }
      setLoading(false);
    })();
  }, [creds]);

  if (loading) {
    return (
      <JPScreen bg={C.white}>
        <JPHeader left={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => go('cert')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button><div style={{ fontSize: 18, fontWeight: 700 }}>결제 안내</div></div>} />
        <div style={{ padding: 40, textAlign: 'center', color: C.n500, fontSize: 13 }}>불러오는 중…</div>
      </JPScreen>
    );
  }

  if (!data) {
    return (
      <JPScreen bg={C.white}>
        <JPHeader left={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => go('cert')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button><div style={{ fontSize: 18, fontWeight: 700 }}>결제 안내</div></div>} />
        <div style={{ padding: '40px 20px' }}>
          <JPEmptyState emoji="💳" message={"확정된 구역이 없어요.\n낙찰 후 결제 안내가 표시됩니다."} />
        </div>
      </JPScreen>
    );
  }

  const { spot, amount: total, start, end } = data;
  let months = 1;
  let schedule = [];
  if (start && end) {
    const s = new Date(start), e = new Date(end);
    months = Math.max(1, Math.round((e - s) / (30 * 86400000)));
    const monthly = Math.round(total / months);
    const today = new Date();
    for (let i = 0; i < months; i++) {
      const m = new Date(s.getFullYear(), s.getMonth() + i, 1);
      const monthEnd = new Date(s.getFullYear(), s.getMonth() + i + 1, 0);
      let status = 'upcoming';
      if (today > monthEnd) status = 'paid';
      else if (today >= m && today <= monthEnd) status = 'due';
      schedule.push({ m: `${m.getFullYear()}년 ${m.getMonth() + 1}월`, amt: monthly, when: `${m.getMonth() + 1}월 관리비`, status });
    }
  } else {
    schedule = [{ m: '전체', amt: total, when: '관리비', status: 'upcoming' }];
  }

  return (
    <JPScreen bg={C.white}>
      <JPHeader left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => go('cert')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>결제 안내</div>
        </div>
      } />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 120 }}>
        <div style={{ background: C.primary, color: C.white, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>낙찰 금액</div>
          <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4 }}>{total.toLocaleString()}원</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>{spot}{start && end ? ` · ${start} ~ ${end} (${months}개월)` : ''}</div>
        </div>

        <div style={{
          background: C.successLight, border: `1.5px solid ${C.success}`, borderRadius: 12, padding: 14,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 22 }}>🏢</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.success }}>관리비 합산 청구</div>
            <div style={{ fontSize: 12, color: C.n700, marginTop: 3, lineHeight: 1.5 }}>
              별도 결제 없이 매월 <b>관리비에 자동 합산</b>돼요.<br/>
              계약이 1개월 초과이면 <b>개월별로 분할</b> 청구됩니다.
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>청구 스케줄</div>
          <div style={{ background: C.white, border: `1px solid ${C.n100}`, borderRadius: 12, overflow: 'hidden' }}>
            {schedule.map((s, i) => (
              <div key={i} style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                borderTop: i === 0 ? 0 : `1px solid ${C.n100}`,
                opacity: s.status === 'paid' ? 0.6 : 1,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: s.status === 'paid' ? C.successLight : s.status === 'due' ? C.warningLight : C.primaryLight,
                  color: s.status === 'paid' ? C.success : s.status === 'due' ? '#92400E' : C.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                }}>{s.status === 'paid' ? '✓' : i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.m}{s.status === 'due' ? ' · 청구 중' : s.status === 'paid' ? ' · 완료' : ''}</div>
                  <div style={{ fontSize: 11, color: C.n500, marginTop: 1 }}>{s.when}에 포함</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.n900 }}>{s.amt.toLocaleString()}원</div>
              </div>
            ))}
            <div style={{
              padding: '12px 14px', background: C.n50, display: 'flex', justifyContent: 'space-between',
              fontSize: 13, fontWeight: 700, borderTop: `1px solid ${C.n100}`,
            }}>
              <span>총 합계</span>
              <span style={{ color: C.primary }}>{total.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        <div style={{
          background: C.n50, borderRadius: 10, padding: '10px 12px',
          fontSize: 11, color: C.n500, lineHeight: 1.6,
        }}>
          ※ 자리픽은 관리비 합산만 지원해요. 연체·분할 변경은 관리사무소에 문의해주세요.
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 32, left: 20, right: 20 }}>
        <JPPrimaryButton label="확인했어요" onClick={() => go('cert')} />
      </div>
    </JPScreen>
  );
}

function ReBidCancelScreen({ go, state }) {
  const spot = state.currentSpot || '';
  const [confirm, setConfirm] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [cancelling, setCancelling] = React.useState(false);
  const [err, setErr] = React.useState('');

  const creds = React.useMemo(() => {
    try { return { dong: localStorage.getItem('jp_dong') || '', ho: localStorage.getItem('jp_ho') || '' }; }
    catch { return { dong: '', ho: '' }; }
  }, []);

  React.useEffect(() => {
    (async () => {
      if (!creds.dong || !creds.ho || !spot) { setLoading(false); return; }
      const [rounds, cells] = await Promise.all([
        fetch('/api/rounds?status=live', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch('/api/cells', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      ]);
      const live = Array.isArray(rounds) && rounds.length ? rounds[0] : null;
      const cs = Array.isArray(cells) ? cells : [];
      const cell = cs.find(c => c.n === spot);
      if (!live || !cell) { setLoading(false); return; }
      const detail = await fetch(`/api/rounds/${live.id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
      const entry = detail?.per_cell?.[cell.id];
      const mine = (entry?.all || []).filter(b => b.dong === creds.dong && b.ho === creds.ho);
      const myTop = mine.length ? mine.reduce((a, b) => (a.amount > b.amount ? a : b)) : null;
      const isLeading = entry && myTop && entry.top.id === myTop.id;
      let dday = null;
      if (live.bid_end) {
        const ms = new Date(live.bid_end).getTime() - Date.now();
        dday = Math.max(0, Math.ceil(ms / 86400000));
      }
      setData({ round: live, cell, myTop, isLeading, dday });
      setLoading(false);
    })();
  }, [creds, spot]);

  const doCancel = async () => {
    if (!data?.round || !data?.cell) return;
    setCancelling(true);
    setErr('');
    try {
      const res = await fetch('/api/bids', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: data.round.id, cell_id: data.cell.id, dong: creds.dong, ho: creds.ho }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error || '취소 실패'); setCancelling(false); return; }
      setConfirm(false);
      go('bids');
    } catch (e) { setErr('네트워크 오류'); setCancelling(false); }
  };

  if (loading) {
    return (
      <JPScreen>
        <JPHeader left={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => go('bids')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button><div style={{ fontSize: 18, fontWeight: 700 }}>입찰 관리</div></div>} />
        <div style={{ padding: 40, textAlign: 'center', color: C.n500, fontSize: 13 }}>불러오는 중…</div>
      </JPScreen>
    );
  }

  if (!data?.myTop) {
    return (
      <JPScreen>
        <JPHeader left={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => go('bids')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button><div style={{ fontSize: 18, fontWeight: 700 }}>입찰 관리</div></div>} />
        <div style={{ padding: '40px 20px' }}>
          <JPEmptyState emoji="📋" message={"이 구역에 입찰 내역이 없어요."} ctaLabel="구역 보러가기" onCta={() => go('list')} />
        </div>
      </JPScreen>
    );
  }

  const { myTop, isLeading, dday } = data;
  return (
    <JPScreen>
      <JPHeader left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => go('bids')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>입찰 관리</div>
        </div>
      } />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <JPCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <JPSpotBadge number={spot} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{spot} 구역</div>
              <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>내 입찰가 {myTop.amount.toLocaleString()}원 · {isLeading ? '🏆 1위' : '순위 밖'}</div>
            </div>
            {dday != null && <JPDdayBadge days={dday} />}
          </div>
        </JPCard>

        <button onClick={() => go('bid', { spot })} style={{
          background: C.white, borderRadius: 12, padding: '16px', border: 0, cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,.06)', fontFamily: jpFont, textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>⬆️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>금액 올리기</div>
            <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>마감 전까지 재입찰 가능</div>
          </div>
          <span style={{ color: C.n400, fontSize: 20 }}>›</span>
        </button>

        <button onClick={() => setConfirm(true)} style={{
          background: C.white, borderRadius: 12, padding: '16px', border: 0, cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,.06)', fontFamily: jpFont, textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>❌</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.danger }}>입찰 취소</div>
            <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>취소 후 같은 라운드 재입찰 불가</div>
          </div>
        </button>

        <div style={{
          background: C.warningLight, borderRadius: 10, padding: 12,
          fontSize: 12, color: '#92400E', lineHeight: 1.6,
        }}>
          💡 취소 정책은 단지별 규칙에 따라 달라요. 한 번 취소한 구역은 이번 라운드에서 다시 신청할 수 없어요.
        </div>
      </div>

      {confirm && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', background: C.white, borderRadius: '20px 20px 0 0',
            padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ width: 40, height: 4, background: C.n200, borderRadius: 2, alignSelf: 'center', marginBottom: 4 }} />
            <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center' }}>정말 입찰을 취소할까요?</div>
            <div style={{ fontSize: 13, color: C.n500, textAlign: 'center', lineHeight: 1.6 }}>
              {spot} 구역 {myTop.amount.toLocaleString()}원 신청이 취소돼요.<br/>이번 라운드에는 다시 신청할 수 없어요.
            </div>
            {err && <div style={{ fontSize: 12, color: C.danger, textAlign: 'center' }}>{err}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button disabled={cancelling} onClick={doCancel} style={{
                height: 52, borderRadius: 12, border: 0, background: C.danger, color: C.white,
                fontSize: 15, fontWeight: 700, cursor: cancelling ? 'default' : 'pointer', fontFamily: jpFont,
                opacity: cancelling ? 0.6 : 1,
              }}>{cancelling ? '취소 중…' : '취소할게요'}</button>
              <button onClick={() => setConfirm(false)} style={{
                height: 52, borderRadius: 12, border: 0, background: C.n100, color: C.n700,
                fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: jpFont,
              }}>그만두기</button>
            </div>
          </div>
        </div>
      )}
    </JPScreen>
  );
}

function ErrorScreen({ go }) {
  return (
    <JPScreen bg={C.white} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 16 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 48, background: C.dangerLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
        }}>😵</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.n900, textAlign: 'center' }}>
          이미 더 높은 입찰이 있어요
        </div>
        <div style={{ fontSize: 14, color: C.n500, textAlign: 'center', lineHeight: 1.6 }}>
          다른 분이 방금 170,000원을 제시했어요.<br/>
          금액을 올려 다시 시도해보세요.
        </div>
        <div style={{
          width: '100%', background: C.n50, borderRadius: 12, padding: 14, marginTop: 8,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: C.n500 }}>내 입찰</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>160,000원</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.n500 }}>현재 최고가</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.danger, marginTop: 2 }}>170,000원</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <JPPrimaryButton label="더 높은 금액으로 재입찰" onClick={() => go('bid')} />
        <JPSecondaryButton label="다른 구역 보기" onClick={() => go('list')} />
      </div>
    </JPScreen>
  );
}

function FaqScreen({ go }) {
  const [open, setOpen] = React.useState(0);
  const faqs = [
    { q: '입찰이 뭐예요?', a: '관리사무소가 라운드를 열면 기간 안에 원하는 구역에 금액을 제시하는 방식이에요. 가장 높은 금액이 낙찰돼요.' },
    { q: '낙찰되면 어떻게 되나요?', a: '권리증이 발급되고, 해당 구역을 계약 기간(보통 3개월) 동안 사용할 수 있어요. 결제는 관리비 합산 또는 별도 방식이에요.' },
    { q: '돈은 어디로 가나요?', a: '관리사무소 장기수선충당금 또는 운영 계정으로 귀속돼요. 단지별로 다를 수 있으니 관리사무소에 확인해주세요.' },
    { q: '입찰을 취소할 수 있나요?', a: '마감 전에는 취소 가능하지만, 같은 라운드에서 같은 구역에 다시 입찰할 수는 없어요.' },
    { q: '순위가 밀리면 알림이 와요?', a: '네, 실시간으로 알림을 보내드려요. 설정에서 알림을 꺼둘 수도 있어요.' },
  ];
  return (
    <JPScreen>
      <JPHeader left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => go('settings')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>자주 묻는 질문</div>
        </div>
      } />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <button onClick={() => setOpen(open === i ? -1 : i)} style={{
              width: '100%', border: 0, background: 'transparent', cursor: 'pointer',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: jpFont, textAlign: 'left',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 11, background: C.primaryLight, color: C.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, flexShrink: 0,
              }}>Q</span>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{f.q}</div>
              <span style={{ color: C.n400, fontSize: 14, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
            </button>
            {open === i && (
              <div style={{ padding: '0 16px 14px 48px', fontSize: 13, color: C.n500, lineHeight: 1.7 }}>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </JPScreen>
  );
}

Object.assign(window, {
  NotificationsScreen, SettingsScreen, PaymentScreen, ReBidCancelScreen, ErrorScreen, FaqScreen,
});
