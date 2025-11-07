import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportToExcel<T extends object>(
  data: T[],
  fileName: string,
  sheetName = "Feuille1"
) {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  // Convert array of objects to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create a workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  // Save as .xlsx file
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`);
}
