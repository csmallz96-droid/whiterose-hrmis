import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBranches, useEmployees, type Employee } from "@/hooks/useSupabaseData";
import { calculatePayroll } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, FileText, CheckCircle, Download, Printer, History, ChevronRight } from "lucide-react";
import StatCard from "@/components/StatCard";
import { formatDate, formatCurrency } from "@/lib/utils";
import { printPayslip, downloadPayslipPDF } from "@/utils/downloadPayslipPDF";
import { downloadBrandedCSV } from "@/utils/brandedExport";
import { downloadPayrollReport, type PayrollReportEmployee } from "@/utils/downloadPayrollReport";

const PERIOD_MONTH = 3;
const PERIOD_YEAR = 2026;
const CURRENT_PERIOD = new Date(PERIOD_YEAR, PERIOD_MONTH - 1, 1).toLocaleDateString("en-KE", { month: "long", year: "numeric" });

type PayrollRun = Tables<"payroll_runs">;
type Payslip = Tables<"payslips">;

type Totals = { gross: number; paye: number; nssf: number; sha: number; ahl: number; nita: number; net: number };

function buildPayrollRows(employees: Employee[], branches: ReturnType<typeof useBranches>["branches"]): PayrollReportEmployee[] {
  return employees.map((emp) => {
    const payroll = calculatePayroll(emp);
    const branch = branches.find((item) => item.id === emp.branch_id)?.name ?? "-";
    return {
      id: emp.id,
      name: emp.name,
      branch,
      gross: payroll.gross,
      paye: payroll.paye,
      nssf: payroll.nssf.employee,
      sha: payroll.sha,
      ahl: payroll.ahl.employee,
      nita: payroll.nita.employee,
      net: payroll.netPay,
    };
  });
}

function buildTotals(employees: Employee[]): Totals {
  return employees.reduce<Totals>((acc, emp) => {
    const payroll = calculatePayroll(emp);
    return {
      gross: acc.gross + payroll.gross,
      paye: acc.paye + payroll.paye,
      nssf: acc.nssf + payroll.nssf.employee,
      sha: acc.sha + payroll.sha,
      ahl: acc.ahl + payroll.ahl.employee,
      nita: acc.nita + payroll.nita.employee,
      net: acc.net + payroll.netPay,
    };
  }, { gross: 0, paye: 0, nssf: 0, sha: 0, ahl: 0, nita: 0, net: 0 });
}

function downloadBankCSV(employees: Employee[], periodLabel: string) {
  downloadBrandedCSV(
    "PaymentFile",
    ["Employee ID", "Employee Name", "Branch", "Bank Name", "Account Number", "M-Pesa Number", "Net Pay", "Payment Method"],
    [employees.map((emp) => {
      const payroll = calculatePayroll(emp);
      return [
        emp.id,
        emp.name,
        emp.branch_id,
        emp.bank_name ?? "",
        emp.bank_account ?? "",
        emp.mpesa_no ?? "",
        payroll.netPay.toFixed(2),
        emp.bank_account ? "Bank Transfer" : "M-Pesa",
      ];
    })],
    periodLabel,
  );
}

