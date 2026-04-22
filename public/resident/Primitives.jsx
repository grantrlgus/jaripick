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

Object.assign(window, {
  C, jpFont, JPScreen, JPHeader, JPTabBar, JPPrimaryButton, JPSecondaryButton,
  JPCard, JPDdayBadge, JPSpotBadge, JPSectionHeader, JPEmptyState,
});
