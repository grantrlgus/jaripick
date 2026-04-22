// Layout Editor — real Naver Maps tile, with spot pins overlaid.
// Starts empty: no spots. Admin clicks "+ 구역 추가" then taps on the map
// to drop a new marker at that location. Each pin can be selected, dragged,
// typed (일반/EV/장애인/방문객/제외), numbered, or deleted.

function LayoutEditorPage() {
  const TYPES = {
    general:  { label: '입찰 대상',   fill: '#DBEAFE', border: '#3B82F6', text: '#1E3A8A' },
  };

  // State
  const [cells, setCells] = React.useState([]);
  const [sel, setSel] = React.useState(null);
  const [tab, setTab] = React.useState('list');
  const [rowFilter, setRowFilter] = React.useState('all');
  const [addMode, setAddMode] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [mapReady, setMapReady] = React.useState(false);

  // Load cells from server on mount
  React.useEffect(() => {
    fetch('/api/cells')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCells(data); })
      .catch(() => {});
  }, []);

  // Naver Map refs
  const mapDivRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef({});   // id -> naver.maps.Marker
  const naverReady = React.useRef(false);

  // Track dynamic state via refs so Naver event handlers always read latest
  const addModeRef = React.useRef(addMode);
  const cellsRef = React.useRef(cells);
  const selRef = React.useRef(sel);
  const typesRef = React.useRef(TYPES);
  React.useEffect(() => { addModeRef.current = addMode; }, [addMode]);
  React.useEffect(() => { cellsRef.current = cells; }, [cells]);
  React.useEffect(() => { selRef.current = sel; }, [sel]);

  // 오금현대 center (송파구 오금로 223)
  const CENTER = { lat: 37.5058, lng: 127.1254 };

  // Load Naver Maps script (once)
  React.useEffect(() => {
    if (window.naver && window.naver.maps) {
      naverReady.current = true;
      initMap();
      return;
    }
    const existing = document.querySelector('script[data-naver-maps]');
    if (existing) {
      existing.addEventListener('load', () => { naverReady.current = true; initMap(); });
      return;
    }
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=qxze9eualp&submodules=geocoder';
    s.async = true;
    s.setAttribute('data-naver-maps', '');
    s.onload = () => { naverReady.current = true; initMap(); };
    s.onerror = () => { console.warn('Naver Maps SDK failed to load'); };
    document.head.appendChild(s);
  }, []);

  // Initialize map once SDK loaded
  const initMap = () => {
    if (!window.naver || !window.naver.maps) return;
    if (mapRef.current) return;
    if (!mapDivRef.current) return;
    const { naver } = window;
    const map = new naver.maps.Map(mapDivRef.current, {
      center: new naver.maps.LatLng(CENTER.lat, CENTER.lng),
      zoom: 17,
      minZoom: 15,
      maxZoom: 21,
      mapTypeControl: false,
      mapDataControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.RIGHT_BOTTOM,
        style: naver.maps.ZoomControlStyle.SMALL,
      },
      scaleControl: false,
      logoControl: true,
    });
    mapRef.current = map;
    setMapReady(true);

    // Click handler: when in add-mode, drop a new spot at clicked lat/lng
    naver.maps.Event.addListener(map, 'click', (e) => {
      if (!addModeRef.current) return;
      const lat = e.coord.lat();
      const lng = e.coord.lng();
      dropSpot(lat, lng);
    });
  };

  // Create a Naver marker HTML element matching a spot's type
  const buildMarkerIcon = (cell, isSel) => {
    const meta = TYPES[cell.type] || TYPES.general;
    const bg = isSel ? meta.border : meta.fill;
    const fg = isSel ? '#fff' : meta.text;
    const rot = cell.rot || 0;
    return {
      content: `
        <div style="
          transform:rotate(${rot}deg);
          transform-origin:center center;
          background:${bg};
          color:${fg};
          border:1.5px solid ${meta.border};
          border-radius:6px;
          padding:3px 8px;
          font-size:11px;
          font-weight:700;
          font-family:'Pretendard',system-ui,sans-serif;
          white-space:nowrap;
          box-shadow:${isSel ? '0 2px 8px rgba(0,0,0,0.28)' : '0 1px 2px rgba(0,0,0,0.12)'};
          cursor:grab;
          user-select:none;
        ">${cell.n}</div>
      `,
      anchor: new window.naver.maps.Point(18, 12),
    };
  };

  // Sync markers whenever cells/sel change
  React.useEffect(() => {
    if (!mapRef.current || !window.naver) return;
    const { naver } = window;
    const map = mapRef.current;
    const existing = markersRef.current;

    // Remove markers that no longer exist
    Object.keys(existing).forEach(id => {
      if (!cells.find(c => c.id === id)) {
        existing[id].setMap(null);
        delete existing[id];
      }
    });

    // Add/update markers for each cell
    cells.forEach(cell => {
      const isSel = cell.id === sel;
      if (existing[cell.id]) {
        const m = existing[cell.id];
        m.setIcon(buildMarkerIcon(cell, isSel));
        m.setPosition(new naver.maps.LatLng(cell.lat, cell.lng));
      } else {
        const m = new naver.maps.Marker({
          position: new naver.maps.LatLng(cell.lat, cell.lng),
          map,
          icon: buildMarkerIcon(cell, isSel),
          draggable: true,
        });
        naver.maps.Event.addListener(m, 'click', () => {
          setSel(cell.id);
          setTab('info');
        });
        naver.maps.Event.addListener(m, 'dragend', (e) => {
          const pos = m.getPosition();
          updateCell(cell.id, { lat: pos.lat(), lng: pos.lng() });
        });
        existing[cell.id] = m;
      }
    });
  }, [cells, sel, mapReady]);

  // Actions
  const nextName = () => {
    // A-01, A-02, ...
    const used = new Set(cellsRef.current.map(c => c.n));
    for (let i = 1; i < 1000; i++) {
      const n = `A-${String(i).padStart(2, '0')}`;
      if (!used.has(n)) return n;
    }
    return 'X-' + Date.now();
  };

  const dropSpot = (lat, lng) => {
    const id = 'c' + Date.now() + Math.floor(Math.random() * 1000);
    const name = nextName();
    const row = name.split('-')[0];
    const newCell = { id, n: name, row, lat, lng, type: 'general', rot: 0 };
    setCells(cs => [...cs, newCell]);
    setSel(id);
    setTab('info');
    setAddMode(false);
  };

  const updateCell = (id, patch) => {
    setCells(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const deleteCell = (id) => {
    setCells(cs => cs.filter(c => c.id !== id));
    if (sel === id) setSel(null);
  };

  const saveCells = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/cells', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cells),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      setSavedAt(new Date());
    } catch (e) {
      alert('저장에 실패했습니다: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const exportCells = () => {
    const data = JSON.stringify(cells, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jaripick-cells-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selected = cells.find(c => c.id === sel);

  // Row filter
  const rows = Array.from(new Set(cells.map(c => c.row))).sort();
  const visible = rowFilter === 'all' ? cells : cells.filter(c => c.row === rowFilter);

  const counts = {};
  cells.forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; });

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <h1 className="title" style={{ marginBottom: 0 }}>구역 설정</h1>
        <div className="row" style={{ alignItems: 'center', gap: 10 }}>
          {savedAt && (
            <span className="muted" style={{ fontSize: 12 }}>
              {savedAt.getHours().toString().padStart(2,'0')}:{savedAt.getMinutes().toString().padStart(2,'0')} 저장됨
            </span>
          )}
          <button className="btn btn-outline" disabled={cells.length === 0} onClick={exportCells}>내보내기</button>
          <button className="btn btn-primary" disabled={cells.length === 0 || saving} onClick={saveCells}>{saving ? '저장 중…' : '저장'}</button>
        </div>
      </div>

      {/* Main 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'flex-start' }}>

        {/* ── Map canvas ─────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', height: 'calc(100vh - 140px)', minHeight: 620 }}>
          <div
            ref={mapDivRef}
            style={{ position: 'absolute', inset: 0, cursor: addMode ? 'crosshair' : 'grab' }}
          />

          {/* Overlay: edit mode banner */}
          {addMode && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: '#FEF3C7', color: '#78350F',
              border: '1px solid #FCD34D',
              padding: '8px 12px', borderRadius: 6,
              fontSize: 12, fontWeight: 700,
              display: 'flex', gap: 8, alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              zIndex: 20,
            }}>
              📍 지도를 클릭해 구역을 추가하세요
              <button
                onClick={() => setAddMode(false)}
                style={{
                  marginLeft: 6, border: 0, background: '#78350F', color: '#fff',
                  padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >취소</button>
            </div>
          )}

          {/* Overlay: top-right controls */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            display: 'flex', gap: 6, zIndex: 10,
          }}>
            <button
              className={addMode ? 'btn btn-outline' : 'btn btn-primary'}
              style={{ height: 34, fontSize: 12, padding: '0 14px' }}
              onClick={() => setAddMode(a => !a)}
            >{addMode ? '취소' : '+ 구역 추가'}</button>
          </div>
        </div>

        {/* ── Right panel ──────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--n100)' }}>
            {[
              { k: 'info',    l: '정보' },
              { k: 'list',    l: '목록' },
              { k: 'history', l: '기록' },
            ].map(t => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                style={{
                  flex: 1, padding: '12px 0', border: 0,
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontWeight: tab === t.k ? 700 : 500,
                  color: tab === t.k ? 'var(--primary)' : 'var(--n500)',
                  borderBottom: tab === t.k ? '2px solid var(--primary)' : '2px solid transparent',
                  fontFamily: 'inherit',
                }}
              >{t.l}</button>
            ))}
          </div>

          {tab === 'list' && (
            <div>
              <div style={{ padding: '10px 12px 6px', display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setRowFilter('all')}
                  style={chipStyle(rowFilter === 'all')}
                >전체</button>
                {rows.map(r => (
                  <button
                    key={r}
                    onClick={() => setRowFilter(r)}
                    style={chipStyle(rowFilter === r)}
                  >{r}</button>
                ))}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--n500)' }}>{visible.length}칸</span>
              </div>

              {visible.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center' }} className="muted">
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
                  <div style={{ fontSize: 13 }}>등록된 구역이 없어요</div>
                </div>
              ) : (
                <div style={{
                  padding: '4px 12px 12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 6,
                  maxHeight: 360,
                  overflowY: 'auto',
                }}>
                  {visible.map(c => {
                    const meta = TYPES[c.type] || TYPES.general;
                    const isSel = c.id === sel;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSel(c.id); panTo(mapRef.current, c.lat, c.lng); }}
                        style={{
                          padding: '6px 0',
                          border: `1.5px solid ${meta.border}`,
                          background: isSel ? meta.border : meta.fill,
                          color: isSel ? '#fff' : meta.text,
                          borderRadius: 6, cursor: 'pointer',
                          fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                        }}
                      >{c.n}</button>
                    );
                  })}
                </div>
              )}

              {cells.length > 0 && (
                <div style={{
                  padding: '10px 12px', fontSize: 11, color: 'var(--n500)',
                  borderTop: '1px solid var(--n100)',
                  lineHeight: 1.6,
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(TYPES).map(([k, m]) => (
                      <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, background: m.border, borderRadius: 2 }} />
                        <span style={{ color: m.text }}>{m.label}</span>
                        <span style={{ color: 'var(--n400)' }}>{counts[k]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'info' && selected && (
            <div style={{ padding: 16 }} className="stack">
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{selected.n}</div>
                {(() => { const m = TYPES[selected.type] || TYPES.general; return (
                <span className="badge" style={{
                  background: m.fill, color: m.text, border: `1px solid ${m.border}`,
                }}>{m.label}</span>
                ); })()}
              </div>

              <div>
                <label className="label">구역 번호</label>
                <input
                  className="input"
                  value={selected.n}
                  onChange={(e) => {
                    const n = e.target.value;
                    const row = (n.split('-')[0] || 'X').toUpperCase();
                    updateCell(selected.id, { n, row });
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="label" style={{ margin: 0 }}>회전</label>
                  <span className="muted" style={{ fontSize: 12, fontFamily: 'monospace' }}>{selected.rot || 0}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  step="1"
                  value={selected.rot || 0}
                  onChange={(e) => updateCell(selected.id, { rot: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {[0, 45, 90, 135].map(deg => (
                    <button
                      key={deg}
                      onClick={() => updateCell(selected.id, { rot: deg })}
                      style={{
                        flex: 1, height: 28,
                        border: '1px solid var(--n200)',
                        background: (selected.rot || 0) === deg ? 'var(--primary)' : '#fff',
                        color: (selected.rot || 0) === deg ? '#fff' : 'var(--n700)',
                        borderRadius: 6, cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                      }}
                    >{deg}°</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">좌표</label>
                <div className="muted" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                  {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  지도에서 핀을 드래그해 위치를 옮길 수 있어요.
                </div>
              </div>

              <button
                onClick={() => deleteCell(selected.id)}
                className="btn btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', height: 36, fontSize: 12 }}
              >이 구역 삭제</button>
            </div>
          )}

          {tab === 'info' && !selected && (
            <div style={{ padding: 28, textAlign: 'center' }} className="muted">
              <div style={{ fontSize: 28, marginBottom: 6 }}>👆</div>
              <div style={{ fontSize: 13 }}>지도에서 구역을 선택하세요</div>
            </div>
          )}

          {tab === 'history' && (
            <div style={{ padding: 16 }} className="stack">
              {cells.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center' }} className="muted">
                  <div style={{ fontSize: 13 }}>변경 이력이 없어요</div>
                </div>
              ) : (
                <div className="muted" style={{ fontSize: 13 }}>
                  최근 편집 내역이 여기에 표시됩니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function chipStyle(active) {
  return {
    height: 28, minWidth: 34, padding: '0 10px',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--n200)'}`,
    background: active ? 'var(--primary)' : '#fff',
    color: active ? '#fff' : 'var(--n700)',
    borderRadius: 6, cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
  };
}

function panTo(map, lat, lng) {
  if (!map || !window.naver) return;
  map.panTo(new window.naver.maps.LatLng(lat, lng));
}

Object.assign(window, { LayoutEditorPage });
