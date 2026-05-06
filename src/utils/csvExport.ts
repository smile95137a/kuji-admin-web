/**
 * 匯出資料為 CSV 檔案（加 UTF-8 BOM，確保 Excel 正常顯示中文）
 */
export function exportToCsv(
  rows: Record<string, any>[],
  columns: { field: string; label: string }[],
  filename: string,
): void {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = row[c.field] ?? '';
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');

  const bom = '\uFEFF'; // UTF-8 BOM，讓 Excel 正確辨識中文
  const blob = new Blob([bom + header + '\n' + body], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
