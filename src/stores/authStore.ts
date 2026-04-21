// stores/auth.ts
import { loadState, saveState, removeState } from '@/utils/Localstorage';
import { loadSession, saveSession, removeSession } from '@/utils/SessionStorage';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

export const useAuthStore = defineStore('auth', () => {
  // ▼ state
  // accessToken 只存 Pinia memory（不寫 localStorage），防止 XSS 竊取
  const token = ref<string | null>(null);
  // 其餘持久化資料
  const user = ref<any>(loadState<any>('user') || null);
  // refreshToken 改存 sessionStorage（F5 保留 / 關閉瀏覽器清除）
  const refreshToken = ref<string | null>(loadSession<string>('refreshToken') || null);
  const tokenType = ref<string>(loadState<string>('tokenType') || 'Bearer');
  const expiresIn = ref<number>(loadState<number>('expiresIn') || 0);
  const forceChangePassword = ref<boolean>(
    loadState<boolean>('forceChangePassword') || false
  );
  // menus 持久化（供頁面重整後 sidebar fallback 用）
  const menus = ref<any[]>(loadState<any[]>('menus') || []);

  // App 啟動時靜默 refresh 的初始化狀態
  const authInitialized = ref<boolean>(false);
  let _initPromise: Promise<void> | null = null;

  // ▼ getters
  const isLogin = computed(() => !!token.value);

  const authHeader = computed(() => {
    if (!token.value) return '';
    return `${tokenType.value || 'Bearer'} ${token.value}`;
  });

  // ▼ actions
  const setUser = (userData: any) => {
    user.value = userData;
    if (userData) saveState('user', userData);
    else removeState('user');
  };

  // accessToken 只存記憶體（Pinia state），不寫 localStorage
  const setToken = (accessToken: string | null) => {
    token.value = accessToken;
  };

  const setMenus = (menuList: any[]) => {
    menus.value = menuList ?? [];
    saveState('menus', menus.value);
  };

  const setRefreshToken = (rt: any) => {
    refreshToken.value = rt;
    // 改存 sessionStorage（F5 保留 / 關閉瀏覽器清除）
    if (rt) saveSession('refreshToken', rt);
    else removeSession('refreshToken');
  };

  const setTokenType = (tt: any) => {
    tokenType.value = tt || 'Bearer';
    saveState('tokenType', tokenType.value);
  };

  const setExpiresIn = (sec: any) => {
    expiresIn.value = Number(sec || 0);
    saveState('expiresIn', expiresIn.value);
  };

  const setForceChangePassword = (v: any) => {
    forceChangePassword.value = !!v;
    saveState('forceChangePassword', forceChangePassword.value);
  };

  /** 後端 login 成功後直接丟整包 data 進來 */
  const setAuthFromLogin = (data: any) => {
    // data (new): { token, refreshToken, adminUser, isFirstLogin }
    // data (legacy): { accessToken, refreshToken, user, forceChangePassword }
    setToken(data?.token ?? data?.accessToken ?? null);
    setRefreshToken(data?.refreshToken ?? null);
    setTokenType(data?.tokenType ?? 'Bearer');
    setExpiresIn(data?.expiresIn ?? 0);
    setForceChangePassword(data?.isFirstLogin ?? data?.forceChangePassword ?? false);
    setUser(data?.adminUser ?? data?.user ?? null);
    setMenus(data?.menus ?? []);
  };

  const clearAuthData = () => {
    token.value = null;
    user.value = null;
    refreshToken.value = null;
    tokenType.value = 'Bearer';
    expiresIn.value = 0;
    forceChangePassword.value = false;
    menus.value = [];
    authInitialized.value = false;
    _initPromise = null;

    removeState('user');
    // token 不在 localStorage，不需 removeState
    removeSession('refreshToken'); // refreshToken 改存 sessionStorage
    removeState('tokenType');
    removeState('expiresIn');
    removeState('forceChangePassword');
    removeState('menus');
  };

  /**
   * App 啟動 / F5 後靜默恢復 session。
   * - 若已初始化直接回傳（防止 router guard 多次觸發重複呼叫）
   * - 若 sessionStorage 有 refreshToken → 靜默換回 accessToken
   * - 若失敗或無 refreshToken → 清除狀態，後續 router guard 導向 /login
   */
  const initializeAuth = (): Promise<void> => {
    if (authInitialized.value) return Promise.resolve();
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
      // accessToken 已在 Pinia（例如同 tab 的 Pinia HMR），直接標記完成
      if (token.value) {
        authInitialized.value = true;
        return;
      }

      const rt = loadSession<string>('refreshToken');
      if (!rt) {
        authInitialized.value = true;
        return;
      }

      try {
        // 用 raw axios 避免走 401 interceptor 造成無限循環
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_API_URL}/api/admin/auth/refresh`,
          { refreshToken: rt },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const payload = res.data;
        if (!payload?.success) throw new Error(payload?.error?.message || 'refresh failed');

        const newAccessToken = payload?.data?.token ?? payload?.data?.accessToken;
        const newRefreshToken = payload?.data?.refreshToken;
        const newTokenType = payload?.data?.tokenType || 'Bearer';
        const newExpiresIn = payload?.data?.expiresIn ?? 0;

        if (!newAccessToken) throw new Error('no accessToken in refresh response');

        token.value = newAccessToken;
        if (newRefreshToken) saveSession('refreshToken', newRefreshToken);
        saveState('tokenType', newTokenType);
        saveState('expiresIn', newExpiresIn);
        tokenType.value = newTokenType;
        expiresIn.value = newExpiresIn;
      } catch (e) {
        console.warn('[Auth] Silent refresh failed, clearing auth state.', e);
        clearAuthData();
      } finally {
        authInitialized.value = true;
      }
    })();

    return _initPromise;
  };

  return {
    // state
    user,
    token,
    refreshToken,
    tokenType,
    expiresIn,
    forceChangePassword,
    menus,
    authInitialized,

    // getters
    isLogin,
    authHeader,

    // actions
    setUser,
    setToken,
    setRefreshToken,
    setTokenType,
    setExpiresIn,
    setForceChangePassword,
    setMenus,
    setAuthFromLogin,
    clearAuthData,
    initializeAuth,
  };
});
