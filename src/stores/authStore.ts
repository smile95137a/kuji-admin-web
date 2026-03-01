// stores/auth.ts
import { loadState, saveState, removeState } from '@/utils/Localstorage';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // ▼ state（從 localStorage 初始化）
  const user = ref<any>(loadState<any>('user') || null);
  const token = ref<any>(loadState<any>('token') || null);
  const refreshToken = ref<any>(loadState<any>('refreshToken') || null);
  const tokenType = ref<any>(loadState<any>('tokenType') || 'Bearer');
  const expiresIn = ref<any>(loadState<any>('expiresIn') || 0);
  const forceChangePassword = ref<any>(
    loadState<any>('forceChangePassword') || false
  );

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

  const setToken = (accessToken: any) => {
    token.value = accessToken;
    if (accessToken) saveState('token', accessToken);
    else removeState('token');
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
  };

  const clearAuthData = () => {
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    tokenType.value = 'Bearer';
    expiresIn.value = 0;
    forceChangePassword.value = false;

    removeState('user');
    removeState('token');
    removeState('refreshToken');
    removeState('tokenType');
    removeState('expiresIn');
    removeState('forceChangePassword');
  };

  return {
    // state
    user,
    token,
    refreshToken,
    tokenType,
    expiresIn,
    forceChangePassword,

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
    setAuthFromLogin,
    clearAuthData,
  };
});
