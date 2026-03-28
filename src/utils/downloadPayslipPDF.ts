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
  printRoot.style.cssText = "display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;padding:20px;overflow:auto;";
  document.body.appendChild(printRoot);

  // Print-mode CSS: hide close button when printing
  const style = document.createElement("style");
  style.textContent = "@media print { .payslip-close-btn { display: none !important; } }";
  document.head.appendChild(style);

  const cleanup = () => {
    root.unmount();
    if (document.body.contains(printRoot)) document.body.removeChild(printRoot);
    if (document.head.contains(style)) document.head.removeChild(style);
    document.removeEventListener("keydown", handleEsc);
  };

  // Escape key closes the overlay
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") cleanup();
  };
  document.addEventListener("keydown", handleEsc);

  // Close button — fixed top-right, red, circular
  const closeBtn = document.createElement("button");
  closeBtn.className = "payslip-close-btn";
  closeBtn.innerHTML = "&#215;";
  closeBtn.style.cssText = [
    "position:fixed",
    "top:16px",
    "right:20px",
    "z-index:10000",
    "background:#CC0000",
    "color:white",
    "border:none",
    "border-radius:50%",
    "width:36px",
    "height:36px",
    "font-size:20px",
    "cursor:pointer",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "box-shadow:0 2px 8px rgba(0,0,0,0.3)",
  ].join(";");
  closeBtn.onclick = cleanup;
  printRoot.appendChild(closeBtn);

  const contentDiv = document.createElement("div");
  printRoot.appendChild(contentDiv);

  const root = createRoot(contentDiv);
  root.render(createElement(PayslipPrintTemplate, { employee, branchName, period }));

  setTimeout(() => {
    printRoot.style.display = "block";
    window.print();
    window.addEventListener("afterprint", cleanup, { once: true });
  }, 300);
}
