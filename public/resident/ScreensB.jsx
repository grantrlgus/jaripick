// More screens: SpotList, SpotDetail, Bid, BidComplete, MyBids, Cert

function JPNaverMap({ go }) {
  const divRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const [cells, setCells] = React.useState([]);
  const [perCell, setPerCell] = React.useState({});
  const [mapReady, setMapReady] = React.useState(false);
  const [picked, setPicked] = React.useState(null);

  const CENTER = { lat: 37.5058, lng: 127.1254 };

  const myKey = React.useMemo(() => {
    try {
      const d = localStorage.getItem('jp_dong') || '';
      const h = localStorage.getItem('jp_ho') || '';
      return d && h ? `${d}-${h}` : '';
    } catch { return ''; }
  }, []);

  const refetch = React.useCallback(() => {
    fetch('/api/cells', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCells(data.filter(c => c.active !== false)); })
      .catch(() => {});
    fetch('/api/rounds?status=live', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(async rounds => {
        const live = Array.isArray(rounds) && rounds.length ? rounds[0] : null;
        if (!live) { setPerCell({}); return; }
        const detail = await fetch(`/api/rounds/${live.id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
        setPerCell(detail?.per_cell || {});
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    refetch();
    const onVis = () => { if (document.visibilityState === 'visible') refetch(); };
    const iv = setInterval(refetch, 5000);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', refetch);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', refetch);
    };
  }, [refetch]);

  const cellState = React.useCallback((cell) => {
    const entry = perCell[cell.id];
    if (!entry || !entry.all || entry.all.length === 0) return 'open';
    const topKey = entry.top ? `${entry.top.dong}-${entry.top.ho}` : '';
    if (myKey && topKey === myKey) return 'leading';
    return 'bidding';
  }, [perCell, myKey]);

  const MARKER_STYLES = {
    open:    { bg: '#FFFFFF', fg: '#374151', border: '#D1D5DB' },
    bidding: { bg: '#FEF3C7', fg: '#92400E', border: '#F59E0B' },
    leading: { bg: '#DBEAFE', fg: '#1E3A8A', border: '#3B82F6' },
  };

  React.useEffect(() => {
    const init = () => {
      if (!window.naver || !window.naver.maps || !divRef.current || mapRef.current) {
        if (mapRef.current) setMapReady(true);
        return;
      }
      const { naver } = window;
      const map = new naver.maps.Map(divRef.current, {
        center: new naver.maps.LatLng(CENTER.lat, CENTER.lng),
        zoom: 18,
        minZoom: 15,
        maxZoom: 21,
        mapTypeControl: false,
        mapDataControl: false,
        zoomControl: false,
        scaleControl: false,
        logoControl: true,
      });
      mapRef.current = map;
      setMapReady(true);
    };

    if (window.naver && window.naver.maps) { init(); return; }
    const existing = document.querySelector('script[data-naver-maps]');
    if (existing) { existing.addEventListener('load', init); return; }
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=qxze9eualp';
    s.async = true;
    s.setAttribute('data-naver-maps', '');
    s.onload = init;
    document.head.appendChild(s);
  }, []);

  React.useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver) return;
    const { naver } = window;
    const map = mapRef.current;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    cells.forEach(cell => {
      const rot = cell.rot || 0;
      const st = cellState(cell);
      const s = MARKER_STYLES[st];
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cell.lat, cell.lng),
        map,
        icon: {
          content: `<div style="
            transform:rotate(${rot}deg);transform-origin:center center;
            background:${s.bg};color:${s.fg};border:1.5px solid ${s.border};
            border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;
            font-family:'Pretendard',system-ui,sans-serif;white-space:nowrap;
            box-shadow:0 1px 2px rgba(0,0,0,0.12);user-select:none;">${cell.n}</div>`,
          anchor: new naver.maps.Point(18, 12),
        },
        clickable: true,
        draggable: false,
      });
      naver.maps.Event.addListener(marker, 'click', () => setPicked(cell));
      markersRef.current.push(marker);
    });

    if (cells.length > 0) {
      const bounds = new naver.maps.LatLngBounds();
      cells.forEach(c => bounds.extend(new naver.maps.LatLng(c.lat, c.lng)));
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [cells, mapReady, perCell, myKey]);

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', background: C.n100 }}>
      <div ref={divRef} style={{ position: 'absolute', inset: 0 }} />
      {!mapReady && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10, pointerEvents: 'none',
          background: C.n100,
        }}>
          <div style={{
            width: 28, height: 28, border: `3px solid ${C.n200}`,
            borderTopColor: C.primary, borderRadius: '50%',
            animation: 'jp-spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 12, color: C.n500 }}>지도 불러오는 중…</div>
        </div>
      )}
      {mapReady && cells.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none',
          background: 'rgba(243,244,246,0.9)',
        }}>
          <span style={{ fontSize: 32 }}>🗺️</span>
          <div style={{ fontSize: 13, color: C.n500 }}>등록된 구역이 없어요</div>
          <div style={{ fontSize: 11, color: C.n400 }}>관리자가 구역을 등록하면 표시됩니다</div>
        </div>
      )}
      {picked && (
        <>
          <div onClick={() => setPicked(null)} style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 10,
          }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 11,
            background: C.white, borderTopLeftRadius: 16, borderTopRightRadius: 16,
            padding: 16, boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: C.n200 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                minWidth: 44, height: 44, padding: '0 10px', borderRadius: 10,
                background: '#DBEAFE', color: '#1E3A8A', fontWeight: 800, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{picked.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.n900 }}>{picked.row}-{picked.n}번</div>
                <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>입찰 대상</div>
              </div>
              <JPDdayBadge days={3} />
            </div>
            {(() => {
              const entry = perCell[picked.id];
              const top = entry?.top?.amount || 0;
              const count = entry?.all ? new Set(entry.all.map(b => `${b.dong}-${b.ho}`)).size : 0;
              return (
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: C.n50 || '#F9FAFB', borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 11, color: C.n500 }}>현재 최고가</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.n900, marginTop: 2 }}>
                      {top ? <>{top.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 500, color: C.n500 }}>원</span></> : <span style={{ fontSize: 13, color: C.n500 }}>입찰 없음</span>}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: C.n50 || '#F9FAFB', borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 11, color: C.n500 }}>입찰자</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.n900, marginTop: 2 }}>{count}<span style={{ fontSize: 11, fontWeight: 500, color: C.n500 }}>명</span></div>
                  </div>
                </div>
              );
            })()}
            <button onClick={() => { const code = `${picked.row}-${picked.n}`; setPicked(null); go && go('detail', { spot: code }); }} style={{
              width: '100%', padding: '12px 0', border: 0, borderRadius: 10,
              background: C.primary, color: C.white, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: jpFont,
            }}>입찰하기</button>
          </div>
        </>
      )}
    </div>
  );
}

