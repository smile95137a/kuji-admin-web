// src/utils/executeApiUtils.ts
import { useDialogStore } from '@/stores/dialogStore';
import { getErrorMessage } from './ErrorUtils';
import { withLoading } from './loadingUtils';
import { openInfoDialog } from './dialog/infoDialog';

interface ExecuteApiOptions<T> {
  fn: () => Promise<ApiResponse<T> | T>;
  successTitle?: string;
  successMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onSuccess?: (res: T, full?: ApiResponse<T>) => void | Promise<void>;
  onFail?: (res: T | undefined, full?: ApiResponse<T>) => void | Promise<void>;
  showCatchDialog?: boolean;
  showFailDialog?: boolean;
  showSuccessDialog?: boolean;
  useDefaultSuccessMessage?: boolean;
  onFinally?: () => void | Promise<void>;
}

const normalizeResponse = <T>(res: ApiResponse<T> | T): ApiResponse<T> => {
  if ((res as any)?.success !== undefined) {
    return res as ApiResponse<T>;
  }

  return {
    success: true,
    code: '',
    data: res as T,
    message: '',
  };
};

const normalizeErrorResponse = <T>(error: any): ApiResponse<T> | null => {
  const responseData = error?.response?.data;

  if (!responseData) return null;

  return {
    success: responseData?.success ?? false,
    code: responseData?.code ?? responseData?.error?.code ?? '',
    data: responseData?.data,
    message:
      responseData?.message ||
      responseData?.error?.message ||
      responseData?.errorMessage ||
      responseData?.msg ||
      getErrorMessage(error),
    error: responseData?.error,
    meta: responseData?.meta,
  } as ApiResponse<T>;
};

export async function executeApi<T = any>({
  fn,
  successTitle = '提示訊息',
  successMessage = '操作成功！',
  errorTitle = '錯誤',
  errorMessage = '操作失敗，請稍後再試。',
  onSuccess,
  onFail,
  showCatchDialog = true,
  showFailDialog = true,
  showSuccessDialog = false,
  useDefaultSuccessMessage = true,
  onFinally,
}: ExecuteApiOptions<T>): Promise<ApiResponse<T> | null> {
  useDialogStore();

  try {
    const res = await withLoading(() => fn());
    const normalized = normalizeResponse<T>(res);

    const { success, data, message } = normalized;

    if (success) {
      if (showSuccessDialog) {
        await openInfoDialog({
          title: successTitle,
          message: useDefaultSuccessMessage
            ? successMessage
            : message || successMessage,
          iconType: 'success',
        });
      }

      if (onSuccess) {
        await onSuccess(data!, normalized);
      }
    } else {
      if (showFailDialog) {
        await openInfoDialog({
          title: errorTitle,
          message: message || errorMessage,
          iconType: 'warning',
        });
      }

      if (onFail) {
        await onFail(data, normalized);
      }
    }

    return normalized;
  } catch (error: any) {
    const normalizedError = normalizeErrorResponse<T>(error);
    const message =
      normalizedError?.message || getErrorMessage(error, errorMessage);

    if (showCatchDialog) {
      await openInfoDialog({
        title: errorTitle,
        message,
        iconType: 'warning',
      });
    }

    if (onFail && normalizedError) {
      await onFail(normalizedError.data, normalizedError);
    }

    return normalizedError;
  } finally {
    if (onFinally) {
      await onFinally();
    }
  }
}
