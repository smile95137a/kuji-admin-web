// src/utils/FileUtils.ts
export function downloadResponseFile(response: any) {
  let filename = '';

  const disposition = response?.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);

  if (!filename && match && match[1]) {
    filename = decodeURIComponent(match[1]);
  }

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  window.URL.revokeObjectURL(url);
}
