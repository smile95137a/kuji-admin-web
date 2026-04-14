// stores/auth.ts
import { loadState, saveState, removeState } from '@/utils/Localstorage';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // ▼ state
  // accessToken 只存 Pinia memory（不寫 localStorage），防止 XSS 竊取
  const token = ref<string | null>(null);
  // 其餘持久化資料
  const user = ref<any>(loadState<any>('user') || null);
  const refreshToken = ref<string | null>(loadState<string>('refreshToken') || null);
  const tokenType = ref<string>(loadState<string>('tokenType') || 'Bearer');
  const expiresIn = ref<number>(loadState<number>('expiresIn') || 0);
  const forceChangePassword = ref<boolean>(
    loadState<boolean>('forceChangePassword') || false
  );
  // menus 持久化（供頁面重整後 sidebar fallback 用）
  const menus = ref<any[]>(loadState<any[]>('menus') || []);

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
    if (rt) saveState('refreshToken', rt);
    else removeState('refreshToken');
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

    removeState('user');
    // token 不在 localStorage，不需 removeState
    removeState('refreshToken');
    removeState('tokenType');
    removeState('expiresIn');
    removeState('forceChangePassword');
    removeState('menus');
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
  };
});
