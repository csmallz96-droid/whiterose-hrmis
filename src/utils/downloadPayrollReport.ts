import type { jsPDF } from "jspdf";
import { createBrandedPdf, fmt, saveBrandedPdf } from "@/utils/brandedExport";

export type PayrollReportEmployee = {
  id: string;
  name: string;
  branch: string;
  gross: number;
  paye: number;
  nssf: number;
  sha: number;
  ahl: number;
  nita: number;
  net: number;
};

export type PayrollReportSummary = {
  gross: number;
  paye: number;
  nssf: number;
  sha: number;
  ahl: number;
  nita: number;
  net: number;
};

function addRow(pdf: jsPDF, y: number, columns: Array<{ text: string; x: number; align?: "left" | "right" | "center" }>, bold = false) {
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(8.5);
  columns.forEach((column) => {
    pdf.text(column.text, column.x, y, { align: column.align ?? "left" });
  });
}

export function downloadPayrollReport(
  periodLabel: string,
  summary: PayrollReportSummary,
  employees: PayrollReportEmployee[],
) {
  const pdf = createBrandedPdf(`PAYROLL REPORT - ${periodLabel.toUpperCase()}`, `${employees.length} employees | Generated ${new Date().toLocaleString("en-KE")}`);
  let y = 46;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Summary", 14, y);
  y += 6;

  const summaryRows: Array<[string, number]> = [
    ["Total Gross Pay", summary.gross],
    ["Total PAYE", summary.paye],
    ["Total NSSF", summary.nssf],
    ["Total SHA", summary.sha],
    ["Total AHL", summary.ahl],
    ["Total NITA", summary.nita],
    ["Total Net Pay", summary.net],
  ];

  summaryRows.forEach(([label, value], index) => {
    pdf.setFillColor(index % 2 === 0 ? 245 : 255, index % 2 === 0 ? 247 : 255, index % 2 === 0 ? 250 : 255);
    pdf.rect(14, y - 4.5, 85, 6, "F");
    pdf.setFont("helvetica", label === "Total Net Pay" ? "bold" : "normal");
    pdf.setFontSize(9);
    pdf.text(label, 16, y);
    pdf.text(fmt(value), 97, y, { align: "right" });
    y += 6;
  });

  y += 4;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Employee Breakdown", 14, y);
  y += 7;

  const headers = [
    { text: "Employee", x: 14 },
    { text: "Branch", x: 56 },
    { text: "Gross", x: 96, align: "right" as const },
    { text: "PAYE", x: 116, align: "right" as const },
    { text: "NSSF", x: 134, align: "right" as const },
    { text: "SHA", x: 150, align: "right" as const },
    { text: "AHL", x: 166, align: "right" as const },
    { text: "Net", x: 196, align: "right" as const },
  ];

  const ensurePage = () => {
    if (y < 270) return;
    pdf.addPage();
    y = 24;
  };

  pdf.setFillColor(43, 57, 144);
  pdf.rect(14, y - 5, 182, 7, "F");
  pdf.setTextColor(255, 255, 255);
  addRow(pdf, y, headers, true);
  pdf.setTextColor(20, 20, 20);
  y += 7;

  employees.forEach((employee, index) => {
    ensurePage();
    if (index % 2 === 0) {
      pdf.setFillColor(248, 249, 251);
      pdf.rect(14, y - 4.5, 182, 6, "F");
    }
    addRow(pdf, y, [
      { text: employee.name.slice(0, 24), x: 14 },
      { text: employee.branch.slice(0, 16), x: 56 },
      { text: fmt(employee.gross).replace("KES ", ""), x: 96, align: "right" },
      { text: fmt(employee.paye).replace("KES ", ""), x: 116, align: "right" },
      { text: fmt(employee.nssf).replace("KES ", ""), x: 134, align: "right" },
      { text: fmt(employee.sha).replace("KES ", ""), x: 150, align: "right" },
      { text: fmt(employee.ahl).replace("KES ", ""), x: 166, align: "right" },
      { text: fmt(employee.net).replace("KES ", ""), x: 196, align: "right" },
    ]);
    y += 6;
  });

  y += 6;
  ensurePage();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Statutory Remittance Summary", 14, y);
  y += 6;
  [
    `KRA PAYE: ${fmt(summary.paye)}`,
    `NSSF: ${fmt(summary.nssf)}`,
    `SHA: ${fmt(summary.sha)}`,
    `AHL: ${fmt(summary.ahl)}`,
    `NITA: ${fmt(summary.nita)}`,
  ].forEach((line) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(line, 16, y);
    y += 5;
  });

  saveBrandedPdf(pdf, "PayrollReport", periodLabel);
}
