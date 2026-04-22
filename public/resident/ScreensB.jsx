// More screens: SpotList, SpotDetail, Bid, BidComplete, MyBids, Cert

function JPNaverMap({ go }) {
  const divRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const [cells, setCells] = React.useState([]);
  const [mapReady, setMapReady] = React.useState(false);
  const [picked, setPicked] = React.useState(null);

  const CENTER = { lat: 37.5058, lng: 127.1254 };

  const refetch = React.useCallback(() => {
    fetch('/api/cells', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCells(data.filter(c => c.active !== false)); })
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
        zoomControl: true,
        zoomControlOptions: { position: naver.maps.Position.RIGHT_BOTTOM, style: naver.maps.ZoomControlStyle.SMALL },
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
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cell.lat, cell.lng),
        map,
        icon: {
          content: `<div style="
            transform:rotate(${rot}deg);transform-origin:center center;
            background:#DBEAFE;color:#1E3A8A;border:1.5px solid #3B82F6;
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
  }, [cells, mapReady]);

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
                <div style={{ fontSize: 15, fontWeight: 700, color: C.n900 }}>{picked.row}구역 {picked.n}번</div>
                <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>입찰 대상</div>
              </div>
              <JPDdayBadge days={3} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: C.n50 || '#F9FAFB', borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 11, color: C.n500 }}>현재 최고가</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.n900, marginTop: 2 }}>160,000<span style={{ fontSize: 11, fontWeight: 500, color: C.n500 }}>원</span></div>
              </div>
              <div style={{ flex: 1, background: C.n50 || '#F9FAFB', borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 11, color: C.n500 }}>입찰자</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.n900, marginTop: 2 }}>3<span style={{ fontSize: 11, fontWeight: 500, color: C.n500 }}>명</span></div>
              </div>
            </div>
            <button onClick={() => { const code = `${picked.row}-${picked.n}`; setPicked(null); go && go('detail', { spot: code }); }} style={{
              width: '100%', padding: '12px 0', border: 0, borderRadius: 10,
              background: C.primary, color: C.white, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: jpFont,
            }}>입찰하기</button>
            <div style={{ textAlign: 'center', fontSize: 10, color: C.n400, marginTop: 8 }}>※ 금액·입찰자 수는 예시입니다</div>
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
          { c: C.white, b: C.n200, l: '신청 가능' },
          { c: C.successLight, b: C.success, l: '내가 신청' },
          { c: C.primaryLight, b: C.primary, l: '내가 1위' },
          { c: C.n100, b: C.n200, l: '마감' },
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
  const [amount, setAmount] = React.useState(160000);
  const topBid = 150000;
  const isTooLow = amount > 0 && amount <= topBid;
  const spot = state.currentSpot || 'A-23';

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
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{topBid.toLocaleString()}원</div>
          </div>
          <div style={{ flex: 1, background: C.n100, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: C.n500 }}>참여자</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>3명</div>
          </div>
        </div>

        <div style={{
          background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10,
          padding: '10px 12px', fontSize: 12, color: '#1E40AF', lineHeight: 1.5,
        }}>
          ℹ️ 최고가보다 <b>높은 금액</b>만 입찰할 수 있어요 (동점 방지).<br/>
          세대당 권리증은 1개 — 새로 입찰하면 기존 입찰은 자동 취소돼요.
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
        <JPPrimaryButton label="신청 확인"
          disabled={isTooLow || amount === 0}
          onClick={() => go('complete', { spot, amount })} />
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
  const bids = [
    { spot: 'A-23', amount: 160000, date: '2026-04-18', status: 'leading', top: 160000 },
    { spot: 'B-07', amount: 120000, date: '2026-04-17', status: 'outbid', top: 140000 },
    { spot: 'A-12', amount: 90000, date: '2026-04-15', status: 'confirmed' },
  ];
  return (
    <JPScreen>
      <JPHeader title="내 신청" />
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
function MySpotCertScreen() {
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
            <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' }}>A-23</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>계약 기간</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>3개월 · 2026-05-01 ~ 07-31</div></div>
            <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>확정 금액</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>180,000원</div></div>
            <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>차량 번호</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>12가 3456</div></div>
            <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>단지/동호수</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>오금현대 101동 1201호</div></div>
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
  React.useEffect(() => {
    let alive = true;
    fetch('/api/cells', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(cells => {
        if (!alive || !Array.isArray(cells)) return;
        const hit = cells.find(c => c.n === spot);
        setPhotoUrl(hit && hit.photo_url ? hit.photo_url : null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [spot]);
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

        <div style={{ background: C.primary, color: C.white, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>🏆 현재 1위예요!</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>160,000원</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>내 입찰가</div>
        </div>

        <div style={{ background: C.white, borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>입찰 정보</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.n500 }}>참여자</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>3명</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.n500 }}>최고가</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: C.primary }}>160,000원</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.n500 }}>마감</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>D-3</div>
            </div>
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>구역 정보</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n500 }}>위치</span><span>지상 A동 옆</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n500 }}>유형</span><span>일반형 (2.5m × 5m)</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n500 }}>계약 기간</span><span>3개월 (2026-05-01 ~ 07-31)</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n500 }}>결제</span><span>관리비 합산 · 3개월 분할</span></div>
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
        <JPPrimaryButton label="재입찰 하기" onClick={() => go('bid', { spot })} />
      </div>
    </JPScreen>
  );
}

Object.assign(window, {
  SpotListScreen, BidScreen, BidCompleteScreen, MyBidsScreen, MySpotCertScreen, SpotDetailScreen,
});
