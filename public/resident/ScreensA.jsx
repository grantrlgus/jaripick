// Screen components for resident-app UI kit.
// Modeled directly on src/screens/resident/*.tsx.

// ─── Login ──────────────────────────────────────────────────────
function LoginScreen({ go }) {
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
        <button onClick={() => go('complex_register')} style={{
          background: C.kakao, height: 52, borderRadius: 12, border: 0,
          fontSize: 16, fontWeight: 700, color: '#191919', cursor: 'pointer', fontFamily: jpFont,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>💬 카카오로 시작하기</button>
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
            return { cid, number: c ? `${c.row}-${c.n}` : cid, top: e.top.amount, count: uniq };
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
            return { spot: c ? `${c.row}-${c.n}` : b.cell_id, amount: b.amount, date: `${date}${isLeading ? ' · 1위' : ' · 순위 밖'}` };
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
              assignment = { spot: c ? `${c.row}-${c.n}` : cid, amount: e.top.amount, round: r };
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
