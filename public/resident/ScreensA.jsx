// Screen components for resident-app UI kit.
// Modeled directly on src/screens/resident/*.tsx.

// ─── Login ──────────────────────────────────────────────────────
function LoginScreen({ go }) {
  const [busy, setBusy] = React.useState(false);

  // If user returns here already signed in (or OAuth just completed),
  // route them onward. Supabase SDK auto-detects the URL hash.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // Small delay so the Supabase SDK has a chance to exchange the
      // OAuth code in the URL for a session.
      await new Promise(r => setTimeout(r, 150));
      if (cancelled) return;
      const session = await window.jp.auth.getSession();
      if (!session) return;
      // Clean the OAuth hash/query params from the URL.
      try { history.replaceState(null, '', window.location.pathname); } catch {}
      let hasProfile = false, phoneVerified = false;
      try {
        hasProfile = !!(localStorage.getItem('jp_dong') && localStorage.getItem('jp_ho'));
        phoneVerified = localStorage.getItem('jp_phone_verified') === '1';
      } catch {}
      if (hasProfile) go('home');
      else if (!phoneVerified) go('phone_auth');
      else go('complex_register');
    })();
    return () => { cancelled = true; };
  }, []);

  const onGoogleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await window.jp.auth.signInWithGoogle();
      setTimeout(() => setBusy(false), 2000);
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  return (
    <JPScreen bg={C.white} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 0.45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: C.primaryLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 36 }}>🅿️</span>
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.primary, letterSpacing: '-0.5px' }}>자리픽</div>
        <div style={{ fontSize: 14, color: C.n500 }}>아파트 주차 구역 입찰 서비스</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto', paddingBottom: 40 }}>
        <button onClick={onGoogleClick} disabled={busy} style={{
          background: C.white, height: 52, borderRadius: 12, border: `1px solid ${C.n300}`,
          fontSize: 16, fontWeight: 600, color: C.n800,
          cursor: busy ? 'wait' : 'pointer', fontFamily: jpFont,
          opacity: busy ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {busy ? '구글 이동 중…' : '구글로 시작하기'}
        </button>
        <div style={{ fontSize: 12, color: C.n400, textAlign: 'center', marginTop: 4 }}>
          로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다
        </div>
      </div>
    </JPScreen>
  );
}

