import type { Tables } from "@/integrations/supabase/types";
import { calculatePayroll } from "@/data/mockData";
import { createBrandedPdf, fmt, saveBrandedPdf } from "@/utils/brandedExport";

function addSection(pdf: ReturnType<typeof createBrandedPdf>, y: number, title: string) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(title, 14, y);
  return y + 6;
}

function addLines(pdf: ReturnType<typeof createBrandedPdf>, y: number, lines: string[]) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const pageHeight = pdf.internal.pageSize.getHeight();
  let cursor = y;
  for (const line of lines) {
    if (cursor > pageHeight - 22) {
      pdf.addPage();
      cursor = 20;
    }
    pdf.text(line, 16, cursor);
    cursor += 5;
  }
  return cursor;
}

export function downloadLeaveHistoryReport(
  employee: Tables<"employees">,
  branchName: string,
  leaveRequests: Tables<"leave_requests">[],
) {
  const pdf = createBrandedPdf(`Leave History - ${employee.name}`, `${employee.id} | ${branchName}`);
  let y = addSection(pdf, 46, "Leave Requests");
  y = addLines(pdf, y, leaveRequests.length > 0 ? leaveRequests.map((request) => `${request.type}: ${request.start_date} to ${request.end_date} | ${request.days} days | ${request.status}`) : ["No leave requests found."]);
  y = addSection(pdf, y + 4, "Leave Balance Summary");
  addLines(pdf, y, [`Annual Leave Remaining: ${employee.leave_balance} days`, "Annual Entitlement: 21 days", "Sick Leave Entitlement: 30 days"]);
  saveBrandedPdf(pdf, `LeaveHistory_${employee.id}`, employee.name);
}

export function downloadPerformanceHistoryReport(
  employee: Tables<"employees">,
  appraisals: Tables<"appraisals">[],
) {
  const pdf = createBrandedPdf(`Performance History - ${employee.name}`, `${employee.id} | ${employee.job_title}`);
  let y = addSection(pdf, 46, "Appraisal Timeline");
  addLines(pdf, y, appraisals.length > 0 ? appraisals.map((appraisal) => `${appraisal.period}: final ${appraisal.final_score ?? "-"}/5 | rating ${appraisal.rating ?? "-"} | manager ${appraisal.appraiser_id ?? "-"}`) : ["No appraisals on record."]);
  saveBrandedPdf(pdf, `PerformanceHistory_${employee.id}`, employee.name);
}

export function downloadContractHistoryReport(
  employee: Tables<"employees">,
  contracts: Tables<"contracts">[],
) {
  const pdf = createBrandedPdf(`Contract History - ${employee.name}`, `${employee.id} | ${employee.department}`);
  const y = addSection(pdf, 46, "Contract Records");
  addLines(pdf, y, contracts.length > 0 ? contracts.map((contract) => `${contract.contract_type}: ${contract.start_date} to ${contract.end_date ?? "Open-ended"} | ${contract.status} | ${fmt(Number(contract.salary ?? 0))}`) : ["No contracts on record."]);
  saveBrandedPdf(pdf, `ContractHistory_${employee.id}`, employee.name);
}

export function downloadExpenseHistoryReport(
  employee: Tables<"employees">,
  expenses: Tables<"expenses">[],
) {
  const pdf = createBrandedPdf(`Expense Claims - ${employee.name}`, `${employee.id}`);
  const y = addSection(pdf, 46, "Expense History");
  addLines(pdf, y, expenses.length > 0 ? expenses.map((expense) => `${expense.expense_date}: ${expense.category} | ${fmt(expense.amount)} | ${expense.status}`) : ["No expense claims on record."]);
  saveBrandedPdf(pdf, `ExpenseHistory_${employee.id}`, employee.name);
}

export function downloadPayslipHistoryReport(
  employee: Tables<"employees">,
  payslips: Tables<"payslips">[],
) {
  const pdf = createBrandedPdf(`Payslip History - ${employee.name}`, `${employee.id}`);
  const y = addSection(pdf, 46, "Payslips");
  addLines(pdf, y, payslips.length > 0 ? payslips.map((payslip) => `${payslip.period_month}/${payslip.period_year}: gross ${fmt(payslip.gross_salary)} | net ${fmt(payslip.net_salary)} | PAYE ${fmt(payslip.paye)}`) : ["No payslips on record."]);
  saveBrandedPdf(pdf, `PayslipHistory_${employee.id}`, employee.name);
}

export function downloadP9Report(employee: Tables<"employees">, year: number, payslips: Tables<"payslips">[]) {
  const annualPayslips = payslips.filter((payslip) => payslip.period_year === year);
  const gross = annualPayslips.length > 0 ? annualPayslips.reduce((sum, payslip) => sum + payslip.gross_salary, 0) : calculatePayroll(employee).gross * 12;
  const paye = annualPayslips.length > 0 ? annualPayslips.reduce((sum, payslip) => sum + payslip.paye, 0) : calculatePayroll(employee).paye * 12;
  const pdf = createBrandedPdf(`P9 Annual Tax Summary - ${year}`, `${employee.name} | ${employee.kra_pin}`);
  let y = addSection(pdf, 46, "Tax Summary");
  y = addLines(pdf, y, [
    `Employee ID: ${employee.id}`,
    `Employee Name: ${employee.name}`,
    `KRA PIN: ${employee.kra_pin}`,
    `Annual Gross Pay: ${fmt(gross)}`,
    `Annual PAYE: ${fmt(paye)}`,
  ]);
  addSection(pdf, y + 4, "Monthly Source");
  addLines(pdf, y + 10, annualPayslips.length > 0 ? annualPayslips.map((payslip) => `${payslip.period_month}/${payslip.period_year}: Gross ${fmt(payslip.gross_salary)} | PAYE ${fmt(payslip.paye)}`) : ["No saved payslips for the selected year. Values estimated from current payroll settings."]);
  saveBrandedPdf(pdf, `P9_${employee.id}`, String(year));
}
