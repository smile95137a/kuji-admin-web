// src/utils/ErrorUtils.ts

export const getErrorMessage = (
  error: any,
  fallback = '發生未知錯誤',
): string => {
  console.error('Error:', error);

  const responseData = error?.response?.data;

  return (
    responseData?.message ||
    responseData?.error?.message ||
    responseData?.errorMessage ||
    responseData?.msg ||
    error?.message ||
    String(error) ||
    fallback
  );
};
