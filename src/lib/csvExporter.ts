import { downloadFile } from '@/lib/fileDownloader';

export function downloadCSVReport(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const finalName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  downloadFile(csvContent, finalName, 'text/csv;charset=utf-8;');
}
