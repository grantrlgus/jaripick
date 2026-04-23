// App-specific primitives matching jaripick-app theme
// Colors + components extracted from src/lib/theme.ts and src/components/*

const C = {
  primary: '#3B82F6',
  primaryDeep: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryLight2: '#DBEAFE',
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  n900: '#111827',
  n700: '#374151',
  n500: '#6B7280',
  n400: '#9CA3AF',
  n200: '#E5E7EB',
  n100: '#F3F4F6',
  n50: '#F9FAFB',
  white: '#fff',
  kakao: '#FEE500',
};

const jpFont = `-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Pretendard', 'Noto Sans KR', sans-serif`;

// screen container (mobile view body)
function JPScreen({ children, bg = C.n100, style = {} }) {
  return (
    <div style={{
      width: '100%', minHeight: '100%', background: bg,
      fontFamily: jpFont, color: C.n900, ...style,
    }}>{children}</div>
  );
}

// Top bar inside the iOS frame (not iOS nav — mobile app own header)
function JPHeader({ left, right, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '52px 20px 12px', background: C.white,
      borderBottom: `1px solid ${C.n100}`, gap: 8,
    }}>
      {left != null && <div style={{ display: 'flex', alignItems: 'center' }}>{left}</div>}
      <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>{title}</div>
      {right != null && <div>{right}</div>}
    </div>
  );
}

// Tab bar (bottom nav in mobile)
function JPTabBar({ active = 'home', onChange = () => {} }) {
  const items = [
    { k: 'home', e: '🏠', l: '홈' },
    { k: 'list', e: '🅿️', l: '구역' },
    { k: 'bids', e: '📋', l: '내 신청' },
    { k: 'cert', e: '🎫', l: '내 구역' },
  ];
  return (
    <div style={{
      flexShrink: 0,
      background: C.white, borderTop: `1px solid ${C.n100}`,
      display: 'flex', padding: '6px 0 28px',
    }}>
      {items.map(i => (
        <button key={i.k} onClick={() => onChange(i.k)}
          style={{
            flex: 1, background: 'transparent', border: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 4px',
          }}>
          <span style={{ fontSize: 22, filter: active === i.k ? 'none' : 'grayscale(1) opacity(.55)' }}>{i.e}</span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: active === i.k ? C.primary : C.n400,
          }}>{i.l}</span>
        </button>
      ))}
    </div>
  );
}

// Primary button — 52px, radius 12, full-width by default
function JPPrimaryButton({ label, disabled, onClick, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: 52, width: '100%', borderRadius: 12, border: 0,
      background: disabled ? C.n200 : C.primary,
      color: disabled ? C.n400 : C.white,
      fontSize: 16, fontWeight: 600, fontFamily: jpFont,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      ...style,
    }}>{label}</button>
  );
}

function JPSecondaryButton({ label, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      height: 52, width: '100%', borderRadius: 12,
      background: C.white, color: C.primary,
      border: `1.5px solid ${C.primary}`,
      fontSize: 16, fontWeight: 600, fontFamily: jpFont,
      cursor: 'pointer', ...style,
    }}>{label}</button>
  );
}

// Card container — white, radius 12, padding 16, shadow soft
function JPCard({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.white, borderRadius: 12, padding: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  );
}

// D-day badge — red when ≤3 days, gray otherwise
function JPDdayBadge({ days }) {
  const urgent = days <= 3;
  const text = days === 0 ? 'D-day' : `D-${days}`;
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 6,
      background: urgent ? C.dangerLight : C.n100,
      color: urgent ? C.danger : C.n500,
      fontSize: 12, fontWeight: 700,
    }}>{text}</span>
  );
}

function JPSpotBadge({ number, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: C.primaryLight, color: C.primary,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size >= 40 ? 12 : 11, fontWeight: 700,
    }}>{number}</div>
  );
}

function JPSectionHeader({ title, rightLabel, onRight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.n900 }}>{title}</div>
      {rightLabel && (
        <button onClick={onRight} style={{
          background: 'transparent', border: 0, cursor: 'pointer',
          fontSize: 12, fontWeight: 600, color: C.primary, fontFamily: jpFont,
        }}>{rightLabel}</button>
      )}
    </div>
  );
}

function JPEmptyState({ message, ctaLabel, onCta, emoji = '📭' }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, padding: '32px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    }}>
      <div style={{ fontSize: 36 }}>{emoji}</div>
      <div style={{ color: C.n500, fontSize: 14, textAlign: 'center', whiteSpace: 'pre-line' }}>{message}</div>
      {ctaLabel && (
        <button onClick={onCta} style={{
          marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 0,
          background: C.primaryLight, color: C.primary,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: jpFont,
        }}>{ctaLabel}</button>
      )}
    </div>
  );
}

// ─── Toast (global) ─────────────────────────────────────────
// 사용법: jpToast('메시지', 'error' | 'success' | 'info'). React 외부에서도 호출 가능.
(function setupJPToast() {
  if (typeof document === 'undefined') return;
  let container = null;
  const ensure = () => {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.id = 'jp-toast-container';
    container.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:90vw;';
    document.body.appendChild(container);
    return container;
  };
  const bgByKind = { error: '#EF4444', success: '#10B981', info: '#374151' };
  window.jpToast = function jpToast(message, kind) {
    if (!message) return;
    const c = ensure();
    const t = document.createElement('div');
    const bg = bgByKind[kind] || bgByKind.info;
    t.style.cssText = `background:${bg};color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;font-family:${jpFont};box-shadow:0 4px 12px rgba(0,0,0,0.2);opacity:0;transform:translateY(-8px);transition:opacity .2s,transform .2s;pointer-events:auto;max-width:90vw;word-break:keep-all;`;
    t.textContent = String(message);
    c.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-8px)';
      setTimeout(() => t.remove(), 200);
    }, 3000);
  };

  // fetch 래퍼: 네트워크 오류 및 4xx/5xx 에러 자동 토스트.
  // 단, 명시적으로 silent: true 옵션 주면 skip (409 confirm dialog 같은 경우).
  const origFetch = window.fetch.bind(window);
  window.fetch = async function patchedFetch(input, init) {
    const silent = init && init.silent;
    try {
      const res = await origFetch(input, init);
      if (!silent && !res.ok && res.status >= 400) {
        // clone to read body without consuming
        try {
          const t = await res.clone().text();
          let msg = `오류 (${res.status})`;
          try { const j = JSON.parse(t); if (j.error) msg = j.error; } catch {}
          // 409는 client가 직접 처리하는 경우가 많음 — 조용히
          if (res.status !== 409) window.jpToast(msg, 'error');
        } catch {}
      }
      return res;
    } catch (e) {
      if (!silent) window.jpToast('네트워크 연결을 확인해주세요', 'error');
      throw e;
    }
  };
})();

Object.assign(window, {
  C, jpFont, JPScreen, JPHeader, JPTabBar, JPPrimaryButton, JPSecondaryButton,
  JPCard, JPDdayBadge, JPSpotBadge, JPSectionHeader, JPEmptyState,
});
