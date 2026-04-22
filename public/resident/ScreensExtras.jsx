// Extra screens: Notifications, Settings, Payment, ReBidCancel, Error, FAQ

function NotificationsScreen({ go }) {
  const notifs = [
    { t: '🎉 낙찰됐어요!', d: 'A-23 구역에 180,000원으로 확정됐어요', w: '방금 전', unread: true, action: 'cert' },
    { t: '⚠️ 순위가 밀렸어요', d: 'B-07 구역 · 140,000원이 최고가가 됐어요', w: '1시간 전', unread: true, action: 'bid' },
    { t: '🏆 현재 1위예요', d: 'A-23 구역 · 3명 중 1위', w: '3시간 전', unread: false, action: 'detail' },
    { t: '✅ 입주민 승인 완료', d: '오금현대 101동 1201호', w: '어제', unread: false, action: null },
    { t: '📢 2026년 5월 라운드 시작', d: '124개 구역 중 96칸 입찰 가능', w: '3일 전', unread: false, action: 'list' },
  ];
  return (
    <JPScreen>
      <JPHeader left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => go('home')} style={{ background: 'transparent', border: 0, fontSize: 22, padding: 0, cursor: 'pointer', color: C.n700 }}>‹</button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>알림</div>
        </div>
      } right={
        <button style={{ padding: '6px 10px', background: 'transparent', border: 0, fontSize: 12, color: C.primary, fontWeight: 600, cursor: 'pointer', fontFamily: jpFont }}>모두 읽음</button>
      } />
      <div style={{ padding: '8px 20px 100px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifs.map((n, i) => (
          <div key={i} onClick={() => n.action && go(n.action, { spot: 'A-23' })} style={{
            background: n.unread ? C.primaryLight : C.white, borderRadius: 12, padding: 14,
            cursor: n.action ? 'pointer' : 'default',
            border: n.unread ? `1px solid ${C.primaryLight2}` : `1px solid ${C.n100}`,
            display: 'flex', gap: 10,
          }}>
            {n.unread && <div style={{ width: 8, height: 8, borderRadius: 4, background: C.primary, marginTop: 6, flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{n.t}</div>
                <div style={{ fontSize: 11, color: C.n400 }}>{n.w}</div>
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
  const rows = [
    { e: '👤', l: '프로필', s: '홍길동 · 101동 1201호', to: null },
    { e: '🚗', l: '차량 정보', s: '12가 3456 · 중형', to: 'vehicle' },
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
            <div style={{ fontSize: 16, fontWeight: 700 }}>홍길동</div>
            <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>오금현대 · 101동 1201호</div>
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

        <button onClick={() => go('login')} style={{
          height: 48, background: C.white, borderRadius: 12, border: 0,
          color: C.danger, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: jpFont,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}>로그아웃</button>
      </div>
    </JPScreen>
  );
}

function PaymentScreen({ go }) {
  const total = 180000;
  const months = 3;
  const monthly = Math.round(total / months);
  const schedule = [
    { m: '2026년 5월', amt: monthly, when: '5월 관리비', status: 'upcoming' },
    { m: '2026년 6월', amt: monthly, when: '6월 관리비', status: 'upcoming' },
    { m: '2026년 7월', amt: monthly, when: '7월 관리비', status: 'upcoming' },
  ];
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
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>A-23 · 2026-05-01 ~ 07-31 (3개월)</div>
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
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16, background: C.primaryLight,
                  color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.m}</div>
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
  const spot = state.currentSpot || 'A-23';
  const [confirm, setConfirm] = React.useState(false);
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
              <div style={{ fontSize: 12, color: C.n500, marginTop: 2 }}>내 입찰가 160,000원 · 🏆 1위</div>
            </div>
            <JPDdayBadge days={3} />
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
              {spot} 구역 160,000원 신청이 취소돼요.<br/>이번 라운드에는 다시 신청할 수 없어요.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button onClick={() => { setConfirm(false); go('bids'); }} style={{
                height: 52, borderRadius: 12, border: 0, background: C.danger, color: C.white,
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: jpFont,
              }}>취소할게요</button>
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
