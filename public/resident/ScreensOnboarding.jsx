// Onboarding + gap screens: Splash, ComplexRegister, Pending, PhoneAuth, Vehicle

function SplashScreen({ go }) {
  React.useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      let next = 'login';
      try {
        const session = await window.jp.auth.getSession();
        if (session) {
          let hasProfile = false;
          try {
            hasProfile = !!(localStorage.getItem('jp_dong') && localStorage.getItem('jp_ho'));
          } catch {}
          next = hasProfile ? 'home' : 'complex_register';
        }
      } catch {}
      if (!cancelled) go(next);
    }, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);
  return (
    <JPScreen bg={C.primary} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 92, height: 92, borderRadius: 46, background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
        }}>🅿️</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: C.white, letterSpacing: '-0.5px' }}>자리픽</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>로딩 중...</div>
      </div>
    </JPScreen>
  );
}

function PhoneAuthScreen({ go }) {
  const [step, setStep] = React.useState(1);
  const [phone, setPhone] = React.useState('010-1234-5678');
  const [code, setCode] = React.useState('');
  return (
    <JPScreen bg={C.white}>
      <div style={{ padding: '64px 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button onClick={() => go('login')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, alignSelf: 'flex-start', cursor: 'pointer', color: C.n700 }}>‹</button>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>
            본인 인증을<br/>진행해주세요
          </div>
          <div style={{ fontSize: 13, color: C.n500, marginTop: 8 }}>
            세대 중복 가입을 막기 위해 휴대폰 번호를 확인해요
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.n500, marginBottom: 6 }}>휴대폰 번호</div>
          <input value={phone} onChange={e => setPhone(e.target.value)}
            style={{
              width: '100%', height: 52, border: `1.5px solid ${C.n200}`, borderRadius: 12,
              padding: '0 14px', fontSize: 16, fontFamily: jpFont, outline: 'none',
              background: step === 2 ? C.n50 : C.white, color: step === 2 ? C.n500 : C.n900,
            }} disabled={step === 2} />
        </div>

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: C.n500 }}>인증번호 6자리</div>
              <div style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>2:58</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{
                  flex: 1, height: 52, border: `1.5px solid ${C.primary}`, borderRadius: 12,
                  padding: '0 14px', fontSize: 20, fontWeight: 700, fontFamily: jpFont, outline: 'none',
                  letterSpacing: 4, textAlign: 'center',
                }} />
              <button style={{
                width: 84, height: 52, borderRadius: 12, border: `1.5px solid ${C.n200}`,
                background: C.white, color: C.n700, fontSize: 13, fontWeight: 600, fontFamily: jpFont,
                cursor: 'pointer',
              }}>재전송</button>
            </div>
            <div style={{ fontSize: 12, color: C.n400, marginTop: 8 }}>
              인증번호가 문자로 전송됐어요
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 32, left: 20, right: 20 }}>
        {step === 1 ? (
          <JPPrimaryButton label="인증번호 받기" onClick={() => setStep(2)} />
        ) : (
          <JPPrimaryButton label="확인" disabled={code.length !== 6}
            onClick={() => go('complex_register')} />
        )}
      </div>
    </JPScreen>
  );
}

