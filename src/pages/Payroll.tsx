import { useState, useRef } from "react";
import { useBranches, useEmployees, type Employee } from "@/hooks/useSupabaseData";
import { calculatePayroll } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Wallet, FileText, CheckCircle, Download, Printer } from "lucide-react";
import StatCard from "@/components/StatCard";
import { formatDate, formatCurrency } from "@/lib/utils";

const CURRENT_MONTH = "March 2026";

// ─── Payslip Component (also used for printing) ───────────────────────────────

interface PayslipProps {
  emp: Employee;
  branchName: string;
  period: string;
}

function Payslip({ emp, branchName, period }: PayslipProps) {
  const p = calculatePayroll(emp);

  return (
    <div id="payslip-print" className="bg-white text-gray-900 font-sans" style={{ minWidth: 480 }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#2B3990] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Whiterose" className="h-12 w-auto rounded" />
          <div>
            <p className="font-bold text-[#2B3990] text-base leading-tight">Whiterose Venyou Enterprises Ltd</p>
            <p className="text-xs text-gray-500">Mombasa, Kenya · NSSF No: 2446614X</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm text-[#2B3990]">PAYSLIP</p>
          <p className="text-xs text-gray-500">Pay Period: {period}</p>
        </div>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4 text-sm">
        {[
          ["Employee ID", emp.id],
          ["Name", emp.name],
          ["Job Title", emp.job_title],
          ["Branch", branchName],
          ["NSSF No.", emp.nssf_no],
          ["KRA PIN", emp.kra_pin],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <span className="text-gray-500 min-w-[90px]">{label}:</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Earnings + Deductions */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <p className="text-xs font-bold uppercase text-[#2B3990] mb-2 border-b border-gray-200 pb-1">Earnings</p>
          <div className="space-y-1 text-sm">
            {[
              ["Basic Salary", emp.basic_salary],
              ["House Allowance", emp.house_allowance],
              ["Transport Allowance", emp.transport_allowance],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-gray-600">{label}</span>
                <span>{formatCurrency(val as number)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1">
              <span>Gross Pay</span>
              <span>{formatCurrency(p.gross)}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-[#2B3990] mb-2 border-b border-gray-200 pb-1">Deductions</p>
          <div className="space-y-1 text-sm">
            {[
              ["PAYE", p.paye],
              ["NSSF (Employee)", p.nssf.employee],
              ["SHA (2.75%)", p.sha],
              ["AHL (1.5%)", p.ahl.employee],
              ["NITA", p.nita.employee],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-gray-600">{label}</span>
                <span className="text-red-600">{formatCurrency(val as number)}</span>
              </div>
            ))}
            <div className="flex justify-between text-gray-500 text-xs mt-1">
              <span>Total Deductions</span>
              <span>{formatCurrency(p.totalDeductions)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Pay */}
      <div className="flex justify-between items-center bg-[#2B3990] text-white rounded-lg px-4 py-3">
        <span className="font-bold text-sm">NET PAY</span>
        <span className="font-bold text-lg">{formatCurrency(p.netPay, 2)}</span>
      </div>

      <p className="text-center text-xs text-gray-400 mt-3">
        This payslip is computer-generated and does not require a signature.
      </p>
    </div>
  );
}

// ─── Main Payroll Page ────────────────────────────────────────────────────────

export default function Payroll() {
  const { branches } = useBranches();
  const { employees, loading, error } = useEmployees();
  const { employee: currentUser } = useAuth();
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [runDone, setRunDone] = useState(false);
  const [running, setRunning] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = branchFilter === "all" ? employees : employees.filter((e) => e.branch_id === branchFilter);

  const totals = filtered.reduce(
    (acc, emp) => {
      const p = calculatePayroll(emp);
      return {
        gross: acc.gross + p.gross,
        paye: acc.paye + p.paye,
        nssf: acc.nssf + p.nssf.employee,
        sha: acc.sha + p.sha,
        ahl: acc.ahl + p.ahl.employee,
        nita: acc.nita + p.nita.employee,
        net: acc.net + p.netPay,
      };
    },
    { gross: 0, paye: 0, nssf: 0, sha: 0, ahl: 0, nita: 0, net: 0 }
  );

  // CSV export
  const downloadCSV = () => {
    const headers = ["ID", "Name", "Branch", "Job Title", "Gross", "PAYE", "NSSF", "SHA", "AHL", "NITA", "Net Pay"];
    const rows = filtered.map((emp) => {
      const p = calculatePayroll(emp);
      const branch = branches.find((b) => b.id === emp.branch_id);
      return [
        emp.id,
        emp.name,
        branch?.name ?? "",
        emp.job_title,
        p.gross.toFixed(2),
        p.paye.toFixed(2),
        p.nssf.employee.toFixed(2),
        p.sha.toFixed(2),
        p.ahl.employee.toFixed(2),
        p.nita.employee.toFixed(2),
        p.netPay.toFixed(2),
      ].join(",");
    });
    const totalsRow = [
      "TOTAL", "", "", "",
      totals.gross.toFixed(2),
      totals.paye.toFixed(2),
      totals.nssf.toFixed(2),
      totals.sha.toFixed(2),
      totals.ahl.toFixed(2),
      totals.nita.toFixed(2),
      totals.net.toFixed(2),
    ].join(",");
    const csv = [headers.join(","), ...rows, totalsRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Whiterose_Payroll_${CURRENT_MONTH.replace(" ", "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run payroll — save to payroll_runs + payslips
  const handleRunPayroll = async () => {
    if (runDone) return;
    setRunning(true);
    const period = CURRENT_MONTH;
    // Insert payroll_run record
    const { data: runData, error: runErr } = await supabase.from("payroll_runs").insert({
      period,
      run_by: currentUser?.id ?? null,
      status: "approved",
      total_gross: totals.gross,
      total_net: totals.net,
      total_paye: totals.paye,
      total_nssf: totals.nssf,
      total_sha: totals.sha,
      total_ahl: totals.ahl,
      total_nita: totals.nita,
    }).select("id").single();

    if (!runErr && runData) {
      const payslipRecords = employees.map((emp) => {
        const p = calculatePayroll(emp);
        return {
          employee_id: emp.id,
          payroll_run_id: runData.id,
          period,
          gross_pay: p.gross,
          net_pay: p.netPay,
          paye: p.paye,
          nssf_employee: p.nssf.employee,
          nssf_employer: p.nssf.employer,
          sha: p.sha,
          ahl_employee: p.ahl.employee,
          ahl_employer: p.ahl.employer,
          nita: p.nita.employee,
          basic_salary: emp.basic_salary,
          house_allowance: emp.house_allowance,
          transport_allowance: emp.transport_allowance,
        };
      });
      await supabase.from("payslips").insert(payslipRecords);
    }
    setRunning(false);
    setRunDone(true);
  };

  // Print payslip
  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank", "width=700,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Payslip</title>
      <style>
        body { font-family: sans-serif; margin: 24px; font-size: 13px; }
        * { box-sizing: border-box; }
      </style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-sm text-muted-foreground">{CURRENT_MONTH} — Monthly Payroll Cycle</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {runDone && <Badge variant="outline" className="border-green-400/50 text-green-700">Processed</Badge>}
          {!runDone && <Badge variant="outline" className="border-primary/30 text-primary">Draft</Badge>}
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </Button>
          <Button onClick={handleRunPayroll} disabled={runDone || running}>
            {running ? "Processing…" : runDone ? "Payroll Run ✓" : "Run Payroll"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} title="Gross Payroll" value={formatCurrency(totals.gross)} />
        <StatCard icon={FileText} title="Total Deductions" value={formatCurrency(totals.paye + totals.nssf + totals.sha + totals.ahl + totals.nita)} />
        <StatCard icon={CheckCircle} title="Net Payroll" value={formatCurrency(totals.net)} />
      </div>

      {/* Statutory Summary */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-card-foreground">Statutory Deductions Summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "PAYE", value: totals.paye },
            { label: "NSSF", value: totals.nssf },
            { label: "SHA", value: totals.sha },
            { label: "AHL", value: totals.ahl },
            { label: "NITA", value: totals.nita },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-card-foreground">{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Payroll Table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-pulse">
          <div className="h-10 bg-muted/50 border-b border-border" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/50">
              {[...Array(7)].map((__, j) => <div key={j} className="h-4 flex-1 rounded bg-muted" />)}
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-card-foreground">No payroll data</p>
          <p className="text-xs text-muted-foreground mt-1">No employees found for the selected branch.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">PAYE</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">NSSF</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">SHA</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">AHL</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">NITA</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net Pay</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const p = calculatePayroll(emp);
                return (
                  <tr key={emp.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(p.gross)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(p.paye)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(p.nssf.employee)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(p.sha)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(p.ahl.employee)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(p.nita.employee)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(p.netPay)}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setSelectedEmp(emp)}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Payslip
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="bg-muted/30 font-semibold border-t-2 border-border">
                <td className="px-4 py-3 text-card-foreground">TOTALS</td>
                <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(totals.gross)}</td>
                <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(totals.paye)}</td>
                <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(totals.nssf)}</td>
                <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(totals.sha)}</td>
                <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(totals.ahl)}</td>
                <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(totals.nita)}</td>
                <td className="px-4 py-3 text-right text-primary">{formatCurrency(totals.net)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Payslip Modal */}
      <Dialog open={!!selectedEmp} onOpenChange={(open) => { if (!open) setSelectedEmp(null); }}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-card-foreground">Payslip — {CURRENT_MONTH}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print / PDF
              </Button>
            </div>
          </div>
          <div ref={printRef}>
            {selectedEmp && (
              <Payslip
                emp={selectedEmp}
                branchName={branches.find((b) => b.id === selectedEmp.branch_id)?.name ?? "—"}
                period={CURRENT_MONTH}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
