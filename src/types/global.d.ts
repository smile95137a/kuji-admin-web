export {};

import type { AppContext } from 'vue';

declare global {
  interface Window {
    __APP_CONTEXT__?: AppContext;
    logoutConfig?: {
      listenStorageForLogout?: (logoutUrl: string) => void;
    };
  }
}

export {};