function RunConfirmModal({
  open,
  onClose,
  totals,
  employees,
  periodLabel,
  branches,
}: {
  open: boolean;
  onClose: () => void;
  totals: Totals;
  employees: Employee[];
  periodLabel: string;
  branches: ReturnType<typeof useBranches>["branches"];
}) {
  const reportEmployees = useMemo(() => buildPayrollRows(employees, branches), [employees, branches]);

  return (
    <Dialog open={open} onOpenChange={(state) => { if (!state) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Payroll Run Complete - {periodLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Total Employees Processed", employees.length],
                  ["Total Gross Pay", formatCurrency(totals.gross)],
                  ["Total PAYE", formatCurrency(totals.paye)],
                  ["Total NSSF", formatCurrency(totals.nssf)],
                  ["Total SHA", formatCurrency(totals.sha)],
                  ["Total AHL", formatCurrency(totals.ahl)],
                  ["Total NITA", formatCurrency(totals.nita)],
                  ["Total Net Pay", formatCurrency(totals.net)],
                ].map(([label, value], index) => (
                  <tr key={label as string} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-2 text-muted-foreground">{label}</td>
                    <td className="px-4 py-2 text-right font-semibold text-card-foreground">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 pt-1 flex-wrap">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => downloadPayrollReport(periodLabel, totals, reportEmployees)}>
              <Download className="mr-2 h-3.5 w-3.5" /> Download Payroll Report (PDF)
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => downloadBankCSV(employees, periodLabel)}>
              <Download className="mr-2 h-3.5 w-3.5" /> Download for Bank (CSV)
            </Button>
            <Button size="sm" className="w-full" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PayrollHistoryTab({ branches, runs }: { branches: ReturnType<typeof useBranches>["branches"]; runs: PayrollRun[] }) {
  const navigate = useNavigate();
  const { employees } = useEmployees();

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      approved: "bg-green-100 text-green-800",
      disbursed: "bg-blue-100 text-blue-800",
    };
    return <Badge className={`${map[status] ?? "bg-gray-100 text-gray-700"} border-0 capitalize`}>{status}</Badge>;
  };

  const getPeriodLabel = (run: PayrollRun) => new Date(run.period_year, run.period_month - 1, 1).toLocaleDateString("en-KE", { month: "long", year: "numeric" });

  const exportRun = async (run: PayrollRun, type: "csv" | "pdf") => {
    const { data } = await supabase.from("payslips").select("*").eq("payroll_run_id", run.id).order("employee_id");
    const slips = data ?? [];
    const reportEmployees = slips.map((slip) => {
      const employee = employees.find((item) => item.id === slip.employee_id);
      const branch = branches.find((item) => item.id === employee?.branch_id)?.name ?? "-";
      return {
        id: slip.employee_id,
        name: employee?.name ?? slip.employee_id,
        branch,
        gross: slip.gross_salary,
        paye: slip.paye,
        nssf: slip.nssf,
        sha: slip.sha,
        ahl: slip.ahl,
        nita: slip.nita,
        net: slip.net_salary,
      };
    });

    if (type === "pdf") {
      downloadPayrollReport(getPeriodLabel(run), {
        gross: run.total_gross,
        paye: run.total_paye,
        nssf: run.total_nssf,
        sha: run.total_sha,
        ahl: run.total_ahl,
        nita: run.total_nita,
        net: run.total_net,
      }, reportEmployees);
      return;
    }

    downloadBrandedCSV(
      "PayrollReport",
      ["Employee ID", "Name", "Branch", "Gross", "PAYE", "NSSF", "SHA", "AHL", "NITA", "Net Pay"],
      [reportEmployees.map((employee) => [employee.id, employee.name, employee.branch, employee.gross.toFixed(2), employee.paye.toFixed(2), employee.nssf.toFixed(2), employee.sha.toFixed(2), employee.ahl.toFixed(2), employee.nita.toFixed(2), employee.net.toFixed(2)])],
      getPeriodLabel(run),
    );
  };

  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No payroll runs on record yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Employees</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Gross</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Net</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Approved By</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date Run</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium text-card-foreground">{getPeriodLabel(run)}</td>
              <td className="px-4 py-3 text-center">{statusBadge(run.status)}</td>
              <td className="px-4 py-3 text-center text-card-foreground">{employees.length}</td>
              <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(run.total_gross)}</td>
              <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(run.total_net)}</td>
              <td className="px-4 py-3 text-card-foreground">{run.approved_by ?? "-"}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(run.created_at.split("T")[0])}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1 flex-wrap">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => navigate(`/payroll/history/${run.id}`)}>
                    <ChevronRight className="h-3 w-3 mr-1" /> View Report
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => exportRun(run, "pdf")}>
                    <Download className="h-3 w-3 mr-1" /> PDF
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => exportRun(run, "csv")}>
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Payroll() {
  const { branches } = useBranches();
  const { employees, loading, error } = useEmployees();
  const { employee: currentUser } = useAuth();
  const [tab, setTab] = useState<"run" | "history">("run");
  const [branchFilter, setBranchFilter] = useState("all");
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [runDone, setRunDone] = useState(false);
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const filtered = branchFilter === "all" ? employees : employees.filter((employee) => employee.branch_id === branchFilter);
  const totals = useMemo(() => buildTotals(filtered), [filtered]);

  const fetchRuns = async () => {
    const { data } = await supabase.from("payroll_runs").select("*").order("created_at", { ascending: false });
    const payrollRuns = data ?? [];
    setRuns(payrollRuns);
    setRunDone(payrollRuns.some((run) => run.period_month === PERIOD_MONTH && run.period_year === PERIOD_YEAR));
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const exportPayrollCsv = () => {
    const reportEmployees = buildPayrollRows(filtered, branches);
    downloadBrandedCSV(
      "PayrollReport",
      ["ID", "Name", "Branch", "Gross", "PAYE", "NSSF", "SHA", "AHL", "NITA", "Net Pay"],
      [reportEmployees.map((employee) => [employee.id, employee.name, employee.branch, employee.gross.toFixed(2), employee.paye.toFixed(2), employee.nssf.toFixed(2), employee.sha.toFixed(2), employee.ahl.toFixed(2), employee.nita.toFixed(2), employee.net.toFixed(2)])],
      CURRENT_PERIOD,
    );
  };

  const handleRunPayroll = async () => {
    if (runDone || running) return;
    setRunning(true);

    const runInsert = {
      period_month: PERIOD_MONTH,
      period_year: PERIOD_YEAR,
      approved_by: currentUser?.id ?? null,
      approved_at: new Date().toISOString(),
      status: "approved",
      total_gross: totals.gross,
      total_net: totals.net,
      total_paye: totals.paye,
      total_nssf: totals.nssf,
      total_sha: totals.sha,
      total_ahl: totals.ahl,
      total_nita: totals.nita,
    };

    const { data: runData, error: runError } = await supabase.from("payroll_runs").insert(runInsert).select("*").single();

    if (runError) {
      setRunning(false);
      throw runError;
    }

    const slips: TablesInsert<"payslips">[] = employees.map((employee) => {
      const payroll = calculatePayroll(employee);
      return {
        payroll_run_id: runData.id,
        employee_id: employee.id,
        period_month: PERIOD_MONTH,
        period_year: PERIOD_YEAR,
        gross_salary: payroll.gross,
        basic_salary: employee.basic_salary,
        house_allowance: employee.house_allowance,
        transport_allowance: employee.transport_allowance,
        paye: payroll.paye,
        nssf: payroll.nssf.employee,
        sha: payroll.sha,
        ahl: payroll.ahl.employee,
        nita: payroll.nita.employee,
        other_deductions: 0,
        net_salary: payroll.netPay,
      };
    });

    const { error: slipsError } = await supabase.from("payslips").insert(slips);
    if (slipsError) {
      setRunning(false);
      throw slipsError;
    }

    setRunning(false);
    setRunDone(true);
    setShowConfirm(true);
    await fetchRuns();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-sm text-muted-foreground">{CURRENT_PERIOD} - Monthly Payroll Cycle</p>
        </div>
        {tab === "run" && (
          <div className="flex items-center gap-2 flex-wrap">
            {runDone
              ? <Badge className="bg-green-100 text-green-800 border-0">Processed</Badge>
              : <Badge variant="outline" className="border-primary/30 text-primary">Draft</Badge>}
            <Button variant="outline" onClick={exportPayrollCsv}><Download className="mr-2 h-4 w-4" /> Download CSV</Button>
            <Button onClick={handleRunPayroll} disabled={runDone || running}>
              {running ? "Processing..." : runDone ? "Payroll Run Complete" : "Run Payroll"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {(["run", "history"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === value ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground"}`}
          >
            {value === "run" ? "Run Payroll" : "Payroll History"}
          </button>
        ))}
      </div>

      {tab === "run" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Wallet} title="Gross Payroll" value={formatCurrency(totals.gross)} />
            <StatCard icon={FileText} title="Total Deductions" value={formatCurrency(totals.paye + totals.nssf + totals.sha + totals.ahl + totals.nita)} />
            <StatCard icon={CheckCircle} title="Net Payroll" value={formatCurrency(totals.net)} />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">Statutory Deductions Summary</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[['PAYE', totals.paye], ['NSSF', totals.nssf], ['SHA', totals.sha], ['AHL', totals.ahl], ['NITA', totals.nita]].map(([label, value]) => (
                <div key={label as string} className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-bold text-card-foreground">{formatCurrency(value as number)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Branches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {error && <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">{error}</div>}

          {loading ? (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-pulse">
              <div className="h-10 bg-muted/50 border-b border-border" />
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex gap-4 px-4 py-3 border-b border-border/50">{[...Array(7)].map((__, cell) => <div key={cell} className="h-4 flex-1 rounded bg-muted" />)}</div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Employee', 'Gross', 'PAYE', 'NSSF', 'SHA', 'AHL', 'NITA', 'Net Pay', 'Actions'].map((header) => (
                      <th key={header} className={`px-4 py-3 font-medium text-muted-foreground ${header === 'Employee' || header === 'Actions' ? 'text-left' : 'text-right'}`}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((employee) => {
                    const payroll = calculatePayroll(employee);
                    const branchName = branches.find((branch) => branch.id === employee.branch_id)?.name ?? "-";
                    return (
                      <tr key={employee.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3"><p className="font-medium text-card-foreground">{employee.name}</p><p className="text-xs text-muted-foreground">{employee.job_title}</p></td>
                        <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(payroll.gross)}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(payroll.paye)}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(payroll.nssf.employee)}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(payroll.sha)}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(payroll.ahl.employee)}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(payroll.nita.employee)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(payroll.netPay)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => printPayslip(employee, branchName, CURRENT_PERIOD)}>
                              <Printer className="h-3 w-3 mr-1" /> Print
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => downloadPayslipPDF(employee, branchName, CURRENT_PERIOD)}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <PayrollHistoryTab branches={branches} runs={runs} />
      )}

      <RunConfirmModal open={showConfirm} onClose={() => setShowConfirm(false)} totals={totals} employees={employees} periodLabel={CURRENT_PERIOD} branches={branches} />
    </div>
  );
}
