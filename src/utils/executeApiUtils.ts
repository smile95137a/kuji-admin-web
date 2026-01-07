import { useDialogStore } from '@/stores/dialogStore';
import { getErrorMessage } from './ErrorUtils';
import { withLoading } from './loadingUtils';

interface ExecuteApiOptions<T> {
  fn: () => Promise<ApiResponse<T> | T>;
  successTitle?: string;
  successMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onSuccess?: (res: T, full?: ApiResponse<T>) => void | Promise<void>;
  onFail?: (res: T | undefined) => void | Promise<void>;
  showCatchDialog?: boolean;
  showFailDialog?: boolean;
  showSuccessDialog?: boolean;
  useDefaultSuccessMessage?: boolean;

  onFinally?: () => void | Promise<void>;
}
export async function executeApi<T = any>({
  fn,
  successTitle = '提示訊息',
  successMessage = '操作成功',
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
  const dialogStore = useDialogStore();

  try {
    const res = await withLoading(() => fn());

    const normalized: ApiResponse<T> =
      (res as any)?.success !== undefined
        ? (res as ApiResponse<T>)
        : { success: true, code: '', data: res as T, message: '' };

    const { success, data, message } = normalized;

    if (success) {
      if (showSuccessDialog) {
        await dialogStore.openInfoDialog({
          title: successTitle,
          message: useDefaultSuccessMessage
            ? successMessage
            : message || successMessage,
          iconType: 'success',
        });
      }
      if (onSuccess) await onSuccess(data!, normalized);
    } else {
      if (showFailDialog) {
        await dialogStore.openInfoDialog({
          title: errorTitle,
          message: message || errorMessage,
          iconType: 'warning',
        });
      }
      if (onFail) await onFail(data);
    }
    return normalized;
  } catch (error) {
    if (showCatchDialog) {
      await dialogStore.openInfoDialog({
        title: errorTitle,
        message: getErrorMessage(error),
        iconType: 'warning',
      });
    }
    return null;
  } finally {
    if (onFinally) await onFinally();
  }
}
