import { createRoot } from "react-dom/client";
import { createElement } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PayslipPrintTemplate from "@/components/PayslipPrintTemplate";
import type { Employee } from "@/hooks/useSupabaseData";

export async function downloadPayslipPDF(employee: Employee, branchName: string, period: string) {
  // Create hidden container
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:794px;background:#fff;padding:20px;z-index:-1;";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(createElement(PayslipPrintTemplate, { employee, branchName, period }));

  // Wait for render
  await new Promise((r) => setTimeout(r, 400));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

    const filename = `Whiterose_Payslip_${employee.id}_${period.replace(/\s+/g, "_")}.pdf`;
    pdf.save(filename);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

export function printPayslip(employee: Employee, branchName: string, period: string) {
  const printRoot = document.createElement("div");
  printRoot.id = "payslip-print-root";
  printRoot.style.cssText = "display:none;position:fixed;top:0;left:0;width:100%;background:#fff;z-index:99999;padding:20px;";
  document.body.appendChild(printRoot);

  const root = createRoot(printRoot);
  root.render(createElement(PayslipPrintTemplate, { employee, branchName, period }));

  setTimeout(() => {
    printRoot.style.display = "block";
    window.print();
    window.addEventListener(
      "afterprint",
      () => {
        root.unmount();
        if (document.body.contains(printRoot)) document.body.removeChild(printRoot);
      },
      { once: true }
    );
  }, 300);
}
