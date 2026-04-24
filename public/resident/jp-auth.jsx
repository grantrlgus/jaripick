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

  async signInWithGoogle() {
    const c = this._init();
    if (!c) {
      alert('로그인 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const { error } = await c.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/resident/' },
    });
    if (error) alert('로그인 실패: ' + error.message);
  },

  async signInWithKakao() {
    const c = this._init();
    if (!c) {
      alert('로그인 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const { error } = await c.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin + '/resident/',
        scopes: 'profile_nickname',
      },
    });
    if (error) alert('로그인 실패: ' + error.message);
  },

  async signOut() {
    const c = this._init();
    if (!c) return;
    await c.auth.signOut();
  },
};
