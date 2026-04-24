// Supabase Auth helper for the resident PWA.
// Creates a single client on first use + exposes window.jp.auth.* helpers.
// Depends on:
//   - window.supabase (UMD from CDN)
//   - window.JP_CONFIG ({ supabaseUrl, supabaseAnonKey })

window.jp = window.jp || {};
window.jp.auth = {
  _client: null,

  _init() {
    if (this._client) return this._client;
    if (!window.supabase) {
      console.warn('[jp-auth] Supabase SDK not loaded yet');
      return null;
    }
    const cfg = window.JP_CONFIG;
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      console.warn('[jp-auth] JP_CONFIG missing');
      return null;
    }
    this._client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
    window.jp.supabase = this._client;
    return this._client;
  },

  async getSession() {
    const c = this._init();
    if (!c) return null;
    const { data } = await c.auth.getSession();
    return data.session || null;
  },

  async getUser() {
    const c = this._init();
    if (!c) return null;
    const { data } = await c.auth.getUser();
    return data.user || null;
  },

  // 휴대폰 번호를 E.164 (+8210...) 로 정규화.
  // 010-1234-5678 / 01012345678 → +821012345678
  toE164(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('82')) return '+' + digits;
    if (digits.startsWith('0')) return '+82' + digits.slice(1);
    return '+82' + digits;
  },

  // OTP 발송 — Supabase Auth Phone provider 가 SMS Hook (/api/auth/sms-hook) 으로
  // 우리 서버를 호출하고, 우리 서버는 SOLAPI 로 실제 발송.
  async sendOtp(phone) {
    const c = this._init();
    if (!c) return { ok: false, error: '로그인 준비 중입니다. 잠시 후 다시 시도해주세요.' };
    const e164 = this.toE164(phone);
    if (!/^\+82\d{9,10}$/.test(e164)) {
      return { ok: false, error: '휴대폰 번호 형식이 올바르지 않아요' };
    }
    const { error } = await c.auth.signInWithOtp({ phone: e164 });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  // OTP 검증 → 세션 생성
  async verifyOtp(phone, code) {
    const c = this._init();
    if (!c) return { ok: false, error: '로그인 준비 중입니다.' };
    const e164 = this.toE164(phone);
    const { data, error } = await c.auth.verifyOtp({ phone: e164, token: code, type: 'sms' });
    if (error) return { ok: false, error: error.message };
    return { ok: true, session: data.session };
  },

  async signOut() {
    const c = this._init();
    if (!c) return;
    await c.auth.signOut();
  },
};

// ─── API helper: auto-append ?complex= for resident app calls ─────────
// 입주민이 가입한 단지(jp_complex_slug)를 모든 API 호출에 자동 부착.
// /api/apartments/search, /api/residents/match 등 단지 무관한 호출은
// 이 헬퍼를 거치지 않거나 이미 complex 파라미터가 있으면 그대로 통과.
window.jp.api = {
  complex() {
    try { return localStorage.getItem('jp_complex_slug') || ''; }
    catch { return ''; }
  },
  withComplex(url) {
    const c = this.complex();
    if (!c) return url;
    if (/[?&]complex=/.test(url)) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}complex=${encodeURIComponent(c)}`;
  },
  async fetch(url, opts) {
    opts = opts || {};
    // Supabase 세션이 있으면 Authorization: Bearer 자동 부착.
    try {
      const session = await window.jp.auth.getSession();
      if (session && session.access_token) {
        const h = new Headers(opts.headers || {});
        if (!h.has('Authorization')) h.set('Authorization', 'Bearer ' + session.access_token);
        opts.headers = h;
      }
    } catch (_) { /* 세션 조회 실패 시 그냥 진행 */ }
    return fetch(this.withComplex(url), opts);
  },
};
