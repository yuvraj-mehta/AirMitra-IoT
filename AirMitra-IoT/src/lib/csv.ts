export type CSVColumn<T> = {
  key: keyof T | string;
  header: string;
  map?: (row: T) => string | number | boolean | null | undefined;
};

function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // Normalize newlines
  str = str.replace(/\r\n|\r|\n/g, "\n");
  // If field contains quote, comma, or newline, wrap in quotes and escape quotes
  if (/[",\n]/.test(str)) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function objectsToCSV<T extends Record<string, any>>(
  rows: T[],
  columns: CSVColumn<T>[]
): string {
  const header = columns.map((c) => escapeCSVField(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = c.map ? c.map(row) : (row as any)[c.key as string];
          return escapeCSVField(v);
        })
        .join(",")
    )
    .join("\n");
  // Add BOM for Excel UTF-8 compatibility
  return "\uFEFF" + header + "\n" + body;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