function SpotListScreen({ go, state }) {
  const [mode, setMode] = React.useState('map');

  const sections = [
    { id: 'A', name: 'A', count: 5, spots: [
      { n: 1, state: 'open' }, { n: 2, state: 'mybid', label: '내 입찰' },
      { n: 3, state: 'leading', label: '내 1위' },
      { n: 4, state: 'open', label: '3명' }, { n: 5, state: 'closed', label: '마감' },
    ]},
    { id: 'B', name: 'B', count: 6, spots: [
      { n: 1, state: 'open', label: '2명' }, { n: 2, state: 'open' },
      { n: 3, state: 'open', label: '1명' }, { n: 4, state: 'open' },
      { n: 5, state: 'closed', label: '마감' }, { n: 6, state: 'open' },
    ]},
  ];

  const cellStyle = (s) => {
    const base = {
      width: 56, height: 66, borderRadius: 6, border: '1.5px solid', borderTopWidth: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      flexShrink: 0, cursor: 'pointer',
    };
    if (s.state === 'closed') return { ...base, background: C.n100, borderColor: C.n200, color: C.n400, cursor: 'default' };
    if (s.state === 'leading') return { ...base, background: C.primaryLight, borderColor: C.primary, color: C.primary };
    if (s.state === 'mybid') return { ...base, background: C.successLight, borderColor: C.success, color: C.success };
    return { ...base, background: C.white, borderColor: C.n200, color: C.n900 };
  };

  return (
    <JPScreen style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, paddingTop: 52 }}>
        {/* Auction banner */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: C.white, padding: '12px 20px', borderBottom: `1px solid ${C.n100}`,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>입찰 진행중 · 계약 5/1~7/31</div>
            <div style={{ fontSize: 12, color: C.n500, marginTop: 1 }}>전기차/장애인/방문객 구역 제외</div>
          </div>
          <JPDdayBadge days={3} />
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: 3, background: C.n100, padding: 3, borderRadius: 8, margin: '10px 20px' }}>
          {[
            { k: 'map', l: '지도' },
            { k: 'list', l: '리스트' },
          ].map(t => (
            <button key={t.k} onClick={() => setMode(t.k)} style={{
              flex: 1, padding: '7px 0', border: 0, borderRadius: 6, cursor: 'pointer', fontFamily: jpFont,
              background: mode === t.k ? C.white : 'transparent',
              boxShadow: mode === t.k ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
              color: mode === t.k ? C.n900 : C.n500,
              fontSize: 12, fontWeight: 600,
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {mode === 'map' ? (
        <JPNaverMap go={go} />
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.flatMap(sec => sec.spots.map(s => ({ ...s, sec: sec.id }))).map(s => (
            <div key={`${s.sec}-${s.n}`} onClick={() => s.state !== 'closed' && go('detail', { spot: `${s.sec}-${s.n}` })}
              style={{
                background: C.white, borderRadius: 12, padding: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                display: 'flex', alignItems: 'center', gap: 12, cursor: s.state === 'closed' ? 'default' : 'pointer',
                opacity: s.state === 'closed' ? 0.55 : 1,
              }}>
              <JPSpotBadge number={`${s.sec}-${s.n}`} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.sec}-{s.n} 구역</div>
                <div style={{ fontSize: 12, color: C.n500 }}>{s.label || '신청 가능'}</div>
              </div>
              <span style={{ fontSize: 20, color: C.n400 }}>›</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{
        flexShrink: 0,
        display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 16px', background: C.white, borderTop: `1px solid ${C.n100}`,
      }}>
        {[
          { c: '#FFFFFF', b: '#D1D5DB', l: '입찰 없음' },
          { c: '#FEF3C7', b: '#F59E0B', l: '입찰 진행중' },
          { c: '#DBEAFE', b: '#3B82F6', l: '내가 1위' },
        ].map((i, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: i.c, border: `1.5px solid ${i.b}` }} />
            <div style={{ fontSize: 11, color: C.n500 }}>{i.l}</div>
          </div>
        ))}
      </div>
    </JPScreen>
  );
}

// ─── Bid ────────────────────────────────────────────────────────
function BidScreen({ go, state }) {
  const spot = state.currentSpot || 'A-23';
  const [amount, setAmount] = React.useState(0);
  const [round, setRound] = React.useState(null);
  const [cell, setCell] = React.useState(null);
  const [topBid, setTopBid] = React.useState(0);
  const [participants, setParticipants] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const [rounds, cells] = await Promise.all([
        fetch('/api/rounds?status=live').then(r => r.ok ? r.json() : []),
        fetch('/api/cells').then(r => r.ok ? r.json() : []),
      ]);
      const liveRound = Array.isArray(rounds) && rounds.length ? rounds[0] : null;
      setRound(liveRound);
      const cs = Array.isArray(cells) ? cells : (cells.cells || []);
      const matched = cs.find(c => `${c.row}-${c.n}` === spot || c.n === spot);
      setCell(matched || null);
      if (liveRound && matched) {
        const detail = await fetch(`/api/rounds/${liveRound.id}`).then(r => r.ok ? r.json() : null);
        const entry = detail?.per_cell?.[matched.id];
        const t = entry ? entry.top.amount : 0;
        setTopBid(t);
        setParticipants(entry ? new Set(entry.all.map(b => `${b.dong}-${b.ho}`)).size : 0);
        setAmount(t ? t + 10000 : 50000);
      } else {
        setAmount(50000);
      }
    })();
  }, [spot]);

  const isTooLow = amount > 0 && amount <= topBid;

  const submit = async () => {
    setErr('');
    if (!round || !cell) { setErr('진행 중인 라운드가 없어요'); return; }
    setSubmitting(true);
    const name = (() => { try { return localStorage.getItem('jp_name') || ''; } catch { return ''; } })();
    const dong = (() => { try { return localStorage.getItem('jp_dong') || ''; } catch { return ''; } })();
    const ho = (() => { try { return localStorage.getItem('jp_ho') || ''; } catch { return ''; } })();
    if (!name || !dong || !ho) { setErr('로그인 정보가 없어요. 처음부터 다시 시작해주세요.'); setSubmitting(false); return; }
    const res = await fetch('/api/bids', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round_id: round.id, cell_id: cell.id, dong, ho, name, amount }),
    });
    setSubmitting(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(d.error || '입찰 실패'); return; }
    go('complete', { spot, amount });
  };

  return (
    <JPScreen bg={C.white}>
      <div style={{ paddingTop: 52, padding: '52px 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <JPSpotBadge number={spot} size={40} />
          <div style={{ fontSize: 18, fontWeight: 600 }}>{spot} 구역</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: C.n100, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: C.n500 }}>현재 최고가</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{topBid ? topBid.toLocaleString() + '원' : '—'}</div>
          </div>
          <div style={{ flex: 1, background: C.n100, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: C.n500 }}>참여자</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{participants}명</div>
          </div>
        </div>

        <div style={{
          background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10,
          padding: '10px 12px', fontSize: 12, color: '#1E40AF', lineHeight: 1.5,
        }}>
          ℹ️ 최고가보다 <b>높은 금액</b>만 입찰할 수 있어요 (동점 방지).
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: C.n500 }}>입찰 금액</div>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 8,
            borderBottom: `2px solid ${isTooLow ? C.danger : C.primary}`,
          }}>
            <input value={amount ? amount.toLocaleString() : ''}
              onChange={e => setAmount(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
              style={{
                flex: 1, border: 0, outline: 'none', fontFamily: jpFont,
                fontSize: 36, fontWeight: 800, color: C.n900, background: 'transparent',
              }} />
            <div style={{ fontSize: 20, fontWeight: 600, color: C.n500, marginBottom: 4 }}>원</div>
          </div>
          {isTooLow && <div style={{ fontSize: 12, color: C.danger }}>현재 최고가보다 높은 금액을 입력해주세요</div>}
          {err && <div style={{ fontSize: 12, color: C.danger }}>{err}</div>}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[10000, 50000, 100000].map(d => (
            <button key={d} onClick={() => setAmount(amount + d)} style={{
              flex: 1, height: 44, background: C.n100, borderRadius: 12, border: 0,
              color: C.primary, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: jpFont,
            }}>+{(d / 10000).toLocaleString()}만</button>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 32, left: 20, right: 20 }}>
        <JPPrimaryButton label={submitting ? '입찰 중…' : '신청 확인'}
          disabled={isTooLow || amount === 0 || submitting}
          onClick={submit} />
      </div>
    </JPScreen>
  );
}

