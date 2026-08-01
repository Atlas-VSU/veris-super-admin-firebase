import * as XLSX from "xlsx";

export async function parseFile(file: File): Promise<string[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text  = await file.text();
    const lines = text.split(/\r?\n/);
    // Flatten comma-separated cells
    return lines.flatMap((line) => line.split(",")).map((s) => s.trim());
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer   = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return rows.flatMap((row) => row.map((cell) => String(cell ?? "").trim()));
  }

  throw new Error("Unsupported file type. Please upload a .csv or .xlsx file.");
}
