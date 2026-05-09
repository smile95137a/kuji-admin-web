/// <reference types="vite/client" />

interface ApiError {
  code?: string | number;
  message?: string;
  [key: string]: any;
}

interface ApiMeta {
  timestamp?: string;
  requestId?: string;
  [key: string]: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError | any;
  meta?: ApiMeta | any;
  code?: string | number;
  message?: string;
}

interface SelectOption {
  value: any;
  label: any;
  disabled?: boolean;
  description?: string;
}