// ─── Home ───────────────────────────────────────────────────────
function HomeScreen({ go, state }) {
  const [data, setData] = React.useState({ myBids: [], hotSpots: [], auction: null, dday: null, hasAssignment: false, assignment: null });

  const myKey = React.useMemo(() => {
    try {
      const d = localStorage.getItem('jp_dong') || '';
      const h = localStorage.getItem('jp_ho') || '';
      return d && h ? { dong: d, ho: h, key: `${d}-${h}` } : null;
    } catch { return null; }
  }, []);

  const load = React.useCallback(async () => {
    try {
      const [allRounds, cells] = await Promise.all([
        fetch('/api/rounds', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch('/api/cells', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      ]);
      const cellById = {};
      (Array.isArray(cells) ? cells : []).forEach(c => { cellById[c.id] = c; });
      const live = (Array.isArray(allRounds) ? allRounds : []).find(r => r.status === 'live');
      const finalizedList = (Array.isArray(allRounds) ? allRounds : []).filter(r => r.status === 'finalized');

      let hotSpots = [], myBids = [], dday = null;
      if (live) {
        const detail = await fetch(`/api/rounds/${live.id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
        const perCell = detail?.per_cell || {};
        hotSpots = Object.entries(perCell)
          .map(([cid, e]) => {
            const c = cellById[cid];
            const uniq = new Set(e.all.map(b => `${b.dong}-${b.ho}`)).size;
            return { cid, number: c ? c.n : cid, top: e.top.amount, count: uniq };
          })
          .sort((a, b) => b.top - a.top)
          .slice(0, 5);
        if (myKey) {
          const mine = (detail?.bids || []).filter(b => b.dong === myKey.dong && b.ho === myKey.ho);
          const byCell = {};
          mine.forEach(b => {
            const cur = byCell[b.cell_id];
            if (!cur || b.amount > cur.amount) byCell[b.cell_id] = b;
          });
          myBids = Object.values(byCell).map(b => {
            const c = cellById[b.cell_id];
            const entry = perCell[b.cell_id];
            const isLeading = entry && entry.top.dong === b.dong && entry.top.ho === b.ho;
            const date = String(b.created_at || '').slice(0, 10);
            return { spot: c ? c.n : b.cell_id, amount: b.amount, date: `${date}${isLeading ? ' · 1위' : ' · 순위 밖'}` };
          });
        }
        if (live.bid_end) {
          const end = new Date(live.bid_end);
          const today = new Date();
          const ms = end.getTime() - today.getTime();
          dday = Math.max(0, Math.ceil(ms / 86400000));
        }
      }

      let hasAssignment = false, assignment = null;
      if (myKey) {
        for (const r of finalizedList) {
          const detail = await fetch(`/api/rounds/${r.id}`, { cache: 'no-store' }).then(x => x.ok ? x.json() : null);
          const perCell = detail?.per_cell || {};
          for (const [cid, e] of Object.entries(perCell)) {
            if (e.top.dong === myKey.dong && e.top.ho === myKey.ho) {
              hasAssignment = true;
              const c = cellById[cid];
              assignment = { spot: c ? c.n : cid, amount: e.top.amount, round: r };
              break;
            }
          }
          if (hasAssignment) break;
        }
      }

      setData({ myBids, hotSpots, auction: live, dday, hasAssignment, assignment });
    } catch {}
  }, [myKey]);

  React.useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const { myBids, hotSpots, auction, dday, hasAssignment } = data;
  return (
    <JPScreen>
      <JPHeader
        left={
          <div>
            <div style={{ fontSize: 12, color: C.n500 }}>{(() => { try { const d = localStorage.getItem('jp_dong'); const h = localStorage.getItem('jp_ho'); return d && h ? `${d}동 ${h}호` : ''; } catch { return ''; } })()}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>{(() => { try { return localStorage.getItem('jp_complex_name') || '오금현대'; } catch { return '오금현대'; } })()}</div>
          </div>
        }
        right={
          <button onClick={() => go('settings')} style={{
            background: 'transparent', border: 0, fontSize: 22, padding: 6,
            cursor: 'pointer', color: C.n700,
          }}>⚙️</button>
        }
      />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>
        {/* Auction banner */}
        {auction && (
          <div onClick={() => go('list')} style={{
            background: C.primary, borderRadius: 12, padding: 16, color: C.white, cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>지금 바로 참여하세요!</div>
              {dday != null && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700 }}>D-{dday}</span>}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{auction.name || '선호 주차 구역 입찰 진행중'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 8 }}>구역 보러가기 →</div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { e: '🅿️', l: '구역 목록', k: 'list' },
            { e: '📋', l: '내 신청', k: 'bids' },
            { e: '🎫', l: '내 구역', k: 'cert' },
          ].map(i => (
            <button key={i.k} onClick={() => go(i.k)} style={{
              flex: 1, background: C.white, borderRadius: 12, border: 0,
              padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,.05)',
            }}>
              <span style={{ fontSize: 22 }}>{i.e}</span>
              <span style={{ fontSize: 12, color: C.n700, fontWeight: 500, fontFamily: jpFont }}>{i.l}</span>
            </button>
          ))}
        </div>

        {/* Assignment card */}
        {hasAssignment && (
          <div onClick={() => go('cert')} style={{
            background: C.white, borderRadius: 12, padding: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)',
          }}>
            <span style={{ fontSize: 28 }}>🎫</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: C.primary, fontWeight: 600 }}>확정된 구역이 있어요</div>
              <div style={{ fontSize: 12, color: C.n500, marginTop: 1 }}>권리증을 확인해보세요</div>
            </div>
            <span style={{ fontSize: 24, color: C.n400 }}>›</span>
          </div>
        )}

        {/* Hot auctions */}
        {hotSpots.length > 0 && (
          <>
            <JPSectionHeader title="🔥 진행중인 입찰" rightLabel="전체보기" onRight={() => go('list')} />
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, margin: '0 -20px', padding: '0 20px' }}>
              {hotSpots.map((s, i) => (
                <div key={i} style={{
                  minWidth: 140, background: C.white, borderRadius: 12, padding: 14,
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{s.number}</div>
                    <span style={{ background: C.dangerLight, color: C.danger, padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{s.count}명</span>
                  </div>
                  <div style={{ fontSize: 16, color: C.primary, fontWeight: 700, marginTop: 6 }}>{s.top.toLocaleString()}원</div>
                  <div style={{ fontSize: 11, color: C.n400 }}>현재 최고가</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* My bids */}
        <JPSectionHeader title="내 신청 현황" rightLabel={myBids.length > 0 ? '전체보기' : null} onRight={() => go('bids')} />
        {myBids.length === 0 ? (
          <JPEmptyState
            emoji="🅿️"
            message={"아직 신청한 구역이 없어요.\n구역을 둘러보세요!"}
            ctaLabel="구역 보러가기"
            onCta={() => go('list')}
          />
        ) : (
          myBids.slice(0, 3).map((b, i) => (
            <div key={i} onClick={() => go('detail', { spot: b.spot })} style={{
              background: C.white, borderRadius: 12, padding: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: C.primary }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{b.spot} 구역</div>
                <div style={{ fontSize: 12, color: C.n400, marginTop: 1 }}>{b.date}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.primary }}>{b.amount.toLocaleString()}원</div>
            </div>
          ))
        )}
      </div>
    </JPScreen>
  );
}

Object.assign(window, { LoginScreen, HomeScreen });