function ComplexRegisterScreen({ go }) {
  const [dong, setDong] = React.useState('');
  const [ho, setHo] = React.useState('');
  const [name, setName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [picked, setPicked] = React.useState(null); // { slug, name, address }
  const searchInputRef = React.useRef(null);

  // Auto-focus search on mount so user knows to type
  React.useEffect(() => {
    if (!picked) {
      const t = setTimeout(() => { try { searchInputRef.current?.focus(); } catch {} }, 150);
      return () => clearTimeout(t);
    }
  }, [picked]);

  // Debounced search against /api/apartments/search
  React.useEffect(() => {
    if (picked) return;
    const q = query.trim();
    if (!q) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/apartments/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
        const d = r.ok ? await r.json() : [];
        setResults(Array.isArray(d) ? d : []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query, picked]);

  const submit = async () => {
    if (!picked) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch('/api/residents/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complex: picked.slug, dong, ho, name }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.request_id) {
        try {
          localStorage.setItem('jp_request_id', d.request_id);
          localStorage.setItem('jp_dong', dong);
          localStorage.setItem('jp_ho', ho);
          localStorage.setItem('jp_name', name);
          localStorage.setItem('jp_complex_name', picked.name);
          localStorage.setItem('jp_complex_slug', picked.slug);
        } catch {}
      }
      if (d.status === 'approved') {
        go('home');
      } else {
        go('pending');
      }
    } catch (e) {
      go('pending');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <JPScreen bg={C.white}>
      <div style={{ padding: '64px 20px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <button onClick={() => picked ? setPicked(null) : go('login')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, alignSelf: 'flex-start', cursor: 'pointer', color: C.n700 }}>‹</button>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>
            거주 중인 단지를<br/>알려주세요
          </div>
          <div style={{ fontSize: 13, color: C.n500, marginTop: 8 }}>
            관리자 승인 후 입찰에 참여할 수 있어요
          </div>
        </div>

        {!picked && (
          <>
            <div style={{
              height: 46, background: C.n100, borderRadius: 12, display: 'flex', alignItems: 'center',
              padding: '0 14px', gap: 8,
            }}>
              <span style={{ fontSize: 14, color: C.n500 }}>🔍</span>
              <input
                ref={searchInputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="아파트 이름을 입력하세요"
                style={{
                  flex: 1, height: '100%', border: 0, background: 'transparent',
                  outline: 'none', fontSize: 14, color: C.n900, fontFamily: jpFont,
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{
                  background: 'transparent', border: 0, fontSize: 16, color: C.n400, cursor: 'pointer', padding: 0,
                }}>✕</button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
              {!query.trim() && (
                <div style={{ padding: '32px 12px', textAlign: 'center', color: C.n400, fontSize: 13 }}>
                  아파트 이름을 검색해주세요<br/>
                  <span style={{ fontSize: 11, color: C.n400 }}>예: 오금현대, 래미안, 헬리오시티</span>
                </div>
              )}
              {query.trim() && searching && (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: C.n400, fontSize: 13 }}>검색 중…</div>
              )}
              {query.trim() && !searching && results.length === 0 && (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: C.n400, fontSize: 13 }}>검색 결과가 없어요</div>
              )}
              {!searching && results.map(c => (
                <div key={c.slug} onClick={() => setPicked(c)} style={{
                  background: C.white,
                  border: `1.5px solid ${C.n200}`,
                  borderRadius: 12, padding: 14, cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.n900 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>{c.address}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {picked && (
          <>
            <div style={{
              background: C.primaryLight,
              border: `1.5px solid ${C.primary}`,
              borderRadius: 12, padding: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{picked.name}</div>
                <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>{picked.address}</div>
              </div>
              <button onClick={() => setPicked(null)} style={{
                background: 'transparent', border: 0, fontSize: 12, color: C.primary,
                cursor: 'pointer', fontWeight: 600, padding: 0,
              }}>변경</button>
            </div>

            <div style={{ height: 1, background: C.n100, margin: '4px 0' }} />

            <div>
              <div style={{ fontSize: 12, color: C.n500, marginBottom: 6 }}>동 / 호수</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={dong} onChange={e => setDong(e.target.value)} placeholder="동"
                  style={{ flex: 1, height: 48, border: `1.5px solid ${C.n200}`, borderRadius: 12, padding: '0 14px', fontSize: 15, fontFamily: jpFont, outline: 'none' }} />
                <input value={ho} onChange={e => setHo(e.target.value)} placeholder="호"
                  style={{ flex: 1, height: 48, border: `1.5px solid ${C.n200}`, borderRadius: 12, padding: '0 14px', fontSize: 15, fontFamily: jpFont, outline: 'none' }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.n500, marginBottom: 6 }}>이름</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="세대주 이름"
                style={{ width: '100%', height: 48, border: `1.5px solid ${C.n200}`, borderRadius: 12, padding: '0 14px', fontSize: 15, fontFamily: jpFont, outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ fontSize: 11, color: C.n400, marginTop: 6 }}>
                관리자가 등록한 명단과 일치하면 즉시 승인돼요
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: C.warningLight || '#FEF3C7', color: '#92400E', borderRadius: 8, fontSize: 12 }}>{error}</div>
            )}
          </>
        )}
      </div>

      {picked && (
        <div style={{ position: 'absolute', bottom: 32, left: 20, right: 20 }}>
          <JPPrimaryButton label={submitting ? '확인 중…' : '승인 요청하기'} disabled={!dong || !ho || !name || submitting} onClick={submit} />
        </div>
      )}
    </JPScreen>
  );
}

function VehicleScreen({ go }) {
  const [plate, setPlate] = React.useState('12가 3456');
  const [size, setSize] = React.useState('compact');
  const [ev, setEv] = React.useState(false);
  const sizes = [
    { k: 'compact',  l: '소형' },
    { k: 'mid',      l: '중형' },
    { k: 'large',    l: '대형' },
    { k: 'suv',      l: 'SUV' },
  ];
  return (
    <JPScreen bg={C.white}>
      <div style={{ padding: '64px 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button onClick={() => go('complex_register')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, alignSelf: 'flex-start', cursor: 'pointer', color: C.n700 }}>‹</button>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>
            차량 정보를<br/>등록해주세요
          </div>
          <div style={{ fontSize: 13, color: C.n500, marginTop: 8 }}>
            배정 후 권리증에 표시되고, 관리자가 확인해요
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.n500, marginBottom: 6 }}>차량 번호</div>
          <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="12가 3456"
            style={{
              width: '100%', height: 52, border: `1.5px solid ${C.n200}`, borderRadius: 12,
              padding: '0 14px', fontSize: 20, fontFamily: jpFont, fontWeight: 700,
              outline: 'none', textAlign: 'center', letterSpacing: 2,
            }} />
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.n500, marginBottom: 8 }}>차종</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {sizes.map(s => {
              const active = size === s.k;
              return (
                <button key={s.k} onClick={() => setSize(s.k)} style={{
                  height: 52, borderRadius: 12,
                  border: `1.5px solid ${active ? C.primary : C.n200}`,
                  background: active ? C.primaryLight : C.white,
                  color: active ? C.primary : C.n700,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: jpFont,
                }}>{s.l}</button>
              );
            })}
          </div>
        </div>

        <div onClick={() => setEv(!ev)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderRadius: 12,
          border: `1.5px solid ${ev ? C.success : C.n200}`,
          background: ev ? C.successLight : C.white,
          cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>전기차</div>
              <div style={{ fontSize: 11, color: C.n500 }}>충전 구역 우선 매칭</div>
            </div>
          </div>
          <div style={{
            width: 44, height: 26, borderRadius: 13,
            background: ev ? C.success : C.n200, position: 'relative',
            transition: 'background .2s',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: ev ? 21 : 3, width: 20, height: 20,
              borderRadius: 10, background: C.white, transition: 'left .2s',
            }} />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 32, left: 20, right: 20 }}>
        <JPPrimaryButton label="등록 완료" onClick={() => {
          try { localStorage.setItem('jp_plate', plate); } catch {}
          go('pending');
        }} />
      </div>
    </JPScreen>
  );
}

function PendingScreen({ go }) {
  const [status, setStatus] = React.useState('pending');
  const [rejected, setRejected] = React.useState(false);
  const info = React.useMemo(() => {
    try {
      return {
        dong: localStorage.getItem('jp_dong') || '',
        ho: localStorage.getItem('jp_ho') || '',
        name: localStorage.getItem('jp_name') || '',
        id: localStorage.getItem('jp_request_id') || '',
      };
    } catch { return { dong: '', ho: '', name: '', id: '' }; }
  }, []);

  React.useEffect(() => {
    if (!info.id) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/residents/requests/${info.id}`, { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (d.status === 'approved') { setStatus('approved'); setTimeout(() => go('home'), 800); }
        else if (d.status === 'rejected') { setStatus('rejected'); setRejected(true); }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [info.id, go]);

  const icon = rejected ? '✕' : status === 'approved' ? '✓' : '🕐';
  const iconBg = rejected ? '#FEE2E2' : status === 'approved' ? C.successLight : C.warningLight;
  const title = rejected ? '승인이 거절되었어요' : status === 'approved' ? '승인되었어요!' : '관리자가 확인 중이에요';

  return (
    <JPScreen bg={C.n50} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 16 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 48, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
        }}>{icon}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.n900, textAlign: 'center' }}>{title}</div>
        <div style={{ fontSize: 14, color: C.n500, textAlign: 'center', lineHeight: 1.6 }}>
          {rejected ? '명단이 갱신된 후 다시 요청해주세요.'
            : status === 'approved' ? '곧 홈으로 이동해요...'
            : <>승인되면 알림을 보내드려요.<br/>자동으로 확인하고 있어요.</>}
        </div>
        {info.dong && (
          <div style={{
            width: '100%', marginTop: 12, background: C.white, borderRadius: 12, padding: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,.05)',
          }}>
            <div style={{ fontSize: 12, color: C.n500, marginBottom: 6 }}>신청 정보</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{info.name} · {info.dong}동 {info.ho}호</div>
          </div>
        )}
      </div>
      <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => { try { localStorage.removeItem('jp_request_id'); } catch {}; go('login'); }} style={{
          height: 44, border: 0, background: 'transparent', color: C.n500, fontSize: 13,
          cursor: 'pointer', fontFamily: jpFont,
        }}>처음으로</button>
      </div>
    </JPScreen>
  );
}

Object.assign(window, {
  SplashScreen, PhoneAuthScreen, ComplexRegisterScreen, VehicleScreen, PendingScreen,
});
