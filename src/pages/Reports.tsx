import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees, useBranches, useLeaveRequests } from "@/hooks/useSupabaseData";
import type { Tables } from "@/integrations/supabase/types";
import { calculatePayroll } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { downloadBrandedCSV } from "@/utils/brandedExport";
import {
  downloadContractHistoryReport,
  downloadExpenseHistoryReport,
  downloadLeaveHistoryReport,
  downloadP9Report,
  downloadPayslipHistoryReport,
  downloadPerformanceHistoryReport,
} from "@/utils/employeeReports";

export default function Reports() {
  const { employees } = useEmployees();
  const { branches } = useBranches();
  const { leaveRequests } = useLeaveRequests();
  const [active, setActive] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("3");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [appraisals, setAppraisals] = useState<Tables<"appraisals">[]>([]);
  const [contracts, setContracts] = useState<Tables<"contracts">[]>([]);
  const [expenses, setExpenses] = useState<Tables<"expenses">[]>([]);
  const [payslips, setPayslips] = useState<Tables<"payslips">[]>([]);

  useEffect(() => {
    supabase.from("appraisals").select("*").then(({ data }) => setAppraisals(data ?? []));
    supabase.from("contracts").select("*").then(({ data }) => setContracts(data ?? []));
    supabase.from("expenses").select("*").then(({ data }) => setExpenses(data ?? []));
    supabase.from("payslips").select("*").then(({ data }) => setPayslips(data ?? []));
  }, []);

  const payrollByBranch = branches.map((branch) => {
    const branchEmployees = employees.filter((employee) => employee.branch_id === branch.id);
    const totals = branchEmployees.reduce((acc, employee) => {
      const payroll = calculatePayroll(employee);
      return { gross: acc.gross + payroll.gross, net: acc.net + payroll.netPay };
    }, { gross: 0, net: 0 });
    return { branch: branch.name, headcount: branchEmployees.length, ...totals };
  });

  const statutory = employees.reduce((acc, employee) => {
    const payroll = calculatePayroll(employee);
    return {
      paye: acc.paye + payroll.paye,
      nssf_employee: acc.nssf_employee + payroll.nssf.employee,
      nssf_employer: acc.nssf_employer + payroll.nssf.employer,
      sha: acc.sha + payroll.sha,
      ahl: acc.ahl + payroll.ahl.employee,
      nita: acc.nita + payroll.nita.employee,
    };
  }, { paye: 0, nssf_employee: 0, nssf_employer: 0, sha: 0, ahl: 0, nita: 0 });

  const leaveByDept: Record<string, { entitlement: number; taken: number }> = {};
  employees.forEach((employee) => {
    if (!leaveByDept[employee.department]) leaveByDept[employee.department] = { entitlement: 0, taken: 0 };
    leaveByDept[employee.department].entitlement += 21;
    leaveByDept[employee.department].taken += 21 - employee.leave_balance;
  });

  const headcountByBranch = branches.map((branch) => {
    const branchEmployees = employees.filter((employee) => employee.branch_id === branch.id);
    return {
      branch: branch.name,
      total: branchEmployees.length,
      permanent: branchEmployees.filter((employee) => employee.employment_type === "Permanent").length,
      contract: branchEmployees.filter((employee) => employee.employment_type === "Contract").length,
      active: branchEmployees.filter((employee) => employee.status === "Active").length,
    };
  });

  const expiringContracts = employees.filter((employee) => {
    if (!employee.contract_end) return false;
    const days = Math.ceil((new Date(employee.contract_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 90;
  }).map((employee) => {
    const branch = branches.find((item) => item.id === employee.branch_id);
    const days = Math.ceil((new Date(employee.contract_end as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { ...employee, branchName: branch?.name ?? "-", daysLeft: days };
  }).sort((left, right) => left.daysLeft - right.daysLeft);

  const p9 = employees.map((employee) => {
    const payroll = calculatePayroll(employee);
    return {
      id: employee.id,
      name: employee.name,
      kra_pin: employee.kra_pin,
      annual_gross: payroll.gross * 12,
      annual_paye: payroll.paye * 12,
    };
  });

  const selectedEmployee = useMemo(() => employees.find((employee) => employee.id === selectedEmployeeId) ?? null, [employees, selectedEmployeeId]);
  const selectedEmployeeBranch = branches.find((branch) => branch.id === selectedEmployee?.branch_id)?.name ?? "-";

  const reports = [
    { id: "payroll", title: "Monthly Payroll Summary", desc: "Total cost by branch for selected month" },
    { id: "statutory", title: "Statutory Returns", desc: "PAYE, NSSF, SHA, AHL, NITA totals" },
    { id: "leave", title: "Leave Utilisation", desc: "Leave taken vs entitlement by department" },
    { id: "headcount", title: "Headcount Report", desc: "Staff count by branch and employment type" },
    { id: "expiry", title: "Contract Expiry Report", desc: "Contracts expiring in the next 90 days" },
    { id: "p9", title: "P9 Annual Summary", desc: "Annual PAYE per employee" },
  ];

  const exportSummaryReport = (id: string) => {
    if (id === "payroll") {
      downloadBrandedCSV("PayrollReport", ["Branch", "Headcount", "Gross Payroll", "Net Payroll"], [payrollByBranch.map((row) => [row.branch, String(row.headcount), row.gross.toFixed(2), row.net.toFixed(2)])], `${selectedMonth}-${selectedYear}`);
    } else if (id === "statutory") {
      downloadBrandedCSV("StatutoryReturns", ["Item", "Amount"], [[
        ["PAYE", statutory.paye.toFixed(2)],
        ["NSSF (Employee)", statutory.nssf_employee.toFixed(2)],
        ["NSSF (Employer)", statutory.nssf_employer.toFixed(2)],
        ["SHA", statutory.sha.toFixed(2)],
        ["AHL", statutory.ahl.toFixed(2)],
        ["NITA", statutory.nita.toFixed(2)],
      ]], `${selectedMonth}-${selectedYear}`);
    } else if (id === "leave") {
      downloadBrandedCSV("LeaveUtilisation", ["Department", "Entitlement (Days)", "Taken (Days)", "Remaining (Days)"], [Object.entries(leaveByDept).map(([dept, value]) => [dept, String(value.entitlement), String(value.taken), String(value.entitlement - value.taken)])], selectedYear);
    } else if (id === "headcount") {
      downloadBrandedCSV("HeadcountReport", ["Branch", "Total", "Permanent", "Contract", "Active"], [headcountByBranch.map((row) => [row.branch, String(row.total), String(row.permanent), String(row.contract), String(row.active)])]);
    } else if (id === "expiry") {
      downloadBrandedCSV("ContractExpiryReport", ["ID", "Name", "Branch", "Contract End", "Days Left"], [expiringContracts.map((employee) => [employee.id, employee.name, employee.branchName, employee.contract_end ?? "", String(employee.daysLeft)])]);
    } else if (id === "p9") {
      downloadBrandedCSV("P9AnnualSummary", ["Employee ID", "Name", "KRA PIN", "Annual Gross", "Annual PAYE"], [p9.map((row) => [row.id, row.name, row.kra_pin, row.annual_gross.toFixed(2), row.annual_paye.toFixed(2)])], selectedYear);
    }
  };

  const employeeReports = [
    { id: "payslips", label: "Full Payslip History", action: () => selectedEmployee && downloadPayslipHistoryReport(selectedEmployee, payslips.filter((payslip) => payslip.employee_id === selectedEmployee.id)) },
    { id: "p9", label: "P9 Annual Tax Summary", action: () => selectedEmployee && downloadP9Report(selectedEmployee, Number(selectedYear), payslips.filter((payslip) => payslip.employee_id === selectedEmployee.id)) },
    { id: "leave", label: "Leave History Report", action: () => selectedEmployee && downloadLeaveHistoryReport(selectedEmployee, selectedEmployeeBranch, leaveRequests.filter((request) => request.employee_id === selectedEmployee.id)) },
    { id: "performance", label: "Performance History", action: () => selectedEmployee && downloadPerformanceHistoryReport(selectedEmployee, appraisals.filter((appraisal) => appraisal.employee_id === selectedEmployee.id)) },
    { id: "contracts", label: "Contract History", action: () => selectedEmployee && downloadContractHistoryReport(selectedEmployee, contracts.filter((contract) => contract.employee_id === selectedEmployee.id)) },
    { id: "expenses", label: "Expense Claims History", action: () => selectedEmployee && downloadExpenseHistoryReport(selectedEmployee, expenses.filter((expense) => expense.employee_id === selectedEmployee.id)) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate branded HR reports and employee-specific exports</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, index) => (
              <SelectItem key={month} value={String(index + 1)}>{month} {selectedYear}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["2024", "2025", "2026"].map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{report.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{report.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setActive(active === report.id ? null : report.id)}>
                {active === report.id ? "Hide" : "Generate"}
              </Button>
              <Button size="sm" variant="ghost" className="text-xs px-2" onClick={() => exportSummaryReport(report.id)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">Employee Reports</h2>
          <p className="text-sm text-muted-foreground">Generate full branded reports for a single employee.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-[320px]"><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              {employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name} ({employee.id})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["2024", "2025", "2026"].map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedEmployee ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {employeeReports.map((report) => (
              <Button key={report.id} variant="outline" className="justify-start" onClick={report.action}>
                <Download className="mr-2 h-4 w-4" /> {report.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select an employee to enable report downloads.</p>
        )}
      </div>

      {active === "payroll" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">{["Branch", "Headcount", "Gross Payroll", "Net Payroll"].map((header) => <th key={header} className="px-4 py-3 text-left font-medium text-muted-foreground">{header}</th>)}</tr></thead>
            <tbody>{payrollByBranch.map((row) => <tr key={row.branch} className="border-b border-border/50"><td className="px-4 py-3 font-medium text-card-foreground">{row.branch}</td><td className="px-4 py-3 text-card-foreground">{row.headcount}</td><td className="px-4 py-3 text-card-foreground">{formatCurrency(row.gross)}</td><td className="px-4 py-3 font-semibold text-primary">{formatCurrency(row.net)}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {active === "statutory" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">{["Statutory Item", "Employee Amount", "Employer Amount"].map((header) => <th key={header} className="px-4 py-3 text-left font-medium text-muted-foreground">{header}</th>)}</tr></thead>
            <tbody>
              {[["PAYE", statutory.paye, "-"], ["NSSF", statutory.nssf_employee, statutory.nssf_employer], ["SHA", statutory.sha, statutory.sha], ["AHL", statutory.ahl, statutory.ahl], ["NITA", statutory.nita, statutory.nita]].map(([label, employeeAmount, employerAmount]) => (
                <tr key={label as string} className="border-b border-border/50"><td className="px-4 py-3 font-medium text-card-foreground">{label}</td><td className="px-4 py-3 text-card-foreground">{typeof employeeAmount === "number" ? formatCurrency(employeeAmount) : employeeAmount}</td><td className="px-4 py-3 text-card-foreground">{typeof employerAmount === "number" ? formatCurrency(employerAmount) : employerAmount}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === "leave" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">{["Department", "Entitlement", "Taken", "Remaining"].map((header) => <th key={header} className="px-4 py-3 text-left font-medium text-muted-foreground">{header}</th>)}</tr></thead>
            <tbody>{Object.entries(leaveByDept).map(([department, value]) => <tr key={department} className="border-b border-border/50"><td className="px-4 py-3 font-medium text-card-foreground">{department}</td><td className="px-4 py-3 text-card-foreground">{value.entitlement} days</td><td className="px-4 py-3 text-card-foreground">{value.taken} days</td><td className="px-4 py-3 text-primary font-semibold">{value.entitlement - value.taken} days</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {active === "headcount" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">{["Branch", "Total", "Permanent", "Contract", "Active"].map((header) => <th key={header} className="px-4 py-3 text-left font-medium text-muted-foreground">{header}</th>)}</tr></thead>
            <tbody>{headcountByBranch.map((row) => <tr key={row.branch} className="border-b border-border/50"><td className="px-4 py-3 font-medium text-card-foreground">{row.branch}</td><td className="px-4 py-3 text-card-foreground">{row.total}</td><td className="px-4 py-3 text-card-foreground">{row.permanent}</td><td className="px-4 py-3 text-card-foreground">{row.contract}</td><td className="px-4 py-3 text-card-foreground">{row.active}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {active === "expiry" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">{["Employee", "Branch", "Contract End", "Days Left"].map((header) => <th key={header} className="px-4 py-3 text-left font-medium text-muted-foreground">{header}</th>)}</tr></thead>
            <tbody>{expiringContracts.map((employee) => <tr key={employee.id} className="border-b border-border/50"><td className="px-4 py-3 font-medium text-card-foreground">{employee.name}</td><td className="px-4 py-3 text-card-foreground">{employee.branchName}</td><td className="px-4 py-3 text-card-foreground">{employee.contract_end ? formatDate(employee.contract_end) : "-"}</td><td className={`px-4 py-3 font-semibold ${employee.daysLeft <= 30 ? "text-destructive" : "text-amber-600"}`}>{employee.daysLeft} days</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {active === "p9" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">{["ID", "Employee", "KRA PIN", "Annual Gross", "Annual PAYE"].map((header) => <th key={header} className="px-4 py-3 text-left font-medium text-muted-foreground">{header}</th>)}</tr></thead>
            <tbody>{p9.map((row) => <tr key={row.id} className="border-b border-border/50"><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.id}</td><td className="px-4 py-3 font-medium text-card-foreground">{row.name}</td><td className="px-4 py-3 font-mono text-xs text-card-foreground">{row.kra_pin}</td><td className="px-4 py-3 text-card-foreground">{formatCurrency(row.annual_gross)}</td><td className="px-4 py-3 text-destructive">{formatCurrency(row.annual_paye)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