function BidCompleteScreen({ go, state }) {
  return (
    <JPScreen bg={C.white} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 16 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 48, background: C.successLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
        }}>🎉</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.n900 }}>접수됐어요!</div>
        <div style={{ fontSize: 14, color: C.n500, textAlign: 'center', lineHeight: 1.6 }}>
          <b style={{ color: C.primary }}>{state.lastSpot || 'A-23'}</b> 구역에 {' '}
          <b style={{ color: C.n900 }}>{(state.lastAmount || 160000).toLocaleString()}원</b>으로{'\n'}
          입찰 신청이 완료됐어요
        </div>
        <div style={{
          background: C.warningLight, borderRadius: 8, padding: '10px 14px',
          fontSize: 12, color: '#92400E', textAlign: 'center', marginTop: 12,
        }}>💡 마감일까지 더 높은 금액이 들어올 수 있어요</div>
      </div>
      <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <JPPrimaryButton label="내 신청 보기" onClick={() => go('bids')} />
        <JPSecondaryButton label="다른 구역 보기" onClick={() => go('list')} />
      </div>
    </JPScreen>
  );
}

// ─── MyBids ─────────────────────────────────────────────────────
function MyBidsScreen({ go }) {
  const [bids, setBids] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const myKey = React.useMemo(() => {
    try {
      const d = localStorage.getItem('jp_dong') || '';
      const h = localStorage.getItem('jp_ho') || '';
      return d && h ? { dong: d, ho: h } : null;
    } catch { return null; }
  }, []);

  const load = React.useCallback(async () => {
    if (!myKey) { setLoading(false); return; }
    try {
      const [rounds, cells] = await Promise.all([
        fetch('/api/rounds', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch('/api/cells', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      ]);
      const cellById = {};
      (Array.isArray(cells) ? cells : []).forEach(c => { cellById[c.id] = c; });
      const list = [];
      for (const r of (Array.isArray(rounds) ? rounds : [])) {
        const detail = await fetch(`/api/rounds/${r.id}`, { cache: 'no-store' }).then(x => x.ok ? x.json() : null);
        if (!detail) continue;
        const perCell = detail.per_cell || {};
        const myPerCell = {};
        (detail.bids || []).forEach(b => {
          if (b.dong !== myKey.dong || b.ho !== myKey.ho) return;
          const cur = myPerCell[b.cell_id];
          if (!cur || b.amount > cur.amount) myPerCell[b.cell_id] = b;
        });
        Object.values(myPerCell).forEach(b => {
          const entry = perCell[b.cell_id];
          const top = entry?.top?.amount || 0;
          const isTop = entry && entry.top.dong === b.dong && entry.top.ho === b.ho;
          let status = 'outbid';
          if (r.status === 'finalized' && isTop) status = 'confirmed';
          else if (isTop) status = 'leading';
          const c = cellById[b.cell_id];
          list.push({
            spot: c ? `${c.row}-${c.n}` : b.cell_id,
            amount: b.amount,
            date: String(b.created_at || '').slice(0, 10),
            status,
            top,
            roundId: r.id,
          });
        });
      }
      list.sort((a, b) => (a.date < b.date ? 1 : -1));
      setBids(list);
    } catch {}
    setLoading(false);
  }, [myKey]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <JPScreen>
      <JPHeader title="내 신청" />
      {!loading && bids.length === 0 && (
        <div style={{ padding: '40px 20px' }}>
          <JPEmptyState emoji="📋" message={"아직 신청한 구역이 없어요."} ctaLabel="구역 보러가기" onCta={() => go('list')} />
        </div>
      )}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>
        {bids.map((b, i) => (
          <div key={i} onClick={() => go('detail', { spot: b.spot })} style={{
            background: C.white, borderRadius: 12, padding: 16, cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <JPSpotBadge number={b.spot} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{b.spot} 구역</div>
                <div style={{ fontSize: 12, color: C.n400, marginTop: 1 }}>{b.date}</div>
              </div>
              {b.status === 'leading' && (
                <span style={{ padding: '4px 10px', background: C.primaryLight, color: C.primary, fontSize: 12, fontWeight: 700, borderRadius: 12 }}>🏆 1위</span>
              )}
              {b.status === 'outbid' && (
                <span style={{ padding: '4px 10px', background: C.n100, color: C.n500, fontSize: 12, fontWeight: 600, borderRadius: 12 }}>순위 밖</span>
              )}
              {b.status === 'confirmed' && (
                <span style={{ padding: '4px 10px', background: C.successLight, color: C.success, fontSize: 12, fontWeight: 700, borderRadius: 12 }}>확정 🎉</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.n100}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.n500 }}>내 입찰가</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginTop: 2 }}>{b.amount.toLocaleString()}원</div>
              </div>
              {b.top && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.n500 }}>현재 최고가</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.n900, marginTop: 2 }}>{b.top.toLocaleString()}원</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </JPScreen>
  );
}

// ─── MySpotCert ─────────────────────────────────────────────────
function MySpotCertScreen({ go }) {
  const [cert, setCert] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const creds = React.useMemo(() => {
    try {
      return {
        dong: localStorage.getItem('jp_dong') || '',
        ho: localStorage.getItem('jp_ho') || '',
        name: localStorage.getItem('jp_name') || '',
        plate: localStorage.getItem('jp_plate') || '',
        complexName: localStorage.getItem('jp_complex_name') || '오금현대',
      };
    } catch { return { dong: '', ho: '', name: '', plate: '', complexName: '오금현대' }; }
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
      const finalized = (Array.isArray(rounds) ? rounds : []).filter(r => r.status === 'finalized');
      for (const r of finalized) {
        const detail = await fetch(`/api/rounds/${r.id}`, { cache: 'no-store' }).then(x => x.ok ? x.json() : null);
        const perCell = detail?.per_cell || {};
        for (const [cid, e] of Object.entries(perCell)) {
          if (e.top.dong === creds.dong && e.top.ho === creds.ho) {
            const c = cellById[cid];
            setCert({
              spot: c ? `${c.row}-${c.n}` : cid,
              amount: e.top.amount,
              contractStart: r.contract_start,
              contractEnd: r.contract_end,
            });
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
      <JPScreen>
        <JPHeader title="내 구역" />
        <div style={{ padding: 40, textAlign: 'center', color: C.n500, fontSize: 13 }}>불러오는 중…</div>
      </JPScreen>
    );
  }

  if (!cert) {
    return (
      <JPScreen>
        <JPHeader title="내 구역" />
        <div style={{ padding: '40px 20px' }}>
          <JPEmptyState emoji="🎫" message={"아직 확정된 구역이 없어요.\n입찰에 참여해보세요!"} ctaLabel="구역 보러가기" onCta={() => go && go('list')} />
        </div>
      </JPScreen>
    );
  }

  const months = (() => {
    if (!cert.contractStart || !cert.contractEnd) return null;
    const s = new Date(cert.contractStart), e = new Date(cert.contractEnd);
    return Math.max(1, Math.round((e - s) / (30 * 86400000)));
  })();
  const periodStr = cert.contractStart && cert.contractEnd
    ? `${months ? months + '개월 · ' : ''}${cert.contractStart} ~ ${cert.contractEnd}`
    : '—';

  return (
    <JPScreen>
      <JPHeader title="내 구역" />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', minHeight: 'calc(100% - 120px)' }}>
        <div style={{
          borderRadius: 16, padding: 24,
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          boxShadow: '0 8px 16px rgba(59,130,246,0.3)', color: C.white,
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>자리픽</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>주차 구역 권리증</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>주차 구역</div>
            <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' }}>{cert.spot}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>계약 기간</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{periodStr}</div></div>
            <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>확정 금액</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{cert.amount.toLocaleString()}원</div></div>
            <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>차량 번호</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{creds.plate || '—'}</div></div>
            <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>단지/동호수</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{creds.complexName} {creds.dong}동 {creds.ho}호</div></div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.n500, textAlign: 'center' }}>
          이 권리증은 주차 구역 사용권을 증명합니다.
        </div>
      </div>
    </JPScreen>
  );
}

// ─── SpotDetail ─────────────────────────────────────────────────
function SpotDetailScreen({ go, state }) {
  const spot = state.currentSpot || 'A-23';
  const [photoUrl, setPhotoUrl] = React.useState(null);
  const [cell, setCell] = React.useState(null);
  const [round, setRound] = React.useState(null);
  const [entry, setEntry] = React.useState(null);
  const [myBid, setMyBid] = React.useState(null);
  const [dday, setDday] = React.useState(null);

  const myKey = React.useMemo(() => {
    try {
      const d = localStorage.getItem('jp_dong') || '';
      const h = localStorage.getItem('jp_ho') || '';
      return d && h ? { dong: d, ho: h } : null;
    } catch { return null; }
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const [cells, rounds] = await Promise.all([
        fetch('/api/cells', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch('/api/rounds?status=live', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
      ]);
      if (!alive) return;
      const cs = Array.isArray(cells) ? cells : [];
      const hit = cs.find(c => `${c.row}-${c.n}` === spot || c.n === spot) || null;
      setCell(hit);
      setPhotoUrl(hit && hit.photo_url ? hit.photo_url : null);
      const live = Array.isArray(rounds) && rounds.length ? rounds[0] : null;
      setRound(live);
      if (live && live.bid_end) {
        const ms = new Date(live.bid_end).getTime() - Date.now();
        setDday(Math.max(0, Math.ceil(ms / 86400000)));
      }
      if (live && hit) {
        const detail = await fetch(`/api/rounds/${live.id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
        if (!alive) return;
        const e = detail?.per_cell?.[hit.id] || null;
        setEntry(e);
        if (myKey && e) {
          const mine = e.all.filter(b => b.dong === myKey.dong && b.ho === myKey.ho);
          if (mine.length) setMyBid(mine.reduce((a, b) => (a.amount > b.amount ? a : b)));
        }
      }
    })();
    return () => { alive = false; };
  }, [spot, myKey]);

  const topAmount = entry?.top?.amount || 0;
  const participants = entry?.all ? new Set(entry.all.map(b => `${b.dong}-${b.ho}`)).size : 0;
  const isLeading = !!(myBid && entry && entry.top.dong === myBid.dong && entry.top.ho === myBid.ho);

  return (
    <JPScreen>
      <JPHeader
        title={`${spot} 구역`}
        left={<button onClick={() => go('list')} style={{
          background: 'transparent', border: 0, fontSize: 24, cursor: 'pointer',
          padding: 0, color: C.n700, lineHeight: 1,
        }}>‹</button>}
      />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {photoUrl ? (
          <img src={photoUrl} alt={`${spot} 구역`} style={{
            width: '100%', height: 200, objectFit: 'cover', borderRadius: 12,
          }} />
        ) : (
          <div style={{
            background: C.n100, borderRadius: 12, height: 160,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48,
          }}>🅿️</div>
        )}

        {myBid && (
          <div style={{ background: isLeading ? C.primary : C.n900, color: C.white, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{isLeading ? '🏆 현재 1위예요!' : '순위 밖이에요'}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{myBid.amount.toLocaleString()}원</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>내 입찰가</div>
          </div>
        )}

        <div style={{ background: C.white, borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>입찰 정보</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.n500 }}>참여자</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{participants}명</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.n500 }}>최고가</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: C.primary }}>{topAmount ? topAmount.toLocaleString() + '원' : '—'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.n500 }}>마감</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{dday != null ? `D-${dday}` : '—'}</div>
            </div>
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>구역 정보</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n500 }}>위치</span><span>지상 A동 옆</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n500 }}>유형</span><span>일반형 (2.5m × 5m)</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n500 }}>계약 기간</span><span>{round && round.contract_start && round.contract_end ? `${round.contract_start} ~ ${round.contract_end}` : '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n500 }}>결제</span><span>관리비 합산</span></div>
          </div>
        </div>

        <div style={{
          background: C.warningLight, borderRadius: 10, padding: '10px 12px',
          fontSize: 12, color: '#92400E', lineHeight: 1.5,
        }}>
          ⚠️ 세대당 권리증은 <b>1개</b>예요. 이미 다른 구역을 신청했다면 기존 입찰을 취소한 뒤에 신청해주세요.
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 32, left: 20, right: 20 }}>
        <JPPrimaryButton label={myBid ? '재입찰 하기' : '입찰하기'} onClick={() => go('bid', { spot })} />
      </div>
    </JPScreen>
  );
}

Object.assign(window, {
  SpotListScreen, BidScreen, BidCompleteScreen, MyBidsScreen, MySpotCertScreen, SpotDetailScreen,
});
