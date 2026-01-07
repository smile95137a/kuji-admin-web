/// <reference types="vite/client" />
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: any;
  meta?: any;
  code?: string;
  message?: string;
}

interface SelectOption {
  value: string;
  label: string;
}
